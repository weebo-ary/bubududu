/* eslint-disable @next/next/no-img-element -- Public Google Drive images load directly. */
"use client";
import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  CalendarDays,
  Heart,
  MessageCircle,
  ImagePlus,
  Target,
  Music2,
  Gift,
  Smile,
  Plus,
  Search,
  RefreshCw,
  Clock3,
  CheckCheck,
  Sparkles,
} from "lucide-react";
import {
  activityTables,
  buildActivityFeed,
  filterActivity,
} from "@/lib/dashboard-feed.mjs";
import { driveImage } from "@/config/couple";
import { parseDriveLink, drivePhotoUrl } from "@/lib/google-drive.mjs";
import { FolderHeart, ChevronRight } from "lucide-react";
import Bears from "./bears";

const kinds = {
  chat_notes: {
    label: "Love note",
    action: "left a love note",
    icon: MessageCircle,
    color: "rose",
  },
  calendar_events: {
    label: "Date & event",
    action: "planned a little together-time",
    icon: CalendarDays,
    color: "violet",
  },
  photo_diary: {
    label: "Photo memory",
    action: "saved a new memory",
    icon: ImagePlus,
    color: "amber",
  },
  mood_logs: {
    label: "Mood check-in",
    action: "shared a little check-in",
    icon: Smile,
    color: "green",
  },
  shared_goals: {
    label: "Shared goal",
    action: "added a dream to our list",
    icon: Target,
    color: "violet",
  },
  playlist_tracks: {
    label: "Our playlist",
    action: "added to our soundtrack",
    icon: Music2,
    color: "rose",
  },
  mystery_boxes: {
    label: "Surprise box",
    action: "tucked away a surprise",
    icon: Gift,
    color: "amber",
  },
};
function relativeTime(value) {
  const minutes = Math.max(
    0,
    Math.floor((Date.now() - new Date(value)) / 60000),
  );
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export default function DashboardHome({ db, user, navigate, query }) {
  const [data, setData] = useState({
    items: [],
    counts: {},
    upcoming: [],
    done: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [kind, setKind] = useState("all");
  const [refresh, setRefresh] = useState(0);
  const [connection, setConnection] = useState("connecting");
  useEffect(() => {
    let active = true,
      sequence = 0,
      timer;
    async function load() {
      const current = ++sequence;
      try {
        const results = await Promise.all(
          activityTables.map(async (table) => {
            // Never request surprise contents for the overview.
            const columns =
              table === "mystery_boxes"
                ? "id,title,opens_at,created_at,created_by"
                : "*";
            const result = await db
              .from(table)
              .select(columns, { count: "exact" })
              .order("created_at", { ascending: false })
              .limit(80);
            return { table, ...result };
          }),
        );
        const [upcoming, done] = await Promise.all([
          db
            .from("calendar_events")
            .select("*")
            .gte("event_at", new Date().toISOString())
            .order("event_at")
            .limit(3),
          db
            .from("shared_goals")
            .select("id", { count: "exact", head: true })
            .eq("completed", true),
        ]);
        if (!active || current !== sequence) return;
        const failed = results.filter((r) => r.error);
        setError(
          failed.length || upcoming.error || done.error
            ? "Some updates could not load. Please refresh to try again."
            : "",
        );
        setData({
          items: buildActivityFeed(
            results.map((r) => ({ table: r.table, rows: r.data || [] })),
          ).slice(0, 80),
          counts: Object.fromEntries(
            results.map((r) => [r.table, r.error ? null : r.count]),
          ),
          upcoming: upcoming.data || [],
          done: done.error ? null : done.count,
        });
      } catch {
        if (active && current === sequence)
          setError(
            "We could not reach your shared space. Please try refreshing.",
          );
      } finally {
        if (active && current === sequence) setLoading(false);
      }
    }
    load();
    let channel = db.channel(`home-activity-${user.id}`);
    for (const table of activityTables)
      channel = channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        () => {
          clearTimeout(timer);
          timer = setTimeout(load, 180);
        },
      );
    channel.subscribe((state) => {
      if (!active) return;
      if (state === "SUBSCRIBED") {
        setConnection("live");
        load();
      }
      if (
        state === "CHANNEL_ERROR" ||
        state === "TIMED_OUT" ||
        state === "CLOSED"
      )
        setConnection("offline");
    });
    function resume() {
      if (document.visibilityState === "visible") load();
    }
    document.addEventListener("visibilitychange", resume);
    return () => {
      active = false;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", resume);
      db.removeChannel(channel);
    };
  }, [db, user.id, refresh]);

  const firstName =
    user.user_metadata?.display_name?.split(" ")[0] ||
    user.email?.split("@")[0] ||
    "my favorite person";
  const filtered = filterActivity(data.items, kind, query);
  const counts = data.counts;
  return (
    <div className="overview">
      <div className="overview-title">
        <div>
          <span className="workspace-eyebrow">YOUR SHARED SPACE</span>
          <h1>A little more us.</h1>
          <p>
            All your moments, plans, and everyday love. Together in one place.
          </p>
        </div>
        <button
          className="workspace-button"
          onClick={() => navigate("chat_notes")}
        >
          <Plus size={17} /> Add a little love
        </button>
      </div>
      <section className="welcome-banner">
        <div>
          <span className="welcome-tag">
            <Sparkles size={13} /> BETTER, TOGETHER
          </span>
          <h2>Welcome home, {firstName}.</h2>
          <p>
            The big plans and the small things.
            <br />
            This is where your life together comes together.
          </p>
          <button onClick={() => navigate("calendar_events")}>
            Plan your next moment <ArrowRight size={15} />
          </button>
        </div>
        <div className="welcome-art" aria-hidden="true">
          <span>our favorite place ♡</span>
          <Bears small />
        </div>
      </section>
      <section
        className="overview-metrics"
        aria-label="Your shared space in numbers"
      >
        {[
          [
            "chat_notes",
            MessageCircle,
            "Love notes",
            "Little words, big feelings",
            "rose",
          ],
          [
            "photo_diary",
            ImagePlus,
            "Memories saved",
            "Your story in snapshots",
            "amber",
          ],
          [
            "calendar_events",
            CalendarDays,
            "Dates & plans",
            "More time for each other",
            "violet",
          ],
          [
            "shared_goals",
            Target,
            "Shared dreams",
            `${data.done ?? "—"} dreams already achieved`,
            "green",
          ],
        ].map(([table, Icon, label, sub, color]) => (
          <button
            className="metric-card"
            key={table}
            onClick={() => navigate(table)}
          >
            <span className={`workspace-icon ${color}`}>
              <Icon size={19} />
            </span>
            <ArrowUpRight className="metric-arrow" size={15} />
            <strong>{loading ? "—" : (counts[table] ?? "—")}</strong>
            <span className="metric-label">{label}</span>
            <small>{sub}</small>
          </button>
        ))}
      </section>
      <div className="overview-columns">
        <section className="activity-panel">
          <div className="panel-heading">
            <div>
              <h2>Our latest little moments</h2>
              <p>From both of you, with the newest first.</p>
            </div>
            <div className="feed-controls">
              <span className={`connection-badge ${connection}`}>
                <i />
                {connection === "live"
                  ? "Live updates"
                  : connection === "offline"
                    ? "Reconnect needed"
                    : "Connecting"}
              </span>
              <button
                className="icon-button"
                aria-label="Refresh shared activity"
                disabled={loading}
                onClick={() => {
                  setLoading(true);
                  setRefresh((r) => r + 1);
                }}
              >
                <RefreshCw size={15} className={loading ? "refreshing" : ""} />
              </button>
            </div>
          </div>
          <div className="feed-toolbar">
            <div role="group" aria-label="Filter activity">
              {[
                ["all", "Everything"],
                ["chat_notes", "Notes"],
                ["calendar_events", "Dates"],
                ["photo_diary", "Photos"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  aria-pressed={kind === value}
                  onClick={() => setKind(value)}
                >
                  {label}
                </button>
              ))}
            </div>
            <select
              aria-label="All activity types"
              value={kind}
              onChange={(e) => setKind(e.target.value)}
            >
              <option value="all">All types</option>
              {activityTables.map((t) => (
                <option key={t} value={t}>
                  {kinds[t].label}
                </option>
              ))}
            </select>
          </div>
          {error && (
            <p className="feed-error" role="alert">
              {error}
            </p>
          )}
          {loading && !data.items.length ? (
            <div className="feed-empty" role="status">
              <div className="loading-dots">•••</div>
              <h3>Gathering your little moments...</h3>
              <p>Your shared space is on its way.</p>
            </div>
          ) : filtered.length ? (
            <div className="activity-feed">
              {filtered.map((item) => {
                const meta = kinds[item.kind],
                  Icon = meta.icon;
                return (
                  <article className="activity-item" key={item.activityId}>
                    <div
                      className={`activity-avatar ${item.created_by === user.id ? "self" : "partner"}`}
                    >
                      {item.created_by === user.id ? "Y" : <Heart size={16} />}
                      <span className={`activity-type-dot ${meta.color}`}>
                        <Icon size={10} />
                      </span>
                    </div>
                    <div className="activity-body">
                      <div className="activity-byline">
                        <span>
                          <strong>
                            {item.created_by === user.id
                              ? "You"
                              : "Your partner"}
                          </strong>{" "}
                          {meta.action}
                        </span>
                        <time
                          dateTime={item.created_at}
                          title={new Date(item.created_at).toLocaleString()}
                        >
                          {relativeTime(item.created_at)}
                        </time>
                      </div>
                      <button
                        className={`activity-preview ${meta.color}`}
                        onClick={() => navigate(item.kind)}
                      >
                        {item.kind === "chat_notes" ? (
                          <p className="note-preview">{item.body}</p>
                        ) : (
                          <>
                            <span className="preview-label">
                              <Icon size={13} />
                              {meta.label}
                            </span>
                            <h3>
                              {item.title ||
                                `${item.mood} · energy ${item.energy}/5`}
                            </h3>
                            {item.kind === "calendar_events" && (
                              <p>
                                <CalendarDays size={13} />
                                {new Date(item.event_at).toLocaleString(
                                  undefined,
                                  {
                                    month: "short",
                                    day: "numeric",
                                    hour: "numeric",
                                    minute: "2-digit",
                                  },
                                )}
                              </p>
                            )}
                            {item.kind === "photo_diary" &&
                            parseDriveLink(item.drive_url)?.type ===
                              "folder" ? (
                              <span className="feed-folder-preview">
                                <FolderHeart size={24} />
                                <span>
                                  Open this photo album
                                  <small>
                                    Browse your memories, one photo at a time
                                  </small>
                                </span>
                                <ChevronRight size={16} />
                              </span>
                            ) : (
                              item.kind === "photo_diary" && (
                                <img
                                  loading="lazy"
                                  src={
                                    parseDriveLink(item.drive_url)?.type ===
                                    "file"
                                      ? drivePhotoUrl(
                                          parseDriveLink(item.drive_url).id,
                                          parseDriveLink(item.drive_url)
                                            .resourceKey,
                                          240,
                                        )
                                      : driveImage(item.drive_url)
                                  }
                                  alt={item.title}
                                />
                              )
                            )}
                            {item.kind === "shared_goals" && (
                              <p>
                                <CheckCheck size={14} />
                                {item.completed
                                  ? "A dream come true"
                                  : "Something to look forward to"}
                              </p>
                            )}
                            {item.kind === "mystery_boxes" && (
                              <p>
                                <Gift size={14} />
                                Opens{" "}
                                {new Date(item.opens_at).toLocaleDateString()} ·
                                contents stay a surprise
                              </p>
                            )}
                            {item.kind === "mood_logs" && item.notes && (
                              <p>{item.notes}</p>
                            )}
                          </>
                        )}
                        <ArrowUpRight size={15} className="preview-arrow" />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="feed-empty">
              <span className="workspace-icon rose">
                {query ? <Search /> : <Heart />}
              </span>
              <h3>
                {error && !data.items.length
                  ? "Your moments could not load yet."
                  : data.items.length
                    ? "No matching moments"
                    : "Your story starts with a little hello."}
              </h3>
              <p>
                {error && !data.items.length
                  ? "Use the refresh button above to try again."
                  : data.items.length
                    ? "Try another search or activity type."
                    : "Leave a note, plan a date, or save a memory. You will both see it here."}
              </p>
              {!data.items.length && !error && (
                <button
                  className="workspace-button"
                  onClick={() => navigate("chat_notes")}
                >
                  <Plus size={15} /> Write your first note
                </button>
              )}
            </div>
          )}
          {filtered.length > 0 && (
            <div className="feed-footnote">
              Your latest shared activity · open a category to explore its full
              history.
            </div>
          )}
        </section>
        <aside className="overview-rail">
          <section className="rail-card">
            <div className="rail-title">
              <span className="workspace-icon violet">
                <CalendarDays size={17} />
              </span>
              <h2>Coming up for us</h2>
              <button
                className="icon-button"
                aria-label="Add a date"
                onClick={() => navigate("calendar_events")}
              >
                <Plus size={16} />
              </button>
            </div>
            {loading ? (
              <p className="rail-empty">Finding your plans...</p>
            ) : data.upcoming.length ? (
              data.upcoming.map((event) => (
                <button
                  className="upcoming-event"
                  key={event.id}
                  onClick={() => navigate("calendar_events")}
                >
                  <span className="date-tile">
                    <small>
                      {new Date(event.event_at).toLocaleDateString(undefined, {
                        month: "short",
                      })}
                    </small>
                    <strong>{new Date(event.event_at).getDate()}</strong>
                  </span>
                  <span>
                    <strong>{event.title}</strong>
                    <small>
                      <Clock3 size={11} />
                      {new Date(event.event_at).toLocaleTimeString(undefined, {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </small>
                  </span>
                  <ArrowUpRight size={14} />
                </button>
              ))
            ) : (
              <div className="rail-empty">
                <p>
                  A little time together
                  <br />
                  looks good on the calendar.
                </p>
                <button onClick={() => navigate("calendar_events")}>
                  Plan something lovely <ArrowRight size={13} />
                </button>
              </div>
            )}
            <button
              className="rail-link"
              onClick={() => navigate("calendar_events")}
            >
              Open our calendar <ArrowRight size={14} />
            </button>
          </section>
          <section className="rail-card">
            <div className="rail-title">
              <h2>A little love, on the go</h2>
            </div>
            <div className="quick-action-grid">
              {[
                ["chat_notes", MessageCircle, "Leave a note", "rose"],
                ["photo_diary", ImagePlus, "Save a memory", "amber"],
                ["mood_logs", Smile, "Check in", "green"],
                ["mystery_boxes", Gift, "Make a surprise", "violet"],
              ].map(([table, Icon, label, color]) => (
                <button key={table} onClick={() => navigate(table)}>
                  <span className={`workspace-icon ${color}`}>
                    <Icon size={19} />
                  </span>
                  {label}
                  <Plus size={12} />
                </button>
              ))}
            </div>
          </section>
          <section className="together-card">
            <Heart size={22} />
            <span>YOUR DAILY LITTLE REMINDER</span>
            <p>
              It’s the little things.
              <br />
              It’s always been
              <br />
              the little things.
            </p>
            <span>Keep making them together.</span>
          </section>
        </aside>
      </div>
    </div>
  );
}
