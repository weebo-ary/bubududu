const ID = /^[A-Za-z0-9_-]{5,200}$/;

export function parseDriveLink(value) {
  try {
    const url = new URL(value);
    if (
      url.protocol !== "https:" ||
      url.hostname !== "drive.google.com" ||
      url.username ||
      url.password ||
      url.port
    )
      return null;
    const folder = url.pathname.match(
      /^\/drive(?:\/u\/\d+)?\/folders\/([A-Za-z0-9_-]+)\/?$/,
    );
    const file = url.pathname.match(/^\/file\/d\/([A-Za-z0-9_-]+)(?:\/|$)/);
    const type = folder || url.pathname === "/folderview" ? "folder" : "file";
    const id =
      folder?.[1] ||
      file?.[1] ||
      (["/open", "/uc", "/thumbnail", "/folderview"].includes(url.pathname)
        ? url.searchParams.get("id")
        : null);
    const resourceKey = url.searchParams.get("resourcekey") || "";
    if (!id || !ID.test(id) || (resourceKey && !ID.test(resourceKey)))
      return null;
    return { type, id, resourceKey };
  } catch {
    return null;
  }
}

export function drivePhotoUrl(id, resourceKey = "", size = 1600) {
  const query = new URLSearchParams({ id, size: String(size) });
  if (resourceKey) query.set("resourcekey", resourceKey);
  return `/api/drive-photo?${query}`;
}

export class DriveFolderError extends Error {
  constructor(message, status = 502, code = "DRIVE_ERROR") {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export async function listDriveFolder({
  folder,
  apiKey,
  pageToken = "",
  fetchImpl = fetch,
}) {
  if (!apiKey)
    throw new DriveFolderError(
      "Folder albums need a Google Drive API key. Add GOOGLE_DRIVE_API_KEY to the server environment, enable Google Drive API, and restart the app.",
      503,
      "DRIVE_SETUP_REQUIRED",
    );
  if (!folder || folder.type !== "folder" || !ID.test(folder.id))
    throw new DriveFolderError(
      "Paste a full Google Drive folder sharing link.",
      400,
      "INVALID_FOLDER",
    );
  if (typeof pageToken !== "string" || pageToken.length > 4096)
    throw new DriveFolderError(
      "This album page is invalid. Refresh the album.",
      400,
      "INVALID_PAGE",
    );
  const headers = folder.resourceKey
    ? { "X-Goog-Drive-Resource-Keys": `${folder.id}/${folder.resourceKey}` }
    : {};
  async function google(path, params) {
    const query = new URLSearchParams({ ...params, key: apiKey });
    const response = await fetchImpl(
      `https://www.googleapis.com/drive/v3/${path}?${query}`,
      { headers, cache: "no-store", signal: AbortSignal.timeout(15000) },
    );
    const data = await response.json();
    if (!response.ok) {
      const reason = data.error?.errors?.[0]?.reason;
      if (
        response.status === 429 ||
        reason === "dailyLimitExceeded" ||
        reason === "rateLimitExceeded"
      )
        throw new DriveFolderError(
          "Google Drive is busy right now. Please try the album again shortly.",
          429,
          "DRIVE_RATE_LIMIT",
        );
      if (response.status === 400 && pageToken)
        throw new DriveFolderError(
          "This album page has expired. Refresh the album to start again.",
          400,
          "INVALID_PAGE",
        );
      if (
        response.status === 403 &&
        (reason === "accessNotConfigured" ||
          reason === "keyInvalid" ||
          reason === "ipRefererBlocked")
      )
        throw new DriveFolderError(
          "The server Google Drive API key needs configuration. Enable Drive API and check the key restrictions.",
          503,
          "DRIVE_SETUP_REQUIRED",
        );
      if (response.status === 404 || response.status === 403)
        throw new DriveFolderError(
          "This folder is not publicly readable. Set its general access to Anyone with the link, and make sure the photos inherit that access.",
          422,
          "FOLDER_NOT_PUBLIC",
        );
      throw new DriveFolderError(
        "Google Drive could not load this album. Check the server API key and try again.",
        502,
      );
    }
    return data;
  }
  const metadata = await google(`files/${folder.id}`, {
    fields: "id,name,mimeType",
    supportsAllDrives: "true",
  });
  if (metadata.mimeType !== "application/vnd.google-apps.folder")
    throw new DriveFolderError(
      "That link does not point to a Google Drive folder.",
      400,
      "INVALID_FOLDER",
    );
  const listing = await google("files", {
    q: `'${folder.id}' in parents and trashed = false and mimeType contains 'image/'`,
    fields: "nextPageToken,files(id,name,mimeType,resourceKey)",
    orderBy: "name_natural",
    pageSize: "100",
    spaces: "drive",
    supportsAllDrives: "true",
    includeItemsFromAllDrives: "true",
    ...(pageToken ? { pageToken } : {}),
  });
  const photos = (listing.files || [])
    .filter((file) => ID.test(file.id) && file.mimeType?.startsWith("image/"))
    .map((file) => {
      const key =
        file.resourceKey && ID.test(file.resourceKey) ? file.resourceKey : "";
      return {
        id: file.id,
        name: file.name || "Our photo",
        url: drivePhotoUrl(file.id, key),
        thumbnail: drivePhotoUrl(file.id, key, 240),
        originalUrl: `https://drive.google.com/file/d/${file.id}/view${key ? `?resourcekey=${encodeURIComponent(key)}` : ""}`,
      };
    });
  return {
    folderName: metadata.name,
    photos,
    nextPageToken: listing.nextPageToken || null,
  };
}
