"use client";
import { useEffect, useRef, useState } from "react";
import { Music2, Pause, Play, ChevronUp, X } from "lucide-react";
import { couple } from "@/config/couple";
import { claimAutoplay, rememberPlayback } from "@/lib/soundtrack-state.mjs";
import SongPlayer, { spotifyEmbedUrl } from "./song-player";

let spotifyAPI;
function loadSpotifyAPI() {
  if (spotifyAPI) return spotifyAPI;
  spotifyAPI = new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error("Spotify did not load")),
      15000,
    );
    const previous = window.onSpotifyIframeApiReady;
    window.onSpotifyIframeApiReady = (api) => {
      clearTimeout(timer);
      resolve(api);
      previous?.(api);
    };
    const script = document.createElement("script");
    script.src = "https://open.spotify.com/embed/iframe-api/v1";
    script.async = true;
    script.onerror = () => {
      clearTimeout(timer);
      reject(new Error("Spotify is unavailable"));
    };
    document.body.appendChild(script);
  });
  return spotifyAPI;
}
function storage() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export default function Soundtrack() {
  const [open, setOpen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [hint, setHint] = useState("Our little soundtrack");
  const host = useRef(null),
    controller = useRef(null),
    audio = useRef(null);
  const embed = spotifyEmbedUrl(couple.songUrl);
  useEffect(() => {
    if (!couple.songUrl) return;
    let cancelled = false,
      instance,
      timer;
    async function autoplay(play) {
      // Web Locks also serializes first visits opened in multiple tabs.
      const attempt = async () => {
        if (cancelled || !claimAutoplay(storage(), couple.songUrl)) return;
        setHint("Tap play if the browser keeps it quiet");
        try {
          await play();
        } catch {
          /* Autoplay can require an explicit user gesture. */
        }
      };
      if (navigator.locks?.request)
        await navigator.locks.request("bubududu-soundtrack", attempt);
      else await attempt();
    }
    if (embed) {
      loadSpotifyAPI()
        .then((api) => {
          if (cancelled || !host.current) return;
          const mount = document.createElement("div");
          host.current.appendChild(mount);
          timer = setTimeout(() => {
            if (!cancelled) {
              setFailed(true);
              setHint("Open Spotify to listen");
            }
          }, 20000);
          api.createController(
            mount,
            { url: couple.songUrl, width: "100%", height: 152 },
            (created) => {
              if (cancelled) {
                created.destroy();
                return;
              }
              instance = created;
              controller.current = created;
              created.addListener("ready", () => {
                if (cancelled) return;
                clearTimeout(timer);
                setReady(true);
                autoplay(() => created.play());
              });
              created.addListener("playback_update", (event) => {
                if (cancelled) return;
                const active = !event.data.isPaused && !event.data.isBuffering;
                setPlaying(active);
                if (active) {
                  rememberPlayback(storage(), couple.songUrl);
                  setHint("Playing our soundtrack");
                } else if (event.data.isPaused && event.data.position > 0)
                  setHint("Paused · a little love for later");
              });
            },
          );
        })
        .catch(() => {
          if (!cancelled) {
            setFailed(true);
            setHint("Open Spotify to listen");
          }
        });
    } else {
      const player = audio.current;
      autoplay(() => player.play());
    }
    return () => {
      cancelled = true;
      clearTimeout(timer);
      instance?.destroy();
      controller.current = null;
    };
  }, [embed]);
  function toggle() {
    if (embed) {
      if (!ready || failed) {
        setOpen(true);
        return;
      }
      if (playing) controller.current?.pause();
      else controller.current?.play();
    } else if (playing) audio.current?.pause();
    else audio.current?.play().catch(() => setHint("Tap play to listen"));
  }
  if (!couple.songUrl) return null;
  return (
    <div className="soundtrack-widget">
      <div
        className={"soundtrack-panel " + (open ? "is-open" : "is-collapsed")}
        aria-hidden={!open}
        inert={!open}
      >
        <div className="soundtrack-heading">
          <strong>Our little soundtrack</strong>
          <button
            type="button"
            aria-label="Close soundtrack"
            onClick={() => setOpen(false)}
          >
            <X size={15} />
          </button>
        </div>
        <div ref={host} />
        {failed && <SongPlayer />}
        <p>{hint}</p>
      </div>
      <div className="soundtrack-bar">
        <button
          type="button"
          className="soundtrack-play"
          onClick={toggle}
          aria-label={playing ? "Pause our song" : "Play our song"}
        >
          <span className={"record " + (playing ? "spinning" : "")}>
            <Music2 size={16} />
          </span>
          {playing ? <Pause size={15} /> : <Play size={15} />}
        </button>
        <button
          type="button"
          className="soundtrack-details"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          <span>
            <strong>{couple.songTitle || "Our song"}</strong>
            <small aria-live="polite">{hint}</small>
          </span>
          <ChevronUp size={14} />
        </button>
      </div>
      {!embed && (
        <audio
          ref={audio}
          src={couple.songUrl}
          preload="metadata"
          onPlay={() => {
            setPlaying(true);
            setHint("Playing our soundtrack");
            rememberPlayback(storage(), couple.songUrl);
          }}
          onPause={() => {
            setPlaying(false);
            setHint("Our little soundtrack");
          }}
          onEnded={() => {
            setPlaying(false);
            setHint("A little love, remembered");
          }}
        />
      )}
    </div>
  );
}
