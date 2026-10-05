"use client";

import { AnimatePresence, motion, useDragControls, type PanInfo } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAgentStatus, useThread } from "@/cms/admin/agent/useAgent";
import { useVoice } from "@/cms/admin/agent/useVoice";
import { ChatScreen } from "./ChatScreen";
import { GlassPane } from "./Glass";
import { Home } from "./Home";
import { currentEndpoint, isIOS, isStandalone, post, registerWorker, setBadge, type AppUser, type Me, type ThreadRow } from "./lib";
import { Orb } from "./Orb";
import { ModelSheet, NoticesSheet, SettingsSheet } from "./Sheets";
import { SignIn } from "./SignIn";
import { VoiceScreen } from "./VoiceScreen";

/*
 * The phone app (/app). Signs in (or back in, with this phone's device key),
 * then: the conversations, one conversation pushed on top (swipe from the left
 * edge to go back), a live voice call, and sheets for settings, the model and
 * what the agent did on its own. Notifications open the conversation they're
 * about. Everything goes through the same endpoints and rules as the admin.
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
    <div className="ja-app">
      <div className="ja-ambient" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <AnimatePresence mode="wait">
        {phase === "boot" && (
          <motion.div key="boot" className="ja-boot ja-offline" exit={{ opacity: 0, scale: 1.1 }} transition={{ duration: 0.25 }}>
            <Orb size={64} state="working" />
            {/* Shown only if it takes a while: on the free plan the site sleeps when nobody has visited for 15 minutes. */}
            <span className="ja-boot__late">Waking the site up. This takes up to a minute after it has been quiet.</span>
          </motion.div>
        )}
        {phase === "offline" && (
          <motion.div key="offline" className="ja-boot ja-offline" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Orb size={64} state="idle" />
            <strong>You&apos;re offline</strong>
            <span>It carries on as soon as the phone is back online.</span>
            <button type="button" className="ja-btn ja-btn--ghost" onClick={() => void check()}>
              Try again
            </button>
          </motion.div>
        )}
        {phase === "signin" && (
          <SignIn
            key="signin"
            onSignedIn={(user: AppUser) => {
              void (async () => {
                const who = await fetchMe();
                setMe(who.me ?? { signedIn: true, user, push: { key: "", on: false } });
                setPhase("in");
              })();
            }}
          />
        )}
        {phase === "in" && me && <Main key="in" me={me} onSignOut={() => void signOut()} onMeChanged={() => void check()} />}
      </AnimatePresence>
    </div>
  );
}

const PUSH = { type: "spring", stiffness: 380, damping: 38, mass: 0.9 } as const;

function Main({ me, onSignOut, onMeChanged }: { me: Me; onSignOut: () => void; onMeChanged: () => void }) {
  const { status, refresh } = useAgentStatus(20_000);
  const [threads, setThreads] = useState<ThreadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"home" | "chat">("home");
  const [sheet, setSheet] = useState<null | "settings" | "model" | "notices">(null);
  const loadThreads = useCallback(async () => {
    const res = await fetch("/api/agent/threads", { credentials: "include", cache: "no-store" }).catch(() => null);
    if (res?.ok) setThreads((await res.json()).docs ?? []);
    setLoading(false);
  }, []);
  const api = useThread({
    onDone: () => {
      void refresh();
      void loadThreads();
    },
  });
  const voice = useVoice();
  const talking = voice.active;

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
    history.replaceState({ ja: "home" }, "", "/app");
    const t = setTimeout(() => {
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
        const thread = new URL(data.url, location.origin).searchParams.get("thread");
        if (thread) openThread(thread);
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

  /* ---------- Swiping back from the left edge (installed app: Safari has its own) ---------- */

  const drag = useDragControls();
  const [edgeSwipe, setEdgeSwipe] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setEdgeSwipe(isStandalone()), 0);
    return () => clearTimeout(t);
  }, []);
  const dragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x > window.innerWidth * 0.33 || info.velocity.x > 500) back();
  };

  /* ---------- Installing ---------- */

  const install = useInstallPrompt();

  return (
    <motion.div className="ja-main" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      <motion.div
        className="ja-layer"
        animate={view === "chat" ? { x: "-26%", filter: "brightness(0.6)" } : { x: 0, filter: "brightness(1)" }}
        transition={PUSH}
        aria-hidden={view === "chat"}
      >
        <Home
          status={status}
          threads={threads}
          loading={loading}
          onOpen={openThread}
          onNew={newTask}
          onTalk={voiceReady ? startTalk : null}
          onRefresh={async () => {
            await Promise.all([refresh(), loadThreads()]);
          }}
          onModel={() => setSheet("model")}
          onSettings={() => setSheet("settings")}
          onNotices={() => setSheet("notices")}
          install={install}
        />
      </motion.div>

      <AnimatePresence>
        {view === "chat" && (
          <motion.div
            key="chat"
            className="ja-layer ja-layer--top"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={PUSH}
            drag={edgeSwipe ? "x" : false}
            dragListener={false}
            dragControls={drag}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={{ left: 0, right: 1 }}
            onDragEnd={dragEnd}
          >
            {edgeSwipe && <div className="ja-edge" onPointerDown={(e) => drag.start(e)} />}
            <ChatScreen api={api} status={status} onBack={back} onTalk={voiceReady ? startTalk : null} voiceNotice={voice.state.error} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>{talking && <VoiceScreen key="voice" voice={voice} name={status?.name ?? "Agent"} />}</AnimatePresence>

      <SettingsSheet
        open={sheet === "settings"}
        onClose={() => setSheet(null)}
        me={me}
        status={status}
        onModel={() => setSheet("model")}
        onSignOut={onSignOut}
        onPushChanged={onMeChanged}
      />
      <ModelSheet open={sheet === "model"} onClose={() => setSheet(null)} status={status} onSwitched={() => void refresh()} />
      <NoticesSheet open={sheet === "notices"} onClose={() => (setSheet(null), void refresh())} onOpenThread={openThread} />
    </motion.div>
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
    <GlassPane tone="thick" className="ja-card ja-card--install">
      {/* eslint-disable-next-line @next/next/no-img-element -- the app icon */}
      <img src="/app/icon-192.png" alt="" width={44} height={44} />
      <span className="ja-card__text">
        <strong>Put Jomiez on your home screen</strong>
        <small>
          {show === "ios" ? (
            <>
              Tap <b>Share</b> <ShareIcon />, then <b>Add to Home Screen</b>. It opens full screen and can send you notifications.
            </>
          ) : (
            "It opens full screen, like an app, and can send you notifications."
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
    </GlassPane>
  );
}
