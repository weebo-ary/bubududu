export const couple = {
  names: ["Bubu", "Dudu"],
  togetherSince: "2024-02-14",
  anniversaryIsSample: true,
  photos: [], // { url: 'https://drive.google.com/file/d/FILE_ID/view', caption: 'Our first trip' }
  songUrl: "https://open.spotify.com/track/5MCbGWnNLLjoHpbDO3BOgi",
  songTitle: "Gehra Hua",
  places: [
    { title: "Where it all began", query: "" },
    { title: "Our first date", query: "" },
    { title: "Our favorite escape", query: "" },
  ],
};
export function driveImage(url) {
  try {
    const u = new URL(url);
    if (!["drive.google.com", "lh3.googleusercontent.com"].includes(u.hostname))
      return "";
    const id =
      u.pathname.match(/\/d\/([^/]+)/)?.[1] || u.searchParams.get("id");
    return id
      ? `https://drive.google.com/thumbnail?id=${encodeURIComponent(id)}&sz=w1600`
      : u.hostname === "lh3.googleusercontent.com"
        ? url
        : "";
  } catch {
    return "";
  }
}
