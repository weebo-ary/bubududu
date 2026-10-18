/* eslint-disable @next/next/no-img-element -- Public Drive images are fetched directly, as requested. */
"use client";
import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Heart,
  ArrowUpRight,
  ArrowRight,
  Sparkles,
  LockKeyhole,
  Music2,
  Pause,
  Play,
  X,
  ChevronRight,
  Coffee,
  Infinity as InfinityIcon,
  Stars,
  MapPin,
  Gift,
  Home as HomeIcon,
  Send,
  Check,
  Menu,
  Volume2,
} from "lucide-react";
import Bears from "./bears";
import { couple, driveImage } from "@/config/couple";
import SongPlayer from "./song-player";
const reasons = [
  "You make ordinary days feel like my favorite adventure.",
  "You feel like home, wherever we are.",
  "Your laugh is my favorite sound in the whole world.",
  "You always save the last bite for me.",
  "With you, I can be completely, wonderfully myself.",
];
const dates = [
  "A blanket fort and our favorite movie",
  "A bookstore date with a surprise pick",
  "Make pasta from scratch together",
  "A sunrise picnic, just us two",
  "A no-phones walk and ice cream",
];
export function Shell({ children }) {
  const path = usePathname();
  if (path === "/dashboard") return <>{children}</>;
  return (
    <>
      <div className="top-ribbon">
        a little corner of the universe, just for us{" "}
        <Heart size={11} fill="currentColor" />
      </div>
      <header className="nav-wrap">
        <nav aria-label="Main navigation">
          <Link href="/" className="brand">
            <span className="brand-mark">
              b<span>♡</span>d
            </span>
            <span>
              bubududu<span className="brand-dot">.</span>
            </span>
          </Link>
          <div className="nav-links">
            {[
              ["/", "Our little world"],
              ["/our-story", "Our story"],
              ["/love-vault", "Love vault"],
              ["/dreamscape", "Dreamscape"],
            ].map(([url, label]) => (
              <Link
                key={url}
                className={path === url ? "active" : ""}
                href={url}
              >
                {label}
              </Link>
            ))}
          </div>
          <Link className="private-link" href="/dashboard">
            <LockKeyhole size={14} /> Just us <ArrowUpRight size={14} />
          </Link>
        </nav>
      </header>
      {children}
      <footer>
        <Link className="brand" href="/">
          bubududu<span className="brand-dot">.</span>
        </Link>
        <p>Made of little moments. Filled with a lot of love.</p>
        <span>you + me + all the days to come ♡</span>
      </footer>
    </>
  );
}
function Section({ eyebrow, title, children, className = "", id }) {
  return (
    <section id={id} className={"section " + className}>
      <div className="section-heading">
        <span className="eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
      </div>
      {children}
    </section>
  );
}
function Button({ children, onClick, className = "" }) {
  return (
    <button className={"button " + className} onClick={onClick}>
      {children}
    </button>
  );
}
function subscribeStorage(callback) {
  window.addEventListener("storage", callback);
  window.addEventListener("couple-storage", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("couple-storage", callback);
  };
}
function useLocalValue(key) {
  return useSyncExternalStore(
    subscribeStorage,
    () => localStorage.getItem(key) || "",
    () => "",
  );
}
function storeLocal(key, value) {
  localStorage.setItem(key, value);
  window.dispatchEvent(new Event("couple-storage"));
}
function subscribeClock(callback) {
  const timer = setInterval(callback, 60000);
  return () => clearInterval(timer);
}
function useDays(anniversary = false) {
  return useSyncExternalStore(
    subscribeClock,
    () => {
      const now = new Date();
      const d = new Date(couple.togetherSince + "T00:00:00");
      if (anniversary) {
        d.setFullYear(now.getFullYear());
        if (d < now) d.setFullYear(now.getFullYear() + 1);
        return Math.ceil((d - now) / 86400000).toLocaleString();
      }
      return Math.max(0, Math.floor((now - d) / 86400000)).toLocaleString();
    },
    () => "-",
  );
}
function CheckList({ items, storageKey }) {
  const stored = useLocalValue(storageKey);
  let checked = [];
  try {
    const value = JSON.parse(stored || "[]");
    if (Array.isArray(value)) checked = value;
  } catch {}
  function toggle(i) {
    storeLocal(
      storageKey,
      JSON.stringify(
        checked.includes(i) ? checked.filter((x) => x !== i) : [...checked, i],
      ),
    );
  }
  return (
    <div className="checklist">
      {items.map((item, i) => (
        <button
          key={item}
          onClick={() => toggle(i)}
          className={checked.includes(i) ? "checked" : ""}
        >
          <span className="checkbox">
            {checked.includes(i) && <Check size={13} />}
          </span>
          {item}
        </button>
      ))}
    </div>
  );
}
function Reason() {
  const [index, setIndex] = useState(0);
  return (
    <div className="reason-box">
      <Heart size={27} />
      <p key={index}>{reasons[index]}</p>
      <Button onClick={() => setIndex((index + 1) % reasons.length)}>
        One more reason <Sparkles size={14} />
      </Button>
      <small>A tiny reminder. An endless list.</small>
    </div>
  );
}
function Quiz() {
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);
  const questions = [
    "Our perfect evening looks like…",
    "The best kind of adventure is…",
    "Our secret ingredient is…",
  ];
  return (
    <div className="quiz">
      <span className="mini-label">THE VERY SCIENTIFIC LOVE TEST</span>
      <h3>
        {step < 3
          ? questions[step]
          : "The results are in. A perfect little match."}
      </h3>
      {step < 3 ? (
        <div className="pill-row">
          {(step === 0
            ? ["Movie & cuddles", "A spontaneous date"]
            : step === 1
              ? ["Getting lost together", "Staying in together"]
              : ["Laughter", "Extra snacks"]
          ).map((a, i) => (
            <button
              key={a}
              onClick={() => {
                setScore(score + i + 1);
                setStep(step + 1);
              }}
            >
              {a} <Heart size={13} />
            </button>
          ))}
        </div>
      ) : (
        <>
          <p>{97 + (score % 4)}% compatible. 100% better together. ♡</p>
          <button
            className="text-link"
            onClick={() => {
              setStep(0);
              setScore(0);
            }}
          >
            Try again ↗
          </button>
        </>
      )}
      <small>
        {step < 3
          ? `Question ${step + 1} of 3 · no wrong answers, only us`
          : "For fun, with love — not a scientific assessment."}
      </small>
    </div>
  );
}
function Gallery() {
  const [photo, setPhoto] = useState(null);
  return (
    <>
      <div className="gallery">
        {couple.photos.length
          ? couple.photos.map((p, i) => (
              <button className="polaroid" key={i} onClick={() => setPhoto(p)}>
                <img src={driveImage(p.url)} alt={p.caption} />
                <span>{p.caption}</span>
              </button>
            ))
          : [
              "a day to remember",
              "our happy place",
              "little moments, big love",
            ].map((p, i) => (
              <div className={"polaroid placeholder p" + i} key={p}>
                <div>
                  <span>{["♡", "✿", "☀"][i]}</span>
                  <small>Your memory goes here</small>
                </div>
                <span>{p}</span>
              </div>
            ))}
      </div>
      {!couple.photos.length && (
        <p className="helper">
          Your scrapbook is waiting. Add public Google Drive file links in the
          couple config.
        </p>
      )}
      {photo && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={photo.caption}
          className="lightbox"
          onClick={() => setPhoto(null)}
        >
          <button autoFocus aria-label="Close photo">
            <X />
          </button>
          <img src={driveImage(photo.url)} alt={photo.caption} />
          <p>{photo.caption}</p>
        </div>
      )}
    </>
  );
}
function Timeline() {
  return (
    <div className="timeline">
      {[
        [
          "01",
          "The first hello",
          "One little conversation. The beginning of everything.",
        ],
        [
          "02",
          "Our first adventure",
          "A little nervous. A lot of butterflies.",
        ],
        ["03", "Finding our rhythm", "The inside jokes. The everyday magic."],
        [
          "04",
          "Still choosing you",
          "Today, tomorrow, and every ordinary day after.",
        ],
      ].map(([n, t, d]) => (
        <article key={n}>
          <span>{n}</span>
          <h3>{t}</h3>
          <p>{d}</p>
        </article>
      ))}
    </div>
  );
}
export function Home() {
  const [quote, setQuote] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setQuote((q) => (q + 1) % 3), 6500);
    return () => clearInterval(timer);
  }, []);
  const quotes = [
    "In a world full of people, you’re my favorite human.",
    "Every love story is beautiful, but ours is my favorite.",
    "Home is wherever I’m with you.",
  ];
  const days = useDays();
  return (
    <main>
      <div className="floating-hearts" aria-hidden="true">
        <span>&#9825;</span>
        <span>&#9825;</span>
        <span>&#9825;</span>
      </div>
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow hero-label">
            <span /> OUR OWN LITTLE HAPPILY EVER AFTER
          </span>
          <h1>
            Life is sweeter
            <br />
            with <em>you.</em>
            <span className="title-heart">♡</span>
          </h1>
          <p>
            A home for our memories, our silly little dreams,
            <br className="desktop" /> and all the love in between. Just Bubu &
            Dudu.
          </p>
          <div className="hero-actions">
            <Link href="/our-story" className="button">
              Our love story <ArrowRight size={16} />
            </Link>
            <Link href="/love-vault" className="secondary-link">
              A little love for you <Heart size={15} />
            </Link>
          </div>
          <div className="hero-note">
            <span className="tiny-bears">ʕ•ᴥ•ʔ</span>
            <span>two little bears. one big love.</span>
            <span className="note-line" />
          </div>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9 }}
          className="hero-art"
        >
          <span className="handwritten art-note">
            my favorite place is
            <br />
            right next to you <span>↘</span>
          </span>
          <div className="art-halo" />
          <Bears />
          <span className="forever-badge">
            <Heart size={13} fill="currentColor" /> together is a lovely place
            to be
          </span>
          <span className="sparkle s1">✧</span>
          <span className="sparkle s2">✦</span>
          <span className="art-flower">✿</span>
        </motion.div>
      </section>
      <div className="love-strip">
        <span>A LITTLE US, A LOT OF LOVE</span>
        <Heart size={13} />
        <span>COLLECTING MOMENTS, NOT THINGS</span>
        <Heart size={13} />
        <span>ALWAYS YOUR PERSON</span>
        <Heart size={13} />
        <span>BETTER TOGETHER</span>
      </div>
      <Section
        eyebrow="EVERY DAY ADDS UP TO SOMETHING BEAUTIFUL"
        title={
          <>
            Our love, in little numbers<span className="inline-heart">♡</span>
          </>
        }
        className="numbers-section"
      >
        <div className="stats">
          {[
            [Heart, days, "days of choosing you"],
            [Coffee, "Countless", "little coffee dates"],
            [Stars, "A million", "reasons to smile"],
            [InfinityIcon, "Always", "more love to give"],
          ].map(([Icon, n, label]) => (
            <div key={label}>
              <span className="stat-icon">
                <Icon size={21} />
              </span>
              <strong>{n}</strong>
              <p>{label}</p>
            </div>
          ))}
        </div>
        <small className="sample-label">
          {couple.anniversaryIsSample
            ? "A little preview · set your special date in the couple config."
            : "Every day with you is my favorite."}
        </small>
      </Section>
      <Section
        eyebrow="THERE’S A WHOLE WORLD OF US"
        title="Little corners of our love"
        className="corners-section"
      >
        <div className="corner-grid">
          {[
            [
              "/our-story",
              "01",
              "Our story",
              "From the first hello to our favorite everyday moments.",
              "story",
              "♡",
            ],
            [
              "/love-vault",
              "02",
              "The love vault",
              "Little notes, big feelings, and love tucked away for you.",
              "vault",
              "✉",
            ],
            [
              "/dreamscape",
              "03",
              "Our dreamscape",
              "Someday places. Tiny plans. A beautiful future together.",
              "dream",
              "✧",
            ],
          ].map(([url, n, title, desc, c, symbol]) => (
            <Link href={url} className={"corner-card " + c} key={url}>
              <div className="corner-top">
                <span>CHAPTER {n}</span>
                <ArrowUpRight size={19} />
              </div>
              <div className="corner-art">
                {symbol}
                <span>✦</span>
              </div>
              <h3>{title}</h3>
              <p>{desc}</p>
              <span className="text-link">
                Come on in <ArrowRight size={14} />
              </span>
            </Link>
          ))}
        </div>
      </Section>
      <section className="quote-section">
        <span>“</span>
        <p>{quotes[quote]}</p>
        <small>— a little truth, from me to you</small>
        <div className="dots">
          {quotes.map((_, i) => (
            <button
              key={i}
              aria-label={`Show quote ${i + 1}`}
              className={quote === i ? "selected" : ""}
              onClick={() => setQuote(i)}
            />
          ))}
        </div>
      </section>
      <Section
        eyebrow="A LITTLE FUN, A LOT OF CHEMISTRY"
        title="Are we a perfect match?"
      >
        <Quiz />
      </Section>
      <Section
        eyebrow="OUR FAVORITE KIND OF THROWBACK"
        title="Every little moment led to you"
      >
        <Timeline />
        <Link href="/our-story" className="text-link centered">
          Read our whole story <ArrowRight size={15} />
        </Link>
      </Section>
      <Section
        eyebrow="IN CASE YOU NEED A REMINDER"
        title="Why you, you ask?"
        className="reason-section"
      >
        <Reason />
      </Section>
      <Section eyebrow="SOME DAY, WITH YOU" title="A few dreams on our list">
        <div className="dream-preview">
          <CheckList
            storageKey="home-dreams"
            items={[
              "See the northern lights, hand in hand",
              "Build a cozy home full of plants",
              "Adopt a furry little best friend",
              "Grow old and stay a little silly",
            ]}
          />
          <div>
            <span className="dream-doodle">☾ ✧</span>
            <p>
              Not in a hurry.
              <br />
              Just happy it’s with you.
            </p>
            <Link href="/dreamscape" className="text-link">
              Dream a little with me <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </Section>
      <section className="goodbye">
        <span>♡</span>
        <h2>My favorite story will always be us.</h2>
        <p>Here’s to all the little moments we haven’t met yet.</p>
        <Link className="button" href="/dashboard">
          Step into our little world <LockKeyhole size={14} />
        </Link>
      </section>
    </main>
  );
}
function PageHero({ tag, title, description }) {
  return (
    <section className="page-hero">
      <span className="eyebrow">{tag}</span>
      <h1>{title}</h1>
      <p>{description}</p>
      <span className="page-flower">✿</span>
    </section>
  );
}
function Accordion({ items }) {
  return (
    <div className="accordions">
      {items.map(([title, text]) => (
        <details key={title}>
          <summary>
            {title}
            <span>+</span>
          </summary>
          <p>{text}</p>
        </details>
      ))}
    </div>
  );
}
export function Story() {
  return (
    <main>
      <PageHero
        tag="CHAPTER 01 · THE WAY WE FOUND EACH OTHER"
        title={
          <>
            A little hello.
            <br />
            <em>A whole lot of forever.</em>
          </>
        }
        description="Our favorite story, still being written. One wonderfully ordinary day at a time."
      />
      <Section
        eyebrow="ONCE UPON A LITTLE MOMENT"
        title="And then, there was you"
      >
        <div className="story-intro">
          <Bears small />
          <div>
            <p className="large-copy">
              Some people arrive quietly and change everything.
            </p>
            <p>
              This is the space for our first hello: the place, the butterflies,
              and all the tiny details we never want to forget.
            </p>
            <p className="handwritten">the best beginning is ours ♡</p>
            <small className="helper">
              Personalize our story in src/components/love-app.js.
            </small>
          </div>
        </div>
      </Section>
      <Section eyebrow="THE CHAPTERS WE KEEP CLOSE" title="Our little timeline">
        <Timeline />
      </Section>
      <Section
        eyebrow="EXPECTATIONS, MEET REALITY"
        title="First impressions vs. now"
      >
        <div className="two-grid">
          <article className="soft-card">
            <span>THEN</span>
            <h3>“They seem so quiet.”</h3>
            <p>
              Polite smiles. Carefully chosen words. Approximately a thousand
              butterflies.
            </p>
          </article>
          <article className="soft-card peach">
            <span>NOW</span>
            <h3>Our own comedy show.</h3>
            <p>
              Weird voices. Snack negotiations. Absolutely no personal space.
            </p>
          </article>
        </div>
      </Section>
      <Section
        eyebrow="OUR FAVORITE WAY TO SPEND A DAY"
        title="The little things we love"
      >
        <div className="four-grid">
          {[
            "☕ Slow coffee mornings",
            "🍿 Just one more episode",
            "🍜 Sharing the last bite",
            "🌿 Walks with no destination",
          ].map((t) => (
            <article className="soft-card hobby" key={t}>
              <h3>{t}</h3>
              <p>Better, because it’s with you.</p>
            </article>
          ))}
        </div>
      </Section>
      <Section
        eyebrow="SAVED IN OUR CAMERA ROLL, KEPT IN OUR HEARTS"
        title="Little moments, forever memories"
      >
        <Gallery />
      </Section>
      <Section
        eyebrow="YOU KIND OF HAD TO BE THERE"
        title="Our very own language"
      >
        <Accordion
          items={[
            [
              "Just five more minutes…",
              "The unofficial beginning of every hour-long cuddle.",
            ],
            [
              "The snack tax",
              "A tiny bite of yours tastes better. This is established science.",
            ],
            [
              "Our secret code",
              "Add that one phrase that makes only the two of you laugh.",
            ],
          ]}
        />
      </Section>
      <Section
        eyebrow="A FEW PLACES THAT FEEL LIKE US"
        title="Our little map of memories"
      >
        <div className="three-grid">
          {couple.places.map((p) => (
            <article className="soft-card place" key={p.title}>
              <MapPin />
              <h3>{p.title}</h3>
              {p.query ? (
                <a
                  className="text-link"
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.query)}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Find our spot ↗
                </a>
              ) : (
                <p>Add your special place in the couple config.</p>
              )}
            </article>
          ))}
        </div>
      </Section>
      <Section eyebrow="A NOTE, JUST FOR YOU" title="To my favorite person">
        <article className="letter">
          <span className="handwritten">my love,</span>
          <p>
            I don’t need every day to be extraordinary. I just want the ordinary
            ones with you. The grocery runs, the sleepy mornings, the little
            stories you tell me at the end of a long day.
          </p>
          <p>
            Thank you for being my soft place to land. For all the little things
            you do, and for being exactly who you are.
          </p>
          <p>Whatever comes next, I’m so glad it’s us.</p>
          <span className="handwritten">all my love, always ♡</span>
        </article>
      </Section>
    </main>
  );
}
function Hug() {
  const [hearts, setHearts] = useState(0);
  return (
    <div className="hug-box">
      <Bears small />
      <h3>A little closer, even from here.</h3>
      <Button onClick={() => setHearts(hearts + 1)}>
        Send a big bear hug <Heart size={16} />
      </Button>
      <div aria-live="polite">
        {hearts > 0 && (
          <motion.p
            key={hearts}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: -10, opacity: 1 }}
          >
            ♡ ♡ ♡ Hug delivered to this little corner of the world!
          </motion.p>
        )}
      </div>
    </div>
  );
}
export function Vault() {
  const [comfort, setComfort] = useState(
    "Whatever today feels like, you don’t have to carry it alone.",
  );
  return (
    <main>
      <PageHero
        tag="CHAPTER 02 · OPEN WITH LOVE"
        title={
          <>
            The little things.
            <br />
            <em>The biggest feelings.</em>
          </>
        }
        description="A safe little place for love notes, warm hugs, and the words you need to hear."
      />
      <Section
        eyebrow="A PRESENT FOR ANOTHER DAY"
        title="Letters to our future"
      >
        <div className="soft-card capsule">
          <LockKeyhole size={30} />
          <h3>Some love is worth waiting for.</h3>
          <p>
            Create a private time capsule with a date, a note, and a little
            anticipation.
          </p>
          <Link href="/dashboard" className="button">
            Make a time capsule <ArrowRight size={15} />
          </Link>
        </div>
      </Section>
      <Section eyebrow="REST YOUR HEART HERE" title="You’re my safe place">
        <Accordion
          items={reasons
            .slice(0, 3)
            .map((r, i) => [
              [
                "On the hard days",
                "When the world gets loud",
                "In every version of us",
              ][i],
              r,
            ])}
        />
      </Section>
      <Section eyebrow="NO DISTANCE TOO FAR" title="One hug, coming right up">
        <Hug />
      </Section>
      <Section
        eyebrow="VALID FOR A LITTLE EXTRA LOVE"
        title="Coupons, just for you"
      >
        <div className="three-grid">
          {[
            "A very long head massage",
            "Movie night: your choice",
            "Breakfast, made with love",
          ].map((t) => (
            <Coupon key={t} title={t} />
          ))}
        </div>
      </Section>
      <Section
        eyebrow="EVERY LOVE STORY HAS A SOUNDTRACK"
        title="Songs that feel like us"
      >
        <div className="soft-card">
          <Music2 size={30} />
          <h3>Our playlist is a love letter, too.</h3>
          <p>Add your favorite song links to our shared private playlist.</p>
          <SongPlayer />
          <Link className="text-link" href="/dashboard">
            Open the vibe hub <ArrowRight size={14} />
          </Link>
        </div>
      </Section>
      <Section eyebrow="FROM A TO ALWAYS" title="The alphabet of loving you">
        <Accordion
          items={"ABCDEFGHIJKLMNOPQRSTUVWXYZ"
            .split("")
            .map((l, i) => [
              `${l} is for ${["Adventures", "Being there", "Cuddles", "Dreaming", "Everyday magic", "Forever", "Giggles", "Home", "Inside jokes", "Joy", "Kindness", "Laughter", "Memories", "New beginnings", "Our little world", "Patience", "Quiet moments", "Reassurance", "Softness", "Together", "Understanding", "Vulnerability", "Warmth", "XOXO", "You", "Zero doubts"][i]}`,
              reasons[i % reasons.length],
            ])}
        />
      </Section>
      <Section
        eyebrow="A SMALL BREATH. A SOFTER MOMENT."
        title="What does your heart need?"
      >
        <div className="comfort">
          <div className="pill-row">
            {[
              [
                "A little reassurance",
                "You are loved on your productive days and your do-nothing days.",
              ],
              [
                "Some encouragement",
                "One tiny step is still a step. I’m right here, cheering for you.",
              ],
              [
                "A deep breath",
                "Breathe in for four. Hold for four. Breathe out for six. We have time.",
              ],
            ].map(([t, m]) => (
              <button key={t} onClick={() => setComfort(m)}>
                {t} ♡
              </button>
            ))}
          </div>
          <p aria-live="polite">{comfort}</p>
        </div>
      </Section>
      <Section eyebrow="COLLECTED WITH LOVE" title="Our virtual scrapbook">
        <Gallery />
      </Section>
    </main>
  );
}
function Coupon({ title }) {
  const used = useLocalValue("coupon-" + title) === "used";
  function setUsed(value) {
    storeLocal("coupon-" + title, value ? "used" : "");
  }
  return (
    <article className="coupon">
      <Gift size={25} />
      <span>ONE LITTLE LOVE COUPON</span>
      <h3>{title}</h3>
      <button onClick={() => setUsed(!used)}>
        {used ? "Redeemed with love ✓" : "Redeem a little happiness →"}
      </button>
      <small>Local preview · redeem shared coupons in our dashboard</small>
    </article>
  );
}
function Generator() {
  const [date, setDate] = useState(dates[0]);
  return (
    <div className="reason-box">
      <Sparkles />
      <h3>{date}</h3>
      <Button
        onClick={() => setDate(dates[(dates.indexOf(date) + 1) % dates.length])}
      >
        Pick our next date <ArrowRight size={15} />
      </Button>
    </div>
  );
}
export function Dreams() {
  const countdown = useDays(true);
  const storedNote = useLocalValue("future-note");
  const [note, setNote] = useState(null);
  const [saved, setSaved] = useState(false);
  return (
    <main>
      <PageHero
        tag="CHAPTER 03 · THE BEST IS STILL AHEAD"
        title={
          <>
            Someday, somewhere.
            <br />
            <em>As long as it’s you.</em>
          </>
        }
        description="Our tiny plans and our wildly big dreams. A future we get to make together."
      />
      <Section
        eyebrow="A PLACE TO PUT DOWN ROOTS"
        title="Our dream little home"
      >
        <div className="dream-preview">
          <div className="home-doodle">
            ⌂<p className="handwritten">home is a person, too.</p>
          </div>
          <CheckList
            storageKey="dream-home"
            items={[
              "A sunny reading nook",
              "A kitchen for midnight snacks",
              "Plants in every possible corner",
              "A big couch for little naps",
              "A wall full of our memories",
            ]}
          />
        </div>
      </Section>
      <Section
        eyebrow="THE WORLD, WITH MY FAVORITE PERSON"
        title="Places we’ll find each other"
      >
        <div className="three-grid">
          {[
            ["☾", "Northern lights", "Somewhere under a dancing sky"],
            ["☀", "A little Italian summer", "Pasta, sunsets, and no plans"],
            ["山", "A cabin in the mountains", "Just us and the quiet"],
          ].map(([s, t, d]) => (
            <article className="travel-card" key={t}>
              <span>{s}</span>
              <h3>{t}</h3>
              <p>{d}</p>
              <CheckList storageKey={t} items={["On our someday list"]} />
            </article>
          ))}
        </div>
      </Section>
      <Section
        eyebrow="ROOM FOR ONE MORE LITTLE HEART"
        title="Our future furry family"
      >
        <div className="two-grid">
          <article className="soft-card">
            <span className="pet-doodle">ᵔᴥᵔ</span>
            <h3>A little bundle of chaos.</h3>
            <p>A rescue pup, a cozy bed, and two very smitten humans.</p>
          </article>
          <div className="soft-card">
            <h3>Potential names, serious business</h3>
            <CheckList
              storageKey="pet-names"
              items={["Mochi", "Biscuit", "Miso", "Dumpling"]}
            />
          </div>
        </div>
      </Section>
      <Section
        eyebrow="WHAT SHOULD WE DO NEXT?"
        title="The date-night daydreamer"
      >
        <Generator />
      </Section>
      <Section
        eyebrow="BIG DREAMS, TINY STEPS"
        title="Our future us vision board"
      >
        <CheckList
          storageKey="vision"
          items={[
            "Learn something new together",
            "Make time for a weekly date",
            "Save for our next adventure",
            "Celebrate the small wins",
            "Keep choosing each other",
          ]}
        />
      </Section>
      <Section
        eyebrow="A LITTLE MESS. A LOT OF LOVE."
        title="Our recipe book for two"
      >
        <Accordion
          items={[
            [
              "Sunday morning pancakes",
              "Whisk 1 cup flour, 1 egg, 1 cup milk, 1 tbsp sugar, and 1 tsp baking powder. Cook in a lightly buttered pan until golden. Serve with fruit and extra love.",
            ],
            [
              "A cozy tomato pasta",
              "Sauté garlic in olive oil, add chopped tomatoes and simmer for 20 minutes. Toss with cooked pasta, basil, and a little pasta water.",
            ],
            [
              "Chocolate mug cake for two",
              "Mix 4 tbsp flour, 2 tbsp cocoa, 2 tbsp sugar, 4 tbsp milk, and 1 tbsp oil in a large microwave-safe mug. Microwave in short bursts until just set; let cool before sharing.",
            ],
          ]}
        />
      </Section>
      <Section
        eyebrow="ANOTHER YEAR OF OUR FAVORITE STORY"
        title="Our next little celebration"
      >
        <div className="anniversary">
          <Heart />
          <strong>{countdown}</strong>
          <p>days until our anniversary</p>
          <small>
            {couple.anniversaryIsSample
              ? "Preview date · personalize in couple config"
              : "Another beautiful chapter."}
          </small>
        </div>
        <CheckList
          storageKey="anniversary"
          items={[
            "Write a handwritten letter",
            "Pick a place that means something",
            "Make a playlist for this chapter",
          ]}
        />
      </Section>
      <Section eyebrow="FOR THE US WE HAVEN’T MET YET" title="Dear future us…">
        <div className="letter">
          <label htmlFor="future-note">What do you hope we never forget?</label>
          <textarea
            id="future-note"
            rows={5}
            value={note ?? storedNote}
            onChange={(e) => {
              setNote(e.target.value);
              setSaved(false);
            }}
            placeholder="I hope we still laugh at the same silly things…"
          />
          <Button
            onClick={() => {
              storeLocal("future-note", note ?? storedNote);
              setSaved(true);
            }}
          >
            Keep this little thought <Heart size={14} />
          </Button>
          <p className="helper" aria-live="polite">
            {saved
              ? "Saved on this device. ♡"
              : "This reflection stays in this browser. Use the private vault for shared notes."}
          </p>
        </div>
      </Section>
    </main>
  );
}
