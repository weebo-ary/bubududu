/* eslint-disable @next/next/no-img-element -- Display public Google Drive photos directly. */
"use client";
import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  FolderHeart,
  Images,
  Maximize2,
  RefreshCw,
  X,
} from "lucide-react";
import { parseDriveLink, drivePhotoUrl } from "@/lib/google-drive.mjs";
import { driveImage } from "@/config/couple";

export default function DrivePhotoAlbum({ url, title }) {
  const link = parseDriveLink(url);
  if (link?.type === "folder")
    return <FolderAlbum key={url} url={url} title={title} />;
  return (
    <PhotoViewer
      photos={[
        {
          id: url,
          name: title,
          url: link
            ? drivePhotoUrl(link.id, link.resourceKey)
            : driveImage(url),
          thumbnail: link
            ? drivePhotoUrl(link.id, link.resourceKey, 240)
            : driveImage(url),
          originalUrl: url,
        },
      ]}
      title={title}
    />
  );
}

async function fetchAlbumPage(url, pageToken, signal) {
  const params = new URLSearchParams({ url });
  if (pageToken) params.set("pageToken", pageToken);
  const response = await fetch("/api/drive-folder?" + params, {
    signal,
    cache: "no-store",
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.error || "We could not open this album.");
  return data;
}

function FolderAlbum({ url, title }) {
  const [photos, setPhotos] = useState([]);
  const [name, setName] = useState(title);
  const [next, setNext] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const controller = useRef(null);
  useEffect(() => {
    const pending = new AbortController();
    controller.current = pending;
    fetchAlbumPage(url, "", pending.signal)
      .then((data) => {
        if (pending.signal.aborted) return;
        setPhotos(data.photos);
        setName(data.folderName || title);
        setNext(data.nextPageToken);
        setError("");
      })
      .catch((error) => {
        if (!pending.signal.aborted)
          setError(error.message || "Please try again.");
      })
      .finally(() => {
        if (!pending.signal.aborted) setLoading(false);
      });
    return () => {
      pending.abort();
      controller.current?.abort();
    };
  }, [url, title, revision]);
  async function load(pageToken) {
    const pending = new AbortController();
    controller.current = pending;
    try {
      const data = await fetchAlbumPage(url, pageToken, pending.signal);
      if (pending.signal.aborted) return;
      setPhotos((previous) => [
        ...new Map(
          [...previous, ...data.photos].map((photo) => [photo.id, photo]),
        ).values(),
      ]);
      setNext(data.nextPageToken);
      setError("");
    } catch (error) {
      if (!pending.signal.aborted)
        setError(error.message || "Please try again.");
    } finally {
      if (!pending.signal.aborted) setLoading(false);
    }
  }
  return (
    <div className="drive-album">
      <div className="album-header">
        <span className="album-folder-icon">
          <FolderHeart size={20} />
        </span>
        <div>
          <strong>{name}</strong>
          <small>
            {photos.length}
            {next ? "+" : ""} photos{" "}
            {photos.length ? "· arranged by filename" : ""}
          </small>
        </div>
        <button
          type="button"
          className="icon-button"
          aria-label="Refresh album photos"
          disabled={loading}
          onClick={() => {
            setLoading(true);
            setError("");
            setRevision((v) => v + 1);
          }}
        >
          <RefreshCw size={15} className={loading ? "refreshing" : ""} />
        </button>
      </div>
      {loading && !photos.length && (
        <div className="album-message" role="status">
          <Images size={28} />
          <p>Opening your little collection of memories...</p>
        </div>
      )}
      {error && (
        <div className="album-message album-error" role="alert">
          <FolderHeart size={28} />
          <p>{error}</p>
          <button
            type="button"
            className="workspace-button"
            onClick={() => {
              setLoading(true);
              setRevision((v) => v + 1);
            }}
          >
            Try again
          </button>
          <a href={url} target="_blank" rel="noreferrer">
            Open folder in Google Drive <ArrowUpRight size={13} />
          </a>
        </div>
      )}
      {photos.length > 0 && <PhotoViewer photos={photos} title={title} />}
      {!loading && !error && !photos.length && (
        <div className="album-message">
          <Images size={28} />
          <h3>This album is waiting for its first photo.</h3>
          <p>
            Add images directly inside this Drive folder, then refresh here.
            Subfolders and videos are not included.
          </p>
        </div>
      )}
      {next && (
        <div className="album-load-more">
          <button
            type="button"
            className="workspace-button"
            disabled={loading}
            onClick={() => {
              setLoading(true);
              load(next);
            }}
          >
            {loading ? "Loading photos..." : "Load more photos"}
          </button>
        </div>
      )}
    </div>
  );
}

function PhotoViewer({ photos, title }) {
  const [index, setIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const previousFocus = useRef(null);
  const dialog = useRef(null);
  const closeButton = useRef(null);
  const activeIndex = Math.min(index, photos.length - 1);
  const photo = photos[activeIndex];
  function move(amount) {
    setIndex(
      (current) =>
        (Math.min(current, photos.length - 1) + amount + photos.length) %
        photos.length,
    );
  }
  useEffect(() => {
    if (!expanded) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButton.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      previousFocus.current?.focus();
    };
  }, [expanded]);
  function keys(event) {
    if (event.key === "Escape") {
      setExpanded(false);
      return;
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      move(-1);
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      move(1);
    }
    if (expanded && event.key === "Tab") {
      const controls = [
        ...dialog.current.querySelectorAll("button:not(:disabled), a[href]"),
      ];
      const first = controls[0],
        last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }
  }
  return (
    <div className="album-viewer" onKeyDown={keys}>
      <div className="album-stage">
        <PhotoImage key={photo.id} photo={photo} />
        {photos.length > 1 && (
          <>
            <button
              type="button"
              className="album-arrow previous"
              aria-label="Previous photo"
              onClick={() => move(-1)}
            >
              <ChevronLeft size={22} />
            </button>
            <button
              type="button"
              className="album-arrow next"
              aria-label="Next photo"
              onClick={() => move(1)}
            >
              <ChevronRight size={22} />
            </button>
          </>
        )}
        <button
          type="button"
          className="album-expand"
          aria-label="Expand photo"
          onClick={(event) => {
            previousFocus.current = event.currentTarget;
            setExpanded(true);
          }}
        >
          <Maximize2 size={16} />
        </button>
        <span className="album-count" aria-live="polite">
          {activeIndex + 1} / {photos.length}
        </span>
      </div>
      <div className="album-caption">
        <span>
          <strong>{photo.name}</strong>
          <small>{title}</small>
        </span>
        <a
          href={photo.originalUrl}
          target="_blank"
          rel="noreferrer"
          aria-label="Open this photo in Google Drive"
        >
          <ArrowUpRight size={16} />
        </a>
      </div>
      {photos.length > 1 && (
        <div className="album-thumbnails" aria-label="Choose a photo">
          {photos.map((item, i) => (
            <button
              type="button"
              key={item.id}
              aria-label={`Show photo ${i + 1}: ${item.name}`}
              aria-pressed={activeIndex === i}
              onClick={() => setIndex(i)}
            >
              <img loading="lazy" src={item.thumbnail} alt="" />
            </button>
          ))}
        </div>
      )}
      {expanded && (
        <div
          className="album-lightbox"
          ref={dialog}
          role="dialog"
          aria-modal="true"
          aria-label={`${title}: ${photo.name}`}
          onClick={(e) => {
            if (e.target === e.currentTarget) setExpanded(false);
          }}
        >
          <button
            type="button"
            className="album-close"
            ref={closeButton}
            aria-label="Close photo"
            onClick={() => setExpanded(false)}
          >
            <X size={23} />
          </button>
          {photos.length > 1 && (
            <button
              type="button"
              className="album-arrow previous"
              aria-label="Previous photo"
              onClick={() => move(-1)}
            >
              <ChevronLeft size={25} />
            </button>
          )}
          <PhotoImage key={photo.id} photo={photo} />
          {photos.length > 1 && (
            <button
              type="button"
              className="album-arrow next"
              aria-label="Next photo"
              onClick={() => move(1)}
            >
              <ChevronRight size={25} />
            </button>
          )}
          <div className="album-lightbox-caption">
            <span>{photo.name}</span>
            <strong>
              {activeIndex + 1} / {photos.length}
            </strong>
          </div>
        </div>
      )}
    </div>
  );
}

function PhotoImage({ photo }) {
  const [failed, setFailed] = useState(false);
  const link = parseDriveLink(photo.originalUrl);
  return failed ? (
    link?.type === "file" ? (
      <div className="album-drive-fallback">
        <iframe
          src={`https://drive.google.com/file/d/${link.id}/preview${link.resourceKey ? `?resourcekey=${encodeURIComponent(link.resourceKey)}` : ""}`}
          title={`Google Drive preview: ${photo.name}`}
          allow="fullscreen"
          referrerPolicy="no-referrer"
        />
        <div>
          <span>Google Drive preview</span>
          <button type="button" onClick={() => setFailed(false)}>
            Retry photo
          </button>
          <a href={photo.originalUrl} target="_blank" rel="noreferrer">
            Open in Drive <ArrowUpRight size={12} />
          </a>
        </div>
      </div>
    ) : (
      <div className="album-image-error">
        <Images size={30} />
        <p>
          This photo could not display. Check its sharing settings or image
          format.
        </p>
        <a href={photo.originalUrl} target="_blank" rel="noreferrer">
          Open photo in Drive <ArrowUpRight size={13} />
        </a>
      </div>
    )
  ) : (
    <img
      className="album-main-photo"
      src={photo.url}
      alt={photo.name}
      onError={() => setFailed(true)}
    />
  );
}
