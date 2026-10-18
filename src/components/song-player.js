import { couple } from "@/config/couple";

export function spotifyEmbedUrl(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.hostname !== "open.spotify.com")
      return "";
    const track = url.pathname.match(
      /^\/(?:intl-[a-z]+\/)?track\/([A-Za-z0-9]{22})\/?$/,
    );
    return track ? `https://open.spotify.com/embed/track/${track[1]}` : "";
  } catch {
    return "";
  }
}

export default function SongPlayer({
  url = couple.songUrl,
  title = couple.songTitle || "Our song",
}) {
  const embed = spotifyEmbedUrl(url);
  if (!embed) return null;
  return (
    <div className="shared-song-player">
      <iframe
        src={embed}
        title={`Spotify: ${title}`}
        width="100%"
        height="152"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        allowFullScreen
        loading="lazy"
      />
      <a href={url} target="_blank" rel="noreferrer">
        Listen on Spotify ↗
      </a>
    </div>
  );
}
