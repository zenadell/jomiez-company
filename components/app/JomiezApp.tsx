"use client";

import { AnimatePresence, animate, motion, useDragControls, useMotionValue, useTransform, type PanInfo } from "motion/react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useAgentStatus, useThread } from "@/cms/admin/agent/useAgent";
import { useVoice } from "@/cms/admin/agent/useVoice";
import { ChatContent } from "./ChatContent";
import { Composer } from "./Composer";
import { Droplet } from "./Droplet";
import { ClientsSheet, fetchClientsSummary, type ClientsSummary } from "./Clients";
import { HomeContent } from "./Home";
import { currentEndpoint, isIOS, isStandalone, post, registerWorker, setBadge, STATUS_TEXT, type AppUser, type Me, type ThreadRow } from "./lib";
import { LiquidGlass, relayout, Wallpaper, WallpaperFrame } from "./LiquidGlass";
import { ModelSheet, NoticesSheet, SettingsSheet, ThreadSheet } from "./Sheets";
import { SignIn } from "./SignIn";
import { VoiceScreen } from "./VoiceScreen";

/*
 * The phone app (/app). Signs in (or back in, with this phone's device key),
 * then: the conversations, one conversation sliding over them (swipe from the
 * left edge to go back), a live voice call, and sheets.
 *
 * Built as Apple's Liquid Glass asks: one fixed wallpaper; content on soft
 * platters; and one floating plane of glass controls (round buttons at the
 * top, the message box at the bottom) that stays put while the content under
 * it changes, morphing from one screen's controls to the next. A sheet rises
 * in thick glass while the app settles back behind it.
 */

type Phase = "boot" | "signin" | "in" | "offline";

class Offline extends Error {}

async function fetchMe(): Promise<{ me: Me | null; canResume: boolean }> {
  const res = await fetch("/api/app/me", { credentials: "include", cache: "no-store" }).catch(() => {
    throw new Offline("offline");
  });
  // The free plan's server waking up, or a hiccup on the way: not an answer about who's signed in.
  if (res.status >= 500) throw new Offline(`The site answered ${res.status}.`);
  const out = await res.json().catch(() => ({}));
  return res.ok ? { me: out as Me, canResume: false } : { me: null, canResume: Boolean(out.canResume) };
}

/** Who's signed in, signing back in with the device key when the 8-hour sign-in has run out. */
async function whoIsIn(): Promise<Me | null> {
  const first = await fetchMe();
  if (first.me || !first.canResume) return first.me;
  try {
    await post("/api/app/resume");
  } catch {
    return null;
  }
  return (await fetchMe()).me;
}

/* The phone's keyboard: the app keeps to the part of the screen it leaves visible (iOS doesn't resize pages). */
function useVisibleViewport() {
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const root = document.documentElement;
    const update = () => {
      root.style.setProperty("--ja-vh", `${vv.height}px`);
      root.style.setProperty("--ja-vtop", `${vv.offsetTop}px`);
      root.classList.toggle("ja-kb-open", window.innerHeight - vv.height > 120);
      if (vv.offsetTop > 0 && isIOS()) window.scrollTo(0, 0);
    };
    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, []);
}

const FADE = { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.3 } } as const;

export function JomiezApp() {
  const [phase, setPhase] = useState<Phase>("boot");
  const [me, setMe] = useState<Me | null>(null);
  useVisibleViewport();

  const check = useCallback(async () => {
    try {
      const who = await whoIsIn();
      setMe(who);
      setPhase(who ? "in" : "signin");
    } catch (err) {
      // No connection: stay where we are if signed in already, otherwise say so (never "sign in").
      if (err instanceof Offline) setPhase((p) => (p === "in" ? p : "offline"));
      else setPhase("signin");
    }
  }, []);

  useEffect(() => {
    void registerWorker();
    const first = setTimeout(() => void check(), 0);
    // Back from the background (maybe hours later), or back online: still signed in?
    const back = () => document.visibilityState === "visible" && void check();
    document.addEventListener("visibilitychange", back);
    window.addEventListener("online", back);
    return () => {
      clearTimeout(first);
      document.removeEventListener("visibilitychange", back);
      window.removeEventListener("online", back);
    };
  }, [check]);

  const signOut = async () => {
    const endpoint = await currentEndpoint().catch(() => null);
    await fetch("/api/users/logout", { method: "POST", credentials: "include" }).catch(() => {});
    await post("/api/app/logout", { endpoint }).catch(() => {});
    setMe(null);
    setPhase("signin");
  };

  return (
    <WallpaperFrame className="ja-app">
      <AnimatePresence mode="wait">
        {phase === "boot" && (
          <motion.div key="boot" className="ja-center" {...FADE}>
            <div className="ja-shade" />
            <Droplet size={88} state="working" />
            {/* Shown only if it takes a while: on the free plan the site sleeps when nobody has visited for 15 minutes. */}
            <span className="ja-late">Waking the site up. This takes up to a minute after it has been quiet.</span>
          </motion.div>
        )}
        {phase === "offline" && (
          <motion.div key="offline" className="ja-center" {...FADE}>
            <div className="ja-shade" />
            <Droplet size={88} />
            <strong>You&apos;re offline</strong>
            <span>It carries on as soon as the phone is back online.</span>
            <button type="button" className="ja-btn ja-btn--plain" style={{ marginTop: 10 }} onClick={() => void check()}>
              Try again
            </button>
          </motion.div>
        )}
        {phase === "signin" && (
          <motion.div key="signin" className="ja-layer" {...FADE}>
            <div className="ja-shade" />
            <SignIn
              onSignedIn={(user: AppUser) => {
                void (async () => {
                  const who = await fetchMe().catch(() => ({ me: null }));
                  setMe(who.me ?? { signedIn: true, user, push: { key: "", on: false } });
                  setPhase("in");
                })();
              }}
            />
          </motion.div>
        )}
        {phase === "in" && me && <Main key="in" me={me} onSignOut={() => void signOut()} onMeChanged={() => void check()} />}
      </AnimatePresence>
    </WallpaperFrame>
  );
}

const PUSH = { type: "spring", stiffness: 340, damping: 36, mass: 0.9 } as const;
const SETTLE = { type: "spring", stiffness: 320, damping: 34 } as const;

/* A glass control appearing: it gathers out of the light rather than fading in. */
function Materialize({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ scale: 0.35, opacity: 0, filter: "blur(10px)" }}
      animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
      exit={{ scale: 0.35, opacity: 0, filter: "blur(8px)" }}
      transition={{ type: "spring", stiffness: 420, damping: 24, delay }}
      onAnimationComplete={relayout}
      style={{ display: "flex", gap: 10 }}
    >
      {children}
    </motion.div>
  );
}

type Sheet = null | "settings" | "model" | "notices" | "thread" | "clients";

function Main({ me, onSignOut, onMeChanged }: { me: Me; onSignOut: () => void; onMeChanged: () => void }) {
  const { status, refresh } = useAgentStatus(20_000);
  const [threads, setThreads] = useState<ThreadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"home" | "chat">("home");
  const [sheet, setSheet] = useState<Sheet>(null);
  const [clients, setClients] = useState<ClientsSummary | null>(null);
  const [clientFocus, setClientFocus] = useState<number | null>(null);
  const loadThreads = useCallback(async () => {
    const res = await fetch("/api/agent/threads", { credentials: "include", cache: "no-store" }).catch(() => null);
    if (res?.ok) setThreads((await res.json()).docs ?? []);
    setLoading(false);
    // Clients (businesses that need a website) ride along with every refresh of the list.
    setClients(await fetchClientsSummary());
  }, []);
  const api = useThread({
    onDone: () => {
      void refresh();
      void loadThreads();
    },
  });
  const voice = useVoice();
  const talking = voice.active;
  const name = status?.name ?? "Keeper";

  /* ---------- Moving between screens, with the phone's back gesture and button ---------- */

  const openThread = useCallback(
    (id: number | string) => {
      void api.load(String(id));
      setView("chat");
      // From a sheet (the notices), the conversation takes the sheet's place in the history.
      if (history.state?.jaSheet) history.replaceState({ ja: "chat" }, "", `/app?thread=${id}`);
      else history.pushState({ ja: "chat" }, "", `/app?thread=${id}`);
      setSheet(null);
    },
    [api],
  );
  const newTask = useCallback(() => {
    api.reset();
    setView("chat");
    history.pushState({ ja: "chat" }, "", "/app?new=1");
  }, [api]);
  const back = useCallback(() => {
    if (history.state?.ja === "chat") history.back();
    else {
      setView("home");
      history.replaceState({ ja: "home" }, "", "/app");
    }
    void loadThreads();
  }, [loadThreads]);

  const apiRef = useRef(api);
  useEffect(() => {
    apiRef.current = api;
  });

  useEffect(() => {
    const onPop = () => {
      const q = new URLSearchParams(location.search);
      const thread = q.get("thread");
      if (thread) {
        if (apiRef.current.threadId !== thread) void apiRef.current.load(thread);
        setView("chat");
      } else if (q.has("new")) setView("chat");
      else setView("home");
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // Opened from a notification, a home-screen shortcut or a link: go straight there (with Back leading home).
  useEffect(() => {
    const q = new URLSearchParams(location.search);
    const thread = q.get("thread");
    const lead = Number(q.get("lead")) || null;
    history.replaceState({ ja: "home" }, "", "/app");
    const t = setTimeout(() => {
      if (lead) {
        setClientFocus(lead);
        setSheet("clients");
      }
      if (thread) openThread(thread);
      else if (q.has("new")) newTask();
      else if (q.has("talk")) startTalk();
      void loadThreads();
    }, 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A new conversation gets its own address once it has one.
  useEffect(() => {
    if (view === "chat" && api.threadId && !location.search.includes(`thread=${api.threadId}`)) {
      history.replaceState({ ja: "chat" }, "", `/app?thread=${api.threadId}`);
    }
  }, [api.threadId, view]);

  // Notifications: tapping one while the app is open, or one arriving.
  useEffect(() => {
    const sw = navigator.serviceWorker;
    if (!sw) return;
    const onMessage = (e: MessageEvent) => {
      const data = e.data as { type?: string; url?: string };
      if (data?.type === "open" && data.url) {
        const q = new URL(data.url, location.origin).searchParams;
        const thread = q.get("thread");
        if (thread) openThread(thread);
        else if (Number(q.get("lead"))) {
          setClientFocus(Number(q.get("lead")));
          setSheet("clients");
        }
      }
      if (data?.type === "pushed") {
        void refresh();
        void loadThreads();
        const id = apiRef.current.threadId;
        if (id && !apiRef.current.busy) void apiRef.current.load(id);
      }
    };
    sw.addEventListener("message", onMessage);
    return () => sw.removeEventListener("message", onMessage);
  }, [openThread, refresh, loadThreads]);

  // The list stays current while the app is open.
  useEffect(() => {
    const t = setInterval(() => void loadThreads(), 20_000);
    window.addEventListener("jomiez-agent-changed", loadThreads);
    return () => {
      clearInterval(t);
      window.removeEventListener("jomiez-agent-changed", loadThreads);
    };
  }, [loadThreads]);

  // The number on the app icon: things waiting for you, and what it did that you haven't seen.
  useEffect(() => {
    if (status) setBadge(status.waiting + status.unread);
  }, [status]);

  // An open sheet is one step in the history, so the phone's back gesture or button closes it.
  // (Going from one sheet to another stays the same step.)
  const sheetOpen = sheet !== null;
  useEffect(() => {
    if (!sheetOpen) return;
    history.pushState({ ...history.state, jaSheet: true }, "");
    const onPop = () => setSheet(null);
    window.addEventListener("popstate", onPop);
    return () => {
      window.removeEventListener("popstate", onPop);
      if (history.state?.jaSheet) history.back();
    };
  }, [sheetOpen]);

  /* ---------- Voice ---------- */

  const voiceReady = Boolean(status?.ready && status.voice?.ready);
  function startTalk() {
    voice.clearError();
    void voice.start(null);
  }
  // When a call ends, its saved conversation opens, to read back, carry on by typing, or undo.
  const wasTalking = useRef(false);
  useEffect(() => {
    if (talking) {
      wasTalking.current = true;
      return;
    }
    const id = voice.state.threadId;
    if (wasTalking.current && id) {
      wasTalking.current = false;
      openThread(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [talking, voice.state.threadId]);

  /* ---------- The two screens: the list slides back and dims as a conversation slides over it ---------- */

  // 0: the list is in front; 1: a conversation covers it. Swiping back drives it by hand.
  const depth = useMotionValue(0);
  const homeX = useTransform(depth, [0, 1], ["0%", "-28%"]);
  const homeOpacity = useTransform(depth, [0, 0.8, 1], [1, 0.15, 0]);
  useEffect(() => {
    const a = animate(depth, view === "chat" ? 1 : 0, PUSH);
    return () => a.stop();
  }, [view, depth]);

  const drag = useDragControls();
  const [edgeSwipe, setEdgeSwipe] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setEdgeSwipe(isStandalone()), 0);
    return () => clearTimeout(t);
  }, []);
  const onDrag = (_: unknown, info: PanInfo) => depth.set(1 - Math.max(0, info.offset.x) / window.innerWidth);
  const dragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x > window.innerWidth * 0.33 || info.velocity.x > 500) back();
    else void animate(depth, 1, PUSH);
  };

  /* ---------- The message box ---------- */

  const inChat = view === "chat";
  const working = api.busy && !inChat;
  const send = (text: string, photos: string[]) => {
    const message = [text || (photos.length ? (photos.length === 1 ? "Here's a photo." : "Here are some photos.") : ""), ...photos.map((id) => `📷 Photo ${id}`)].join("\n").trim();
    if (!inChat) newTask();
    void api.send(message);
  };
  const disabled = status && !status.ready ? status.setup || "The agent is switched off." : working ? `${name} is still working on “${api.title || "a task"}”. Open it from the list.` : null;
  const notice = inChat && api.error ? { text: api.error } : voice.state.error ? { text: voice.state.error } : null;

  const install = useInstallPrompt();
  const state = api.busy ? "running" : api.state;
  const presence = status?.working || api.busy ? "working" : status?.waiting ? "waiting" : "idle";
  const live = api.changes.filter((c) => !c.undone).length;

  return (
    <>
      {/* No opacity on the stage, ever: an element that fades cuts what's inside it off from the wallpaper,
          and the frosted platters would stop softening it. */}
      <motion.div
        className="ja-stage"
        animate={sheetOpen ? { scale: 0.92, y: 14, borderRadius: 42 } : { scale: 1, y: 0, borderRadius: 0 }}
        transition={SETTLE}
      >
        <Wallpaper />
        <motion.div className="ja-shade" animate={{ opacity: inChat ? 1 : 0.8 }} transition={{ duration: 0.4 }} />

        <motion.div className="ja-layer" style={{ x: homeX, opacity: homeOpacity, pointerEvents: inChat ? "none" : "auto" }} aria-hidden={inChat}>
          <HomeContent
            status={status}
            threads={threads}
            loading={loading}
            onOpen={openThread}
            onRefresh={async () => {
              await Promise.all([refresh(), loadThreads()]);
            }}
            onModel={() => setSheet("model")}
            install={install}
            clients={clients}
            onClients={() => (setClientFocus(null), setSheet("clients"))}
          />
        </motion.div>

        <AnimatePresence>
          {inChat && (
            <motion.div
              key="chat"
              className="ja-layer"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={PUSH}
              drag={edgeSwipe ? "x" : false}
              dragListener={false}
              dragControls={drag}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={{ left: 0, right: 1 }}
              onDrag={onDrag}
              onDragEnd={dragEnd}
            >
              {edgeSwipe && <div className="ja-edge" onPointerDown={(e) => drag.start(e)} />}
              <ChatContent api={api} status={status} />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="ja-fade-top" aria-hidden="true" />
        <div className="ja-fade-bottom" aria-hidden="true" />

        {/* The floating glass controls: one plane, morphing from screen to screen. */}
        <div className="ja-top">
          <AnimatePresence mode="popLayout" initial={false}>
            {inChat ? (
              <Materialize key="back">
                <LiquidGlass as="button" press className="ja-circle" aria-label="Back to the conversations" onClick={back}>
                  <svg width="13" height="22" viewBox="0 0 12 20" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M10 2 2 10l8 8" />
                  </svg>
                </LiquidGlass>
              </Materialize>
            ) : (
              <Materialize key="presence">
                <button type="button" aria-label={`${name}: ${presence === "working" ? "working" : presence === "waiting" ? "needs you" : "ready"}`} onClick={() => status?.canConfigure && setSheet("model")}>
                  <Droplet size={46} state={presence} />
                </button>
              </Materialize>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {inChat && (
              <motion.div key="title" className="ja-top__title" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }}>
                <strong>{api.title || "New task"}</strong>
                {(api.threadId || api.busy) && <span className={`is-${state}`}>{state === "running" ? <span className="ja-dot is-working" /> : null}{STATUS_TEXT[state] ?? state}</span>}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="ja-top__end">
            <AnimatePresence mode="popLayout" initial={false}>
              {inChat ? (
                <Materialize key="more">
                  <LiquidGlass as="button" press className="ja-circle" aria-label="Plan and changes" onClick={() => api.threadId && setSheet("thread")}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <circle cx="5" cy="12" r="2" />
                      <circle cx="12" cy="12" r="2" />
                      <circle cx="19" cy="12" r="2" />
                    </svg>
                    {live > 0 && <span className="ja-badge">{live}</span>}
                  </LiquidGlass>
                </Materialize>
              ) : (
                <Materialize key="home-tools">
                  <LiquidGlass as="button" press className="ja-circle" aria-label="What it did on its own" onClick={() => setSheet("notices")}>
                    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                    </svg>
                    <AnimatePresence>
                      {status?.unread ? (
                        <motion.span className="ja-badge" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ type: "spring", stiffness: 600, damping: 16 }}>
                          {status.unread}
                        </motion.span>
                      ) : null}
                    </AnimatePresence>
                  </LiquidGlass>
                  <LiquidGlass as="button" press className="ja-circle ja-avatar" aria-label="Settings" onClick={() => setSheet("settings")}>
                    {(me.user.name || me.user.email).slice(0, 1).toUpperCase()}
                  </LiquidGlass>
                </Materialize>
              )}
            </AnimatePresence>
          </div>
        </div>

        <Composer
          placeholder={inChat ? `Message ${name}` : `Ask ${name} anything`}
          busy={api.busy && inChat}
          disabled={disabled}
          notice={notice}
          canTalk={voiceReady}
          onTalk={startTalk}
          onSend={send}
          onStop={() => void api.stop()}
        />
      </motion.div>

      <AnimatePresence>{talking && <VoiceScreen key="voice" voice={voice} name={name} />}</AnimatePresence>

      <SettingsSheet open={sheet === "settings"} onClose={() => setSheet(null)} me={me} status={status} onModel={() => setSheet("model")} onSignOut={onSignOut} onPushChanged={onMeChanged} />
      <ModelSheet open={sheet === "model"} onClose={() => setSheet(null)} status={status} onSwitched={() => void refresh()} />
      <NoticesSheet open={sheet === "notices"} onClose={() => (setSheet(null), void refresh())} onOpenThread={openThread} />
      <ThreadSheet open={sheet === "thread"} onClose={() => setSheet(null)} api={api} />
      <ClientsSheet open={sheet === "clients"} onClose={() => setSheet(null)} focus={clientFocus} onChanged={() => void fetchClientsSummary().then(setClients)} />
    </>
  );
}

/* iOS's Share symbol: a box with an arrow out of the top. */
function ShareIcon() {
  return (
    <svg className="ja-share-icon" width="14" height="16" viewBox="0 0 14 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-label="(the box with an arrow)">
      <path d="M7 11V1M3.5 4.5 7 1l3.5 3.5M4.5 7H2.5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1h-2" />
    </svg>
  );
}

/* "Add to Home Screen": Chrome offers a button; on iPhone it's the Share menu, so it says how. */
type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
const DISMISSED = "ja-install-dismissed";

function useInstallPrompt() {
  const [event, setEvent] = useState<InstallEvent | null>(null);
  const [show, setShow] = useState<"ios" | "prompt" | null>(null);
  useEffect(() => {
    let dismissed = false;
    try {
      dismissed = localStorage.getItem(DISMISSED) === "1";
    } catch {
      // Private browsing: ask every time.
    }
    if (isStandalone() || dismissed) return;
    const t = setTimeout(() => isIOS() && setShow("ios"), 0);
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvent(e as InstallEvent);
      setShow("prompt");
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => {
      clearTimeout(t);
      window.removeEventListener("beforeinstallprompt", onPrompt);
    };
  }, []);
  const dismiss = () => {
    setShow(null);
    try {
      localStorage.setItem(DISMISSED, "1");
    } catch {
      // Fine: it'll ask again next time.
    }
  };
  if (!show) return null;
  return (
    <motion.div className="ja-card ja-platter ja-card--install" initial={{ y: 40, scale: 0.96 }} animate={{ y: 0, scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 24, delay: 0.05 }}>
      {/* eslint-disable-next-line @next/next/no-img-element -- the app icon */}
      <img src="/app/icon-192.png" alt="" width={46} height={46} />
      <span className="ja-card__text">
        <strong>Add Jomiez to your Home Screen</strong>
        <small style={{ whiteSpace: "normal" }}>
          {show === "ios" ? (
            <>
              Tap <b>Share</b> <ShareIcon /> then <b>Add to Home Screen</b>. It opens full screen and can notify you.
            </>
          ) : (
            "It opens full screen, like an app, and can notify you."
          )}
        </small>
      </span>
      {show === "prompt" && event && (
        <button
          type="button"
          className="ja-btn ja-btn--primary ja-btn--small"
          onClick={async () => {
            await event.prompt();
            await event.userChoice.catch(() => null);
            setShow(null);
          }}
        >
          Install
        </button>
      )}
      <button type="button" className="ja-card__close" aria-label="Not now" onClick={dismiss}>
        ×
      </button>
    </motion.div>
  );
}
