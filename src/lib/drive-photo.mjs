const ID = /^[A-Za-z0-9_-]{5,200}$/;
const BROWSER_IMAGES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);

function googleImageUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      !url.port &&
      (url.hostname.endsWith(".googleusercontent.com") ||
        url.hostname === "drive.google.com" ||
        url.hostname === "lh3.google.com")
      ? url
      : null;
  } catch {
    return null;
  }
}

// Google supplies short-lived thumbnail links; fetch a fresh one on the server.
export async function fetchDrivePhoto({
  id,
  resourceKey = "",
  size = 1600,
  apiKey,
  fetchImpl = fetch,
}) {
  if (!ID.test(id || "") || (resourceKey && !ID.test(resourceKey)))
    return Response.json({ error: "Invalid photo link." }, { status: 400 });
  if (!apiKey)
    return Response.json(
      { error: "Google Drive API key is not configured." },
      { status: 503 },
    );
  const width = size === 240 ? 240 : 1600;
  const headers = resourceKey
    ? { "X-Goog-Drive-Resource-Keys": `${id}/${resourceKey}` }
    : {};
  const params = new URLSearchParams({
    key: apiKey,
    fields: "id,mimeType,thumbnailLink",
    supportsAllDrives: "true",
  });
  const metadataResponse = await fetchImpl(
    `https://www.googleapis.com/drive/v3/files/${id}?${params}`,
    { headers, cache: "no-store", signal: AbortSignal.timeout(15000) },
  );
  if (!metadataResponse.ok)
    return Response.json(
      { error: "Google Drive could not open this photo." },
      { status: metadataResponse.status === 404 ? 404 : 502 },
    );
  const metadata = await metadataResponse.json();
  if (!metadata.mimeType?.startsWith("image/"))
    return Response.json(
      { error: "This file is not a photo." },
      { status: 415 },
    );
  const candidates = [];
  const thumbnail = googleImageUrl(metadata.thumbnailLink);
  if (thumbnail) {
    thumbnail.href = thumbnail.href.replace(/=s\d+(?=$|&)/, `=s${width}`);
    candidates.push({ url: thumbnail.href, headers: {} });
  }
  // Original bytes are a fallback for images with no generated thumbnail.
  if (BROWSER_IMAGES.has(metadata.mimeType))
    candidates.push({
      url: `https://www.googleapis.com/drive/v3/files/${id}?${new URLSearchParams({ key: apiKey, alt: "media" })}`,
      headers,
    });
  for (const candidate of candidates) {
    try {
      let response = await fetchImpl(candidate.url, {
        headers: candidate.headers,
        cache: "no-store",
        redirect: "manual",
        signal: AbortSignal.timeout(20000),
      });
      // Follow only Google's image hosts. Never forward the API key to a redirect.
      for (
        let hop = 0;
        hop < 3 && [301, 302, 303, 307, 308].includes(response.status);
        hop++
      ) {
        const redirect = googleImageUrl(response.headers.get("location"));
        if (!redirect) break;
        response = await fetchImpl(redirect.href, {
          cache: "no-store",
          redirect: "manual",
          signal: AbortSignal.timeout(20000),
        });
      }
      const type = (response.headers.get("content-type") || "")
        .split(";")[0]
        .toLowerCase();
      if (response.ok && BROWSER_IMAGES.has(type))
        return new Response(response.body, {
          headers: {
            "Content-Type": type,
            "Cache-Control": "private, no-store",
            "X-Content-Type-Options": "nosniff",
          },
        });
      await response.body?.cancel();
    } catch {
      /* Try original image bytes if thumbnail delivery failed. */
    }
  }
  return Response.json(
    { error: "Google Drive could not render this image." },
    { status: 422, headers: { "Cache-Control": "private, no-store" } },
  );
}
