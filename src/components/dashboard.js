"use client";
import { useEffect, useRef, useState } from "react";
import { getSupabase } from "@/utils/supabase";
import { parseDriveLink } from "@/lib/google-drive.mjs";
import DrivePhotoAlbum from "./drive-photo-album";
import {
  LogOut,
  Heart,
  LayoutDashboard,
  MessageCircle,
  CalendarDays,
  Gamepad2,
  Images,
  Smile,
  Target,
  Music2,
  Gift,
  Search,
  Plus,
  ArrowLeft,
  ArrowUpRight,
  PanelLeftClose,
  PanelLeftOpen,
  ShieldCheck,
  X,
} from "lucide-react";
import Link from "next/link";
import DashboardHome from "./dashboard-home";
import SongPlayer, { spotifyEmbedUrl } from "./song-player";
import { couple } from "@/config/couple";
import Bears from "./bears";
import { useRouter } from "next/navigation";
const tabs = [
  ["home", LayoutDashboard, "Overview", "Your shared space, at a glance."],
  [
    "chat_notes",
    MessageCircle,
    "Love notes",
    "Little words that make an ordinary day better.",
  ],
  [
    "calendar_events",
    CalendarDays,
    "Our calendar",
    "Make a little more time for each other.",
  ],
  [
    "games",
    Gamepad2,
    "Little games",
    "A little friendly competition. A lot of love.",
  ],
  [
    "photo_diary",
    Images,
    "Photo diary",
    "Collect the moments you never want to forget.",
  ],
  [
    "mood_logs",
    Smile,
    "Mood & energy",
    "A soft place to share how you really feel.",
  ],
  [
    "shared_goals",
    Target,
    "Shared dreams",
    "The future looks better when you build it together.",
  ],
  [
    "playlist_tracks",
    Music2,
    "The vibe hub",
    "A soundtrack for every version of us.",
  ],
  [
    "mystery_boxes",
    Gift,
    "Surprise boxes",
    "Something lovely to look forward to.",
  ],
];
export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(() => Boolean(getSupabase()));
  const [denied, setDenied] = useState(false);
  const [status, setStatus] = useState("");
  const [tab, setTab] = useState("home");
  const [entries, setEntries] = useState([]);
  const [query, setQuery] = useState("");
  const [entriesLoading, setEntriesLoading] = useState(false);
  const [showComposer, setShowComposer] = useState(true);
  function navigate(id) {
    setTab(id);
    setEntries([]);
    setEntriesLoading(id !== "home" && id !== "games");
    setStatus("");
    setQuery("");
    setShowComposer(true);
  }
  const selectedTab = tabs.find((t) => t[0] === tab);
  const firstName =
    user?.user_metadata?.display_name?.split(" ")[0] ||
    user?.email?.split("@")[0] ||
    "My favorite person";
  const initial = firstName.slice(0, 1).toUpperCase();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const authorizedUserId = useRef(null);
  const db = getSupabase();
  useEffect(() => {
    if (!db) return;
    let active = true;
    async function check(session) {
      if (!active) return;
      setLoading(true);
      if (!session) {
        authorizedUserId.current = null;
        setUser(null);
        setLoading(false);
        return;
      }
      const { data, error } = await db.rpc("is_couple");
      if (!active) return;
      if (error || !data) {
        setDenied(true);
        setUser(null);
        setStatus(
          error
            ? "Database setup is needed. Run migrations 01–08 and configure the two approved emails."
            : "Only for Bubu & Dudu! This account is not on our guest list.",
        );
        await db.auth.signOut();
        if (!error) router.replace("/access-denied");
      } else {
        if (authorizedUserId.current !== session.user.id) {
          setTab("home");
          setQuery("");
          setEntries([]);
        }
        authorizedUserId.current = session.user.id;
        setUser(session.user);
        setDenied(false);
        setStatus("");
      }
      setLoading(false);
    }
    db.auth.getSession().then(({ data }) => check(data.session));
    const {
      data: { subscription },
    } = db.auth.onAuthStateChange((_event, session) => {
      setTimeout(() => check(session), 0);
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [db, router]);
  useEffect(() => {
    if (!db || !user || tab === "games" || tab === "home") return;
    let active = true;
    async function load() {
      const { data, error } = await db
        .from(tab)
        .select("*")
        .order("created_at", { ascending: false });
      if (!active) return;
      setEntriesLoading(false);
      if (error) setStatus(error.message);
      else {
        setEntries(data || []);
        setStatus("");
      }
    }
    load();
    const channel = db
      .channel(`couple-${tab}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: tab },
        load,
      )
      .subscribe();
    return () => {
      active = false;
      db.removeChannel(channel);
    };
  }, [db, user, tab]);
  async function login(e) {
    e.preventDefault();
    if (!db) return;
    setBusy(true);
    setStatus("");
    const { error } = await db.auth.signInWithPassword({ email, password });
    if (error) setStatus(error.message);
    setBusy(false);
  }
  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setStatus("");
    const f = new FormData(e.currentTarget);
    let row = { created_by: user.id };
    if (tab === "chat_notes") row = { ...row, body: f.get("body") };
    if (tab === "calendar_events")
      row = {
        ...row,
        title: f.get("title"),
        event_at: new Date(f.get("event_at")).toISOString(),
        notes: f.get("notes"),
      };
    if (tab === "photo_diary") {
      const driveUrl = String(f.get("drive_url") || "").trim();
      if (!parseDriveLink(driveUrl)) {
        setStatus(
          "Paste a full public Google Drive folder link, or an individual photo link.",
        );
        setBusy(false);
        return;
      }
      row = { ...row, title: f.get("title"), drive_url: driveUrl };
    }
    if (tab === "mood_logs")
      row = {
        ...row,
        mood: f.get("mood"),
        energy: Number(f.get("energy")),
        notes: f.get("notes"),
      };
    if (tab === "shared_goals") row = { ...row, title: f.get("title") };
    if (tab === "playlist_tracks") {
      try {
        const url = new URL(f.get("url"));
        if (url.protocol !== "https:") throw Error();
      } catch {
        setStatus("Please use an https music link.");
        setBusy(false);
        return;
      }
      row = { ...row, title: f.get("title"), url: f.get("url") };
    }
    if (tab === "mystery_boxes")
      row = {
        ...row,
        title: f.get("title"),
        body: f.get("body"),
        opens_at: new Date(f.get("opens_at")).toISOString(),
      };
    const { data, error } = await db.from(tab).insert(row).select("*").single();
    if (error) setStatus(error.message);
    else {
      setEntries((old) => [data, ...old.filter((x) => x.id !== data.id)]);
      e.target.reset();
      setTab("home");
      setEntries([]);
      setStatus("A little love, saved. ♡");
    }
    setBusy(false);
  }
  async function remove(id) {
    const { error } = await db.from(tab).delete().eq("id", id);
    if (error) setStatus(error.message);
    else setEntries((old) => old.filter((x) => x.id !== id));
  }
  async function toggleGoal(entry) {
    const { error } = await db
      .from(tab)
      .update({ completed: !entry.completed })
      .eq("id", entry.id);
    if (error) setStatus(error.message);
    else
      setEntries((old) =>
        old.map((x) =>
          x.id === entry.id ? { ...x, completed: !x.completed } : x,
        ),
      );
  }
  async function openBox(id) {
    const { data, error } = await db.rpc("open_mystery_box", { box_id: id });
    if (error) setStatus(error.message);
    else setStatus(data || "A little surprise is waiting.");
  }
  if (loading)
    return (
      <div className="empty">
        <Heart />
        <p>Opening our little world…</p>
      </div>
    );
  if (!user)
    return (
      <main className="workspace-login">
        <div className="login-intro">
          <Link href="/" className="login-brand">
            <Heart size={23} fill="currentColor" /> bubududu.
          </Link>
          <span className="workspace-eyebrow">
            A SHARED SPACE FOR YOUR FAVORITE STORY
          </span>
          <h2>
            A little more together.
            <br />A little more <em>us.</em>
          </h2>
          <p>
            Your notes, your next adventure, the memories in between.
            <br />
            One private space for the life you are making together.
          </p>
          <Bears small />
          <span className="login-privacy">
            <ShieldCheck size={14} /> Private by design. Just the two of you.
          </span>
        </div>
        <div className="login-card">
          <span className="login-heart">
            <Heart size={23} />
          </span>
          <span className="eyebrow">A LITTLE WORLD, JUST FOR TWO</span>
          <h1>
            {denied ? "Only for Bubu & Dudu!" : "Hello, my favorite person."}
          </h1>
          <p>Our notes, our plans, our everyday magic. Safely tucked away.</p>
          {!db ? (
            <p className="status">
              Add your Supabase public URL and key to .env.local to get started.
            </p>
          ) : (
            <form onSubmit={login}>
              <label htmlFor="email">Your email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
              <label htmlFor="password">Our little secret</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                minLength={6}
              />
              <button disabled={busy} className="button">
                {busy ? "Opening…" : "Let me in ♡"}
              </button>
            </form>
          )}
          <p className="status" role="status">
            {status}
          </p>
          <small className="helper">
            Access is reserved for our two approved accounts.
          </small>
          <Link className="login-back-link" href="/">
            <ArrowLeft size={13} /> Back to our story
          </Link>
        </div>
      </main>
    );
  return (
    <main className={"workspace " + (collapsed ? "sidebar-collapsed" : "")}>
      <aside className="workspace-sidebar">
        <div className="workspace-brand">
          <Link href="/" aria-label="bubududu home">
            <span className="workspace-logo">
              <Heart size={20} fill="currentColor" />
            </span>
            {!collapsed && (
              <span>
                bubududu<span className="logo-period">.</span>
              </span>
            )}
          </Link>
          <button
            className="sidebar-toggle"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <PanelLeftOpen size={17} />
            ) : (
              <PanelLeftClose size={17} />
            )}
          </button>
        </div>
        {!collapsed && (
          <div className="workspace-switcher">
            <span className="couple-mini-avatar">b+d</span>
            <span>
              <strong>Our little world</strong>
              <small>Private space for two</small>
            </span>
            <ShieldCheck size={15} />
          </div>
        )}
        <span className="sidebar-section-label">
          {collapsed ? "US" : "OUR SPACE"}
        </span>
        <nav className="workspace-nav" aria-label="Dashboard navigation">
          {tabs.map(([id, Icon, name]) => (
            <button
              key={id}
              className={tab === id ? "active" : ""}
              onClick={() => navigate(id)}
              title={name}
              aria-label={name}
              aria-current={tab === id ? "page" : undefined}
            >
              <Icon size={18} />
              {!collapsed && <span>{name}</span>}
              {id === "home" && !collapsed && (
                <span className="nav-active-mark" />
              )}
            </button>
          ))}
        </nav>
        {!collapsed && (
          <div className="sidebar-note">
            <span>Just the two of us.</span>
            <p>
              A little space for the life
              <br />
              we&apos;re making together.
            </p>
            <Heart size={17} />
          </div>
        )}
        <div className="sidebar-bottom">
          <Link href="/" className="sidebar-return" title="Back to our website">
            <ArrowUpRight size={17} />
            {!collapsed && "Explore our story"}
          </Link>
          <div className="workspace-account">
            <span className="account-avatar">{initial}</span>
            {!collapsed && (
              <span>
                <strong>{firstName}</strong>
                <small>My favorite person</small>
              </span>
            )}
            <button
              aria-label="Sign out"
              title="Sign out"
              onClick={() => db.auth.signOut()}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
      <div className="workspace-main">
        <header className="workspace-topbar">
          <div className="workspace-breadcrumb">
            Our space <span>/</span>
            <strong>{selectedTab[2]}</strong>
          </div>
          <div className="workspace-topbar-actions">
            <label className="workspace-search">
              <Search size={16} />
              <input
                type="search"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  if (tab !== "home") {
                    setTab("home");
                    setEntries([]);
                  }
                }}
                placeholder="Search recent moments..."
                aria-label="Search recent shared activity"
              />
              <span>Search</span>
            </label>
            <span className="private-workspace-badge">
              <ShieldCheck size={14} />
              Just us
            </span>
            <span className="topbar-avatar" title={firstName}>
              {initial}
            </span>
          </div>
        </header>
        <div className="workspace-body">
          {status && (
            <div className="workspace-notice" role="status">
              <Heart size={15} />
              {status}
              <button
                aria-label="Dismiss message"
                onClick={() => setStatus("")}
              >
                <X size={15} />
              </button>
            </div>
          )}
          {tab !== "home" && (
            <div className="collection-page-heading">
              <div>
                <button
                  className="back-to-overview"
                  onClick={() => navigate("home")}
                >
                  <ArrowLeft size={13} />
                  Back to overview
                </button>
                <h1>{selectedTab[2]}</h1>
                <p>{selectedTab[3]}</p>
              </div>
              <button
                className="workspace-button"
                onClick={() => {
                  setShowComposer(true);
                  requestAnimationFrame(() =>
                    document
                      .querySelector(
                        ".dash-form input, .dash-form textarea, .dash-form select",
                      )
                      ?.focus(),
                  );
                }}
                hidden={tab === "games"}
              >
                <Plus size={16} /> Create new
              </button>
            </div>
          )}
          <div
            className={
              tab === "home" ? "dashboard-home-content" : "dash-content"
            }
          >
            {tab === "home" ? (
              <DashboardHome
                db={db}
                user={user}
                navigate={navigate}
                query={query}
              />
            ) : tab === "games" ? (
              <Games />
            ) : (
              <>
                <div className="collection-heading">
                  <div>
                    <span className="workspace-eyebrow">
                      CREATE SOMETHING LOVELY
                    </span>
                    <h2>A new little moment</h2>
                  </div>
                  <button
                    className="icon-button"
                    aria-expanded={showComposer}
                    aria-label={
                      showComposer ? "Hide creation form" : "Show creation form"
                    }
                    onClick={() => setShowComposer((v) => !v)}
                  >
                    <Plus
                      size={19}
                      style={{
                        transform: showComposer ? "rotate(45deg)" : undefined,
                      }}
                    />
                  </button>
                </div>
                {tab === "playlist_tracks" && (
                  <section className="featured-song">
                    <span className="workspace-eyebrow">
                      OUR LITTLE SOUNDTRACK
                    </span>
                    <h3>{couple.songTitle}</h3>
                    <SongPlayer />
                  </section>
                )}
                {showComposer && (
                  <form key={tab} onSubmit={save} className="dash-form">
                    {[
                      "calendar_events",
                      "photo_diary",
                      "shared_goals",
                      "playlist_tracks",
                      "mystery_boxes",
                    ].includes(tab) && (
                      <label>
                        A little title
                        <input
                          name="title"
                          placeholder="Give this moment a name…"
                          maxLength={200}
                          required
                        />
                      </label>
                    )}
                    {tab === "chat_notes" && (
                      <label>
                        A note for your favorite person
                        <textarea
                          name="body"
                          placeholder="Thinking of you, and…"
                          maxLength={5000}
                          required
                          rows={3}
                        />
                      </label>
                    )}
                    {tab === "calendar_events" && (
                      <>
                        <label>
                          Our special date
                          <input
                            name="event_at"
                            type="datetime-local"
                            required
                          />
                        </label>
                        <label>
                          A little reminder
                          <textarea name="notes" maxLength={5000} />
                        </label>
                      </>
                    )}
                    {tab === "photo_diary" && (
                      <label>
                        Public Google Drive folder link
                        <input
                          name="drive_url"
                          type="url"
                          placeholder="https://drive.google.com/drive/folders/FOLDER_ID"
                          required
                        />
                        <small className="album-input-help">
                          Paste the whole folder link. Share the folder as
                          Anyone with the link, with photos directly inside.
                          Existing single-photo links work too.
                        </small>
                      </label>
                    )}
                    {tab === "mood_logs" && (
                      <>
                        <label>
                          How is your heart today?
                          <select name="mood">
                            <option>Happy</option>
                            <option>Calm</option>
                            <option>Tired</option>
                            <option>Anxious</option>
                            <option>Need a hug</option>
                          </select>
                        </label>
                        <label>
                          Your energy (1–5)
                          <input
                            name="energy"
                            type="range"
                            min="1"
                            max="5"
                            defaultValue="3"
                          />
                        </label>
                        <label>
                          Want to share a little more?
                          <textarea name="notes" maxLength={5000} />
                        </label>
                      </>
                    )}
                    {tab === "playlist_tracks" && (
                      <label>
                        Song link
                        <input
                          name="url"
                          type="url"
                          placeholder="https://open.spotify.com/track/…"
                          required
                        />
                      </label>
                    )}
                    {tab === "mystery_boxes" && (
                      <>
                        <label>
                          Open on
                          <input
                            name="opens_at"
                            type="datetime-local"
                            required
                          />
                        </label>
                        <label>
                          A secret for that day
                          <textarea name="body" required maxLength={5000} />
                        </label>
                        <small className="helper">
                          The message stays hidden on the server until its
                          opening time. The title is shared.
                        </small>
                      </>
                    )}
                    <button className="button" disabled={busy}>
                      {busy ? "Saving…" : "Save a little love ♡"}
                    </button>
                  </form>
                )}
                <div className="collection-list-title">
                  <h2>Your shared collection</h2>
                  <span>{entries.length} moments</span>
                </div>
                {entriesLoading && (
                  <p className="collection-loading" role="status">
                    Gathering your moments...
                  </p>
                )}
                {!entriesLoading && !entries.length && (
                  <div className="empty">
                    <span>♡</span>
                    <p>A blank page for our next little memory.</p>
                  </div>
                )}
                {entries.map((entry) => (
                  <article className="entry" key={entry.id}>
                    <div className="record-meta">
                      <span className="record-avatar">
                        {entry.created_by === user.id ? (
                          initial
                        ) : (
                          <Heart size={12} />
                        )}
                      </span>
                      <strong>
                        {entry.created_by === user.id ? "You" : "Your partner"}
                      </strong>
                      <span>{selectedTab[2]}</span>
                    </div>
                    {entry.title && (
                      <h3
                        style={
                          entry.completed
                            ? { textDecoration: "line-through" }
                            : {}
                        }
                      >
                        {entry.title}
                      </h3>
                    )}
                    {entry.body && <p>{entry.body}</p>}
                    {entry.notes && <p>{entry.notes}</p>}
                    {entry.mood && (
                      <p>
                        {entry.mood} · energy {entry.energy}/5
                      </p>
                    )}
                    {entry.event_at && (
                      <p>
                        {new Date(entry.event_at).toLocaleString()} ·{" "}
                        {Math.max(
                          0,
                          Math.ceil(
                            (new Date(entry.event_at) - new Date()) / 86400000,
                          ),
                        )}{" "}
                        days to go
                      </p>
                    )}
                    {entry.drive_url && (
                      <DrivePhotoAlbum
                        url={entry.drive_url}
                        title={entry.title}
                      />
                    )}
                    {entry.url && (
                      <a
                        className="text-link"
                        href={entry.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Play our song ↗
                      </a>
                    )}
                    {entry.url && spotifyEmbedUrl(entry.url) && (
                      <SongPlayer url={entry.url} title={entry.title} />
                    )}
                    {entry.opens_at && (
                      <>
                        <p>Opens {new Date(entry.opens_at).toLocaleString()}</p>
                        <button
                          className="button"
                          onClick={() => openBox(entry.id)}
                        >
                          Open our surprise
                        </button>
                      </>
                    )}
                    <small>
                      {new Date(entry.created_at).toLocaleDateString()}
                    </small>
                    <div className="entry-actions">
                      {tab === "shared_goals" && (
                        <button onClick={() => toggleGoal(entry)}>
                          {entry.completed
                            ? "Dream a little more"
                            : "We did it! ✓"}
                        </button>
                      )}
                      {entry.created_by === user.id && (
                        <button onClick={() => remove(entry.id)}>Remove</button>
                      )}
                    </div>
                  </article>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
function Games() {
  const [game, setGame] = useState("Tic-tac-toe");
  const [board, setBoard] = useState(Array(9).fill(null));
  const [turn, setTurn] = useState("♡");
  const [quiz, setQuiz] = useState(0);
  const [answer, setAnswer] = useState("");
  const [cards, setCards] = useState([
    "🌷",
    "☕",
    "♡",
    "✿",
    "☕",
    "🌷",
    "✿",
    "♡",
  ]);
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);
  const winner = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ].find(
    ([a, b, c]) => board[a] && board[a] === board[b] && board[b] === board[c],
  );
  const questions = [
    "What is our perfect lazy Sunday?",
    "Which song feels most like us?",
    "Where should our next adventure be?",
  ];
  function flip(i) {
    if (flipped.length === 2 || matched.includes(i) || flipped.includes(i))
      return;
    const f = [...flipped, i];
    setFlipped(f);
    if (f.length === 2) {
      if (cards[f[0]] === cards[f[1]]) {
        setMatched([...matched, ...f]);
        setFlipped([]);
      } else setTimeout(() => setFlipped([]), 900);
    }
  }
  return (
    <>
      <div className="games-tabs">
        {["Tic-tac-toe", "Love quiz", "Memory match"].map((t) => (
          <button onClick={() => setGame(t)} key={t}>
            {t}
          </button>
        ))}
      </div>
      {game === "Tic-tac-toe" && (
        <>
          <h3>
            {winner
              ? `${board[winner[0]]} wins a hug!`
              : board.every(Boolean)
                ? "A perfect tie. Share a hug."
                : `${turn}’s turn`}
          </h3>
          <div className="game-grid">
            {board.map((cell, i) => (
              <button
                aria-label={`Square ${i + 1}: ${cell || "empty"}`}
                key={i}
                onClick={() => {
                  if (cell || winner) return;
                  setBoard(board.map((v, j) => (i === j ? turn : v)));
                  setTurn(turn === "♡" ? "✿" : "♡");
                }}
              >
                {cell}
              </button>
            ))}
          </div>
          <button
            className="button"
            onClick={() => {
              setBoard(Array(9).fill(null));
              setTurn("♡");
            }}
          >
            Another round
          </button>
        </>
      )}
      {game === "Love quiz" && (
        <>
          <h3>{questions[quiz]}</h3>
          <p>
            Take turns guessing your partner’s answer, then reveal it together.
          </p>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="My guess is…"
          />
          <button
            className="button"
            onClick={() => {
              setQuiz((quiz + 1) % questions.length);
              setAnswer("");
            }}
          >
            Next question
          </button>
        </>
      )}
      {game === "Memory match" && (
        <>
          <h3>
            {matched.length === 8
              ? "A lovely little match!"
              : "Find our matching moments"}
          </h3>
          <div className="game-grid memory-grid">
            {cards.map((c, i) => (
              <button
                key={i}
                aria-label={`Card ${i + 1}${matched.includes(i) ? " matched" : ""}`}
                onClick={() => flip(i)}
              >
                {matched.includes(i) || flipped.includes(i) ? c : "?"}
              </button>
            ))}
          </div>
          <button
            className="button"
            onClick={() => {
              setCards([...cards].sort(() => Math.random() - 0.5));
              setMatched([]);
              setFlipped([]);
            }}
          >
            Shuffle & play again
          </button>
        </>
      )}
    </>
  );
}
