"use client";

import { useEffect, useMemo, useRef, useState } from "react";

/* =========================================================
   GoofyAI Beta 1.0
   File: src/app/page.js
   Notes:
   - Browser title stays GoofyAI
   - Local browser accounts only
   - Chat sidebar with floating three-dot menus
   - Studio panel for themes/settings
   - Streaming or non-streaming toggle
   - Stop button replaces send button during response
   - Compact, polished release-style UI
========================================================= */

const APP_NAME = "GoofyAI";
const APP_VERSION = "Beta 1.0";

const STORAGE_VERSION = "beta_1_0";
const PROFILES_KEY = `goofyai_profiles_${STORAGE_VERSION}`;
const ACTIVE_PROFILE_KEY = `goofyai_active_profile_${STORAGE_VERSION}`;
const THEME_KEY = `goofyai_theme_${STORAGE_VERSION}`;
const CUSTOM_KEY = `goofyai_custom_${STORAGE_VERSION}`;
const SETTINGS_KEY = `goofyai_settings_${STORAGE_VERSION}`;

function chatsKey(profileId) {
  return `goofyai_chats_${STORAGE_VERSION}_${profileId}`;
}

const THEMES = [
  {
    id: "blue",
    name: "Blue Nebula",
    primary: "#58a6ff",
    secondary: "#6d5cff",
    panelDark: "#061326",
    userBubble: "#1f3f91",
  },
  {
    id: "midnight",
    name: "Midnight Snack",
    primary: "#818cf8",
    secondary: "#38bdf8",
    panelDark: "#070617",
    userBubble: "#3730a3",
  },
  {
    id: "ocean",
    name: "Deep Ocean",
    primary: "#22d3ee",
    secondary: "#2563eb",
    panelDark: "#061a2b",
    userBubble: "#075985",
  },
  {
    id: "purple",
    name: "Purple Void",
    primary: "#c084fc",
    secondary: "#ff5bd6",
    panelDark: "#19072e",
    userBubble: "#5e2d8f",
  },
  {
    id: "rose",
    name: "Rose Glitch",
    primary: "#fb7185",
    secondary: "#f472b6",
    panelDark: "#250713",
    userBubble: "#9f1239",
  },
  {
    id: "lava",
    name: "Lava Mode",
    primary: "#ff9a4a",
    secondary: "#ffd166",
    panelDark: "#2b0d05",
    userBubble: "#913418",
  },
  {
    id: "gold",
    name: "Gold Rush",
    primary: "#facc15",
    secondary: "#fb923c",
    panelDark: "#211506",
    userBubble: "#92400e",
  },
  {
    id: "mint",
    name: "Mint Comet",
    primary: "#5eead4",
    secondary: "#14b8a6",
    panelDark: "#05201e",
    userBubble: "#0f766e",
  },
  {
    id: "matrix",
    name: "Matrix Gremlin",
    primary: "#22c55e",
    secondary: "#84cc16",
    panelDark: "#031107",
    userBubble: "#166534",
  },
  {
    id: "ice",
    name: "Ice Core",
    primary: "#a5f3fc",
    secondary: "#60a5fa",
    panelDark: "#071b2d",
    userBubble: "#155e75",
  },
  {
    id: "storm",
    name: "Storm Mode",
    primary: "#93c5fd",
    secondary: "#64748b",
    panelDark: "#08111f",
    userBubble: "#1e3a8a",
  },
  {
    id: "cotton",
    name: "Cotton Candy",
    primary: "#f9a8d4",
    secondary: "#93c5fd",
    panelDark: "#1b0b22",
    userBubble: "#7e22ce",
  },
];

const DEFAULT_CUSTOM = {
  sidebarWidth: 248,
  fontSize: 16,
  radius: 16,
  inputRoundness: 18,
  glow: 44,
  borderStrength: 40,
  backgroundEnergy: 48,
  gradientAngle: 135,
  inputTint: 16,
  messageSpacing: 28,
  bubbleWidth: 48,
  assistantWidth: 78,
  panelOpacity: 92,
  topBarOpacity: 34,
};

const DEFAULT_SETTINGS = {
  streaming: true,
  smootherStreaming: true,
  saveChats: true,
  autoScroll: true,
  enterToSend: true,
  showTimestamps: true,
  showMessageNames: true,
  compactMode: false,
  welcomeMessages: true,
  confirmDelete: true,
  reduceMotion: false,
  sendButtonGlow: true,
};

const GOOFY_OPENERS = [
  "I just checked the fridge. Still no answers, only leftovers.",
  "Good news: I am awake. Bad news: I have opinions.",
  "Ask me anything. I promise to be helpful, dramatic, and only slightly weird.",
  "I am ready. My brain is wearing tiny sunglasses.",
  "Welcome back. I cleaned absolutely nothing while you were gone.",
  "I have prepared three thoughts. Two are useful. One is a raccoon.",
  "The vibes are loading. Please do not shake the computer.",
  "Hello, human. I have stretched my digital ankles.",
  "I am here, caffeinated by electricity and questionable confidence.",
  "Today feels like a good day to answer questions and mildly roast reality.",
  "I woke up and chose helpful chaos.",
  "The toaster sends its regards. I do not trust it.",
  "I put on my thinking hat. It is invisible and probably backwards.",
  "Welcome. I am calm, focused, and lying about both.",
  "Ask away. My neurons are doing jumping jacks.",
  "I am ready to help. The ducks have been informed.",
  "I have opened the brain drawer. It squeaked.",
  "Hello. I brought snacks for the conversation. Metaphorical snacks.",
  "My wisdom level is medium rare, but we proceed.",
  "Let us solve things before the furniture gets suspicious.",
  "The digital raccoon has clocked in.",
  "The chaos is organized alphabetically today.",
  "I am ready to be useful and mildly concerning.",
  "The toaster has filed a complaint.",
];

function clampNumber(value, fallback, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, number));
}

function text(value, fallback = "") {
  return String(value ?? fallback);
}

function clean(value) {
  return String(value || "").trim();
}

function nowIso() {
  return new Date().toISOString();
}

function randomFrom(list, fallback) {
  if (!Array.isArray(list) || list.length === 0) return fallback;
  return list[Math.floor(Math.random() * list.length)];
}

function hexAlpha(percent) {
  const safePercent = Math.max(0, Math.min(100, Number(percent) || 0));
  const value = Math.round((safePercent / 100) * 255);
  return value.toString(16).padStart(2, "0");
}

function formatDateTime(iso) {
  try {
    return new Date(iso).toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function makeId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

export default function Page() {
  const [loaded, setLoaded] = useState(false);

  const [profiles, setProfiles] = useState([]);
  const [activeProfileId, setActiveProfileId] = useState(null);
  const [profileNameInput, setProfileNameInput] = useState("");

  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [chatSearch, setChatSearch] = useState("");

  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState(null);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [studioOpen, setStudioOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  const [sidebarMenuOpen, setSidebarMenuOpen] = useState(false);
  const [chatMenu, setChatMenu] = useState(null);

  const [renameChatId, setRenameChatId] = useState(null);
  const [renameValue, setRenameValue] = useState("");

  const [themeIndex, setThemeIndex] = useState(0);
  const [custom, setCustom] = useState(DEFAULT_CUSTOM);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  const [toast, setToast] = useState("");

  const abortRef = useRef(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const toastTimerRef = useRef(null);

  const baseTheme = THEMES[themeIndex] || THEMES[0];

  const safeCustom = useMemo(() => {
    return {
      sidebarWidth: clampNumber(custom.sidebarWidth, DEFAULT_CUSTOM.sidebarWidth, 190, 390),
      fontSize: clampNumber(custom.fontSize, DEFAULT_CUSTOM.fontSize, 13, 22),
      radius: clampNumber(custom.radius, DEFAULT_CUSTOM.radius, 6, 30),
      inputRoundness: clampNumber(custom.inputRoundness, DEFAULT_CUSTOM.inputRoundness, 8, 34),
      glow: clampNumber(custom.glow, DEFAULT_CUSTOM.glow, 0, 100),
      borderStrength: clampNumber(custom.borderStrength, DEFAULT_CUSTOM.borderStrength, 0, 100),
      backgroundEnergy: clampNumber(custom.backgroundEnergy, DEFAULT_CUSTOM.backgroundEnergy, 8, 95),
      gradientAngle: clampNumber(custom.gradientAngle, DEFAULT_CUSTOM.gradientAngle, 0, 360),
      inputTint: clampNumber(custom.inputTint, DEFAULT_CUSTOM.inputTint, 4, 45),
      messageSpacing: clampNumber(custom.messageSpacing, DEFAULT_CUSTOM.messageSpacing, 14, 54),
      bubbleWidth: clampNumber(custom.bubbleWidth, DEFAULT_CUSTOM.bubbleWidth, 30, 78),
      assistantWidth: clampNumber(custom.assistantWidth, DEFAULT_CUSTOM.assistantWidth, 45, 92),
      panelOpacity: clampNumber(custom.panelOpacity, DEFAULT_CUSTOM.panelOpacity, 55, 100),
      topBarOpacity: clampNumber(custom.topBarOpacity, DEFAULT_CUSTOM.topBarOpacity, 8, 80),
    };
  }, [custom]);

  const safeSettings = useMemo(() => {
    return {
      streaming:
        typeof settings.streaming === "boolean"
          ? settings.streaming
          : DEFAULT_SETTINGS.streaming,
      smootherStreaming:
        typeof settings.smootherStreaming === "boolean"
          ? settings.smootherStreaming
          : DEFAULT_SETTINGS.smootherStreaming,
      saveChats:
        typeof settings.saveChats === "boolean"
          ? settings.saveChats
          : DEFAULT_SETTINGS.saveChats,
      autoScroll:
        typeof settings.autoScroll === "boolean"
          ? settings.autoScroll
          : DEFAULT_SETTINGS.autoScroll,
      enterToSend:
        typeof settings.enterToSend === "boolean"
          ? settings.enterToSend
          : DEFAULT_SETTINGS.enterToSend,
      showTimestamps:
        typeof settings.showTimestamps === "boolean"
          ? settings.showTimestamps
          : DEFAULT_SETTINGS.showTimestamps,
      showMessageNames:
        typeof settings.showMessageNames === "boolean"
          ? settings.showMessageNames
          : DEFAULT_SETTINGS.showMessageNames,
      compactMode:
        typeof settings.compactMode === "boolean"
          ? settings.compactMode
          : DEFAULT_SETTINGS.compactMode,
      welcomeMessages:
        typeof settings.welcomeMessages === "boolean"
          ? settings.welcomeMessages
          : DEFAULT_SETTINGS.welcomeMessages,
      confirmDelete:
        typeof settings.confirmDelete === "boolean"
          ? settings.confirmDelete
          : DEFAULT_SETTINGS.confirmDelete,
      reduceMotion:
        typeof settings.reduceMotion === "boolean"
          ? settings.reduceMotion
          : DEFAULT_SETTINGS.reduceMotion,
      sendButtonGlow:
        typeof settings.sendButtonGlow === "boolean"
          ? settings.sendButtonGlow
          : DEFAULT_SETTINGS.sendButtonGlow,
    };
  }, [settings]);

  const theme = useMemo(() => {
    const energy = safeCustom.backgroundEnergy;
    const panelAlpha = hexAlpha(safeCustom.panelOpacity);

    return {
      mainBg: `
        radial-gradient(circle at 72% 3%, ${baseTheme.primary}${hexAlpha(energy)}, transparent 32%),
        radial-gradient(circle at 8% 94%, ${baseTheme.secondary}${hexAlpha(Math.round(energy * 0.65))}, transparent 42%),
        linear-gradient(${safeCustom.gradientAngle}deg, #020712 0%, ${baseTheme.panelDark} 48%, #02040a 100%)
      `,
      sidebarBg: `
        radial-gradient(circle at 20% 0%, ${baseTheme.primary}${hexAlpha(Math.round(energy * 0.48))}, transparent 38%),
        linear-gradient(180deg, ${baseTheme.panelDark}${panelAlpha}, #020712 100%)
      `,
      chatBg: `
        radial-gradient(circle at 60% 0%, ${baseTheme.primary}${hexAlpha(Math.round(energy * 0.72))}, transparent 34%),
        radial-gradient(circle at 96% 100%, ${baseTheme.secondary}${hexAlpha(Math.round(energy * 0.35))}, transparent 34%),
        linear-gradient(180deg, ${baseTheme.panelDark}bb, #020712 95%)
      `,
      button: `linear-gradient(135deg, ${baseTheme.primary}, ${baseTheme.secondary})`,
      userBubble: `linear-gradient(135deg, ${baseTheme.userBubble}ee, ${baseTheme.panelDark}ee)`,
      inputBg: `
        linear-gradient(135deg,
          ${baseTheme.primary}${hexAlpha(safeCustom.inputTint)},
          rgba(8, 22, 48, 0.94) 42%,
          ${baseTheme.panelDark}ee
        )
      `,
      topBarBg: `rgba(3, 12, 29, ${safeCustom.topBarOpacity / 100})`,
    };
  }, [baseTheme, safeCustom]);

  const activeProfile =
    profiles.find((profile) => profile.id === activeProfileId) || null;

  const activeChat =
    chats.find((chat) => chat.id === activeChatId) || chats[0] || null;

  const messages = activeChat?.messages || [];

  const filteredChats = useMemo(() => {
    const query = clean(chatSearch).toLowerCase();
    const sorted = sortChats(chats);

    if (!query) return sorted;

    return sorted.filter((chat) => {
      const titleMatch = text(chat.title).toLowerCase().includes(query);
      const messageMatch = Array.isArray(chat.messages)
        ? chat.messages.some((message) =>
            text(message.text).toLowerCase().includes(query)
          )
        : false;

      return titleMatch || messageMatch;
    });
  }, [chats, chatSearch]);

  function showToast(message) {
    setToast(message);

    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);

    toastTimerRef.current = setTimeout(() => {
      setToast("");
    }, 2400);
  }

  function getTime() {
    return new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function makeUserMessage(messageText) {
    return {
      id: makeId(),
      role: "user",
      text: messageText,
      time: getTime(),
    };
  }

  function makeAssistantMessage(messageText) {
    return {
      id: makeId(),
      role: "assistant",
      text: messageText,
      time: getTime(),
    };
  }

  function makeNewChat(firstText) {
    return {
      id: makeId(),
      title: "New Chat",
      pinned: false,
      updatedAt: nowIso(),
      messages: [
        makeAssistantMessage(
          firstText ||
            (safeSettings.welcomeMessages
              ? randomFrom(GOOFY_OPENERS, "Welcome to GoofyAI.")
              : "New chat ready.")
        ),
      ],
    };
  }

  function sortChats(list) {
    return [...list].sort((a, b) => {
      if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1;

      return (
        new Date(b.updatedAt || 0).getTime() -
        new Date(a.updatedAt || 0).getTime()
      );
    });
  }

  function sanitizeProfiles(value) {
    if (!Array.isArray(value)) return [];

    return value
      .filter((profile) => profile && typeof profile === "object")
      .map((profile) => ({
        id: text(profile.id, makeId()),
        name: clean(profile.name || "Guest").slice(0, 24) || "Guest",
        createdAt: profile.createdAt || nowIso(),
      }));
  }

  function sanitizeChats(value) {
    if (!Array.isArray(value)) return null;

    const cleaned = value
      .filter((chat) => chat && typeof chat === "object")
      .map((chat) => {
        const safeMessages = Array.isArray(chat.messages)
          ? chat.messages
              .filter((message) => message && typeof message === "object")
              .map((message) => ({
                id: message.id || makeId(),
                role: message.role === "user" ? "user" : "assistant",
                text: text(message.text),
                time: message.time || getTime(),
              }))
          : [];

        return {
          id: chat.id || makeId(),
          title: text(chat.title, "New Chat").slice(0, 48),
          pinned: !!chat.pinned,
          updatedAt: chat.updatedAt || nowIso(),
          messages:
            safeMessages.length > 0
              ? safeMessages
              : [makeAssistantMessage("Recovered empty chat.")],
        };
      });

    return cleaned.length > 0 ? sortChats(cleaned) : null;
  }

  function sanitizeCustom(value) {
    const parsed = value && typeof value === "object" ? value : {};
    return {
      ...DEFAULT_CUSTOM,
      ...parsed,
    };
  }

  function sanitizeSettings(value) {
    const parsed = value && typeof value === "object" ? value : {};
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
    };
  }

  function loadChats(profileId) {
    if (!profileId) return [];

    try {
      const raw = localStorage.getItem(chatsKey(profileId));
      if (!raw) return [makeNewChat()];
      return sanitizeChats(JSON.parse(raw)) || [makeNewChat()];
    } catch {
      return [makeNewChat()];
    }
  }

  useEffect(() => {
    document.title = APP_NAME;

    try {
      const savedTheme = localStorage.getItem(THEME_KEY);
      const savedCustom = localStorage.getItem(CUSTOM_KEY);
      const savedSettings = localStorage.getItem(SETTINGS_KEY);
      const savedProfiles = localStorage.getItem(PROFILES_KEY);
      const savedActiveProfile = localStorage.getItem(ACTIVE_PROFILE_KEY);

      if (savedTheme) {
        const index = THEMES.findIndex((themeItem) => themeItem.id === savedTheme);
        if (index >= 0) setThemeIndex(index);
      }

      if (savedCustom) setCustom(sanitizeCustom(JSON.parse(savedCustom)));
      if (savedSettings) setSettings(sanitizeSettings(JSON.parse(savedSettings)));

      const safeProfiles = savedProfiles
        ? sanitizeProfiles(JSON.parse(savedProfiles))
        : [];

      setProfiles(safeProfiles);

      if (safeProfiles.length > 0) {
        const chosen =
          safeProfiles.find((profile) => profile.id === savedActiveProfile) ||
          safeProfiles[0];

        const loadedChats = loadChats(chosen.id);

        setActiveProfileId(chosen.id);
        setChats(loadedChats);
        setActiveChatId(loadedChats[0]?.id || null);
        setAccountOpen(false);
      } else {
        setAccountOpen(true);
      }
    } catch {
      setAccountOpen(true);
    }

    setLoaded(true);
  }, []);

  useEffect(() => {
    document.title = APP_NAME;
  }, [loaded, activeProfileId, themeIndex]);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
    } catch {}
  }, [profiles, loaded]);

  useEffect(() => {
    if (!loaded || !activeProfileId) return;
    try {
      localStorage.setItem(ACTIVE_PROFILE_KEY, activeProfileId);
    } catch {}
  }, [activeProfileId, loaded]);

  useEffect(() => {
    if (!loaded || !activeProfileId || !safeSettings.saveChats) return;
    try {
      localStorage.setItem(chatsKey(activeProfileId), JSON.stringify(chats));
    } catch {}
  }, [loaded, activeProfileId, chats, safeSettings.saveChats]);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(THEME_KEY, baseTheme.id);
      localStorage.setItem(CUSTOM_KEY, JSON.stringify(safeCustom));
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(safeSettings));
    } catch {}
  }, [loaded, baseTheme.id, safeCustom, safeSettings]);

  useEffect(() => {
    if (!activeChatId && chats.length > 0) {
      setActiveChatId(chats[0].id);
    }
  }, [activeChatId, chats]);

  useEffect(() => {
    if (!safeSettings.autoScroll) return;

    bottomRef.current?.scrollIntoView({
      behavior: safeSettings.reduceMotion ? "auto" : "smooth",
    });
  }, [messages, thinking, safeSettings.autoScroll, safeSettings.reduceMotion]);

  function createAccount(name) {
    const cleanName = clean(name).slice(0, 24);
    if (!cleanName) return;

    const profile = {
      id: makeId(),
      name: cleanName,
      createdAt: nowIso(),
    };

    const firstChats = [
      makeNewChat(`Welcome, ${cleanName}. This account is saved only on this browser.`),
    ];

    setProfiles((old) => [profile, ...old]);
    setActiveProfileId(profile.id);
    setChats(firstChats);
    setActiveChatId(firstChats[0].id);
    setProfileNameInput("");
    setAccountOpen(false);

    try {
      localStorage.setItem(chatsKey(profile.id), JSON.stringify(firstChats));
      localStorage.setItem(ACTIVE_PROFILE_KEY, profile.id);
    } catch {}

    showToast(`Account created: ${cleanName}`);
  }

  function switchAccount(profileId) {
    const profile = profiles.find((item) => item.id === profileId);
    if (!profile) return;

    const profileChats = loadChats(profile.id);

    setActiveProfileId(profile.id);
    setChats(profileChats);
    setActiveChatId(profileChats[0]?.id || null);
    setInput("");
    setThinking(false);
    setStreamingMessageId(null);
    setAccountOpen(false);

    showToast(`Switched to ${profile.name}`);
  }

  function deleteAccount(profileId) {
    const profile = profiles.find((item) => item.id === profileId);
    if (!profile) return;

    if (safeSettings.confirmDelete) {
      const ok = window.confirm(
        `Delete account "${profile.name}" from this browser?`
      );
      if (!ok) return;
    }

    const remaining = profiles.filter((item) => item.id !== profileId);

    try {
      localStorage.removeItem(chatsKey(profileId));
    } catch {}

    setProfiles(remaining);

    if (activeProfileId === profileId) {
      if (remaining.length > 0) {
        switchAccount(remaining[0].id);
      } else {
        setActiveProfileId(null);
        setChats([]);
        setActiveChatId(null);
        setAccountOpen(true);
      }
    }

    showToast(`Deleted ${profile.name}`);
  }

  function updateActiveChatMessages(nextMessages) {
    if (!activeChat) return;

    setChats((oldChats) =>
      sortChats(
        oldChats.map((chat) => {
          if (chat.id !== activeChat.id) return chat;

          const firstUserMessage = nextMessages.find(
            (message) => message.role === "user"
          );

          return {
            ...chat,
            updatedAt: nowIso(),
            title: firstUserMessage
              ? firstUserMessage.text.slice(0, 42)
              : chat.title || "New Chat",
            messages: nextMessages,
          };
        })
      )
    );
  }

  function patchAssistantMessage(chatId, messageId, nextText) {
    setChats((oldChats) =>
      sortChats(
        oldChats.map((chat) => {
          if (chat.id !== chatId) return chat;

          return {
            ...chat,
            updatedAt: nowIso(),
            messages: chat.messages.map((message) =>
              message.id === messageId ? { ...message, text: nextText } : message
            ),
          };
        })
      )
    );
  }

  function createNewChat() {
    if (!activeProfile) {
      setAccountOpen(true);
      return;
    }

    const chat = makeNewChat();

    setChats((oldChats) => sortChats([chat, ...oldChats]));
    setActiveChatId(chat.id);
    setInput("");
    setThinking(false);
    setStreamingMessageId(null);
    setChatMenu(null);
    setSidebarMenuOpen(false);

    setTimeout(() => inputRef.current?.focus(), 80);
  }

  function clearCurrentChat() {
    if (!activeChat) return;

    if (safeSettings.confirmDelete) {
      const ok = window.confirm("Clear this chat?");
      if (!ok) return;
    }

    updateActiveChatMessages([
      makeAssistantMessage(randomFrom(GOOFY_OPENERS, "Fresh start.")),
    ]);

    setSidebarMenuOpen(false);
    showToast("Current chat cleared");
  }

  function clearAllChats() {
    if (safeSettings.confirmDelete) {
      const ok = window.confirm("Clear all chats for this account?");
      if (!ok) return;
    }

    const chat = makeNewChat("Fresh start.");
    setChats([chat]);
    setActiveChatId(chat.id);
    setInput("");
    setThinking(false);
    setStreamingMessageId(null);
    setChatMenu(null);
    setSidebarMenuOpen(false);
    showToast("All chats cleared");
  }

  function deleteChat(chatId) {
    const chat = chats.find((item) => item.id === chatId);
    if (!chat) return;

    if (safeSettings.confirmDelete) {
      const ok = window.confirm(`Delete chat "${chat.title}"?`);
      if (!ok) return;
    }

    setChats((oldChats) => {
      const remaining = oldChats.filter((item) => item.id !== chatId);

      if (remaining.length === 0) {
        const freshChat = makeNewChat("Everything was deleted. Fresh start.");
        setActiveChatId(freshChat.id);
        return [freshChat];
      }

      if (activeChatId === chatId) {
        setActiveChatId(remaining[0].id);
      }

      return sortChats(remaining);
    });

    setChatMenu(null);
    showToast("Chat deleted");
  }

  function togglePinChat(chatId) {
    setChats((oldChats) =>
      sortChats(
        oldChats.map((chat) =>
          chat.id === chatId
            ? { ...chat, pinned: !chat.pinned, updatedAt: nowIso() }
            : chat
        )
      )
    );

    setChatMenu(null);
  }

  function startRenameChat(chat) {
    setRenameChatId(chat.id);
    setRenameValue(chat.title || "New Chat");
    setChatMenu(null);
  }

  function saveRenameChat() {
    const nextTitle = clean(renameValue).slice(0, 48);

    if (!renameChatId || !nextTitle) {
      setRenameChatId(null);
      setRenameValue("");
      return;
    }

    setChats((oldChats) =>
      oldChats.map((chat) =>
        chat.id === renameChatId
          ? { ...chat, title: nextTitle, updatedAt: nowIso() }
          : chat
      )
    );

    setRenameChatId(null);
    setRenameValue("");
    showToast("Chat renamed");
  }

  function exportChat(chatId) {
    const chat = chats.find((item) => item.id === chatId);
    if (!chat) return;

    const fileText = [
      `${APP_NAME} ${APP_VERSION}`,
      `Chat: ${chat.title}`,
      `Exported: ${new Date().toLocaleString()}`,
      "",
      ...chat.messages.map((message) => {
        const who = message.role === "user" ? "You" : APP_NAME;
        return `${who} (${message.time}):\n${message.text}\n`;
      }),
    ].join("\n");

    const blob = new Blob([fileText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `${chat.title || "goofyai-chat"}.txt`;
    link.click();

    URL.revokeObjectURL(url);
    setChatMenu(null);
    setSidebarMenuOpen(false);
    showToast("Chat exported");
  }

  function stopResponse() {
    try {
      abortRef.current?.abort();
    } catch {}

    setThinking(false);
    setStreamingMessageId(null);
  }

  async function sendText(value) {
    const messageText = clean(value);

    if (!messageText || thinking || !activeChat || !activeProfile) return;

    const chatIdAtStart = activeChat.id;
    const userMessage = makeUserMessage(messageText);
    const assistantMessage = makeAssistantMessage("");
    const nextMessages = [...activeChat.messages, userMessage, assistantMessage];

    updateActiveChatMessages(nextMessages);
    setInput("");
    setThinking(true);
    setStreamingMessageId(assistantMessage.id);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          message: messageText,
          messages: [...activeChat.messages, userMessage].slice(-6),
          profileName: activeProfile.name,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error("No response body");
      }

      if (!safeSettings.streaming) {
        const fullReply = await response.text();

        patchAssistantMessage(
          chatIdAtStart,
          assistantMessage.id,
          clean(fullReply) || "I tried to answer, but my brain returned an empty paper bag."
        );
      } else {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        let fullReply = "";
        let displayedReply = "";
        let lastFlush = Date.now();

        function flush(force = false) {
          const now = Date.now();
          const delay = safeSettings.smootherStreaming ? 38 : 4;

          if (!force && now - lastFlush < delay) return;
          if (displayedReply === fullReply) return;

          displayedReply = fullReply;
          lastFlush = now;
          patchAssistantMessage(chatIdAtStart, assistantMessage.id, displayedReply);
        }

        while (true) {
          const { done, value: chunk } = await reader.read();
          if (done) break;

          fullReply += decoder.decode(chunk, { stream: true });
          flush(false);
        }

        flush(true);

        if (!clean(fullReply)) {
          patchAssistantMessage(
            chatIdAtStart,
            assistantMessage.id,
            "I tried to answer, but my brain returned an empty paper bag."
          );
        }
      }
    } catch (error) {
      if (error?.name === "AbortError") {
        patchAssistantMessage(chatIdAtStart, assistantMessage.id, "Response stopped.");
      } else {
        console.error(error);
        patchAssistantMessage(
          chatIdAtStart,
          assistantMessage.id,
          "Could not connect to Ollama. Make sure Ollama is running, then try again."
        );
      }
    }

    setThinking(false);
    setStreamingMessageId(null);
    abortRef.current = null;
  }

  function handleInputKeyDown(event) {
    if (!safeSettings.enterToSend) return;

    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendText(input);
    }
  }

  function updateCustom(key, value) {
    setCustom((old) => ({
      ...old,
      [key]: value,
    }));
  }

  function updateSetting(key, value) {
    setSettings((old) => ({
      ...old,
      [key]: value,
    }));
  }

  function resetThemeControls() {
    setCustom(DEFAULT_CUSTOM);
    showToast("Theme controls reset");
  }

  function resetSettings() {
    setSettings(DEFAULT_SETTINGS);
    showToast("Settings reset");
  }

  function openFloatingChatMenu(event, chatId) {
    event.stopPropagation();

    const rect = event.currentTarget.getBoundingClientRect();
    const menuHeight = 176;
    const padding = 10;

    const top = Math.max(
      padding,
      Math.min(rect.top - 8, window.innerHeight - menuHeight - padding)
    );

    const left = sidebarOpen ? safeCustom.sidebarWidth + 10 : 58;

    setSidebarMenuOpen(false);

    setChatMenu((old) =>
      old?.id === chatId
        ? null
        : {
            id: chatId,
            top,
            left,
          }
    );
  }

  function menuItem(label, action, danger = false) {
    return (
      <button
        onClick={(event) => {
          event.stopPropagation();
          action();
        }}
        style={{
          width: "100%",
          background: "transparent",
          border: "none",
          color: danger ? "#fecaca" : "#f4f7ff",
          padding: "9px 10px",
          textAlign: "left",
          cursor: "pointer",
          fontSize: "13px",
          borderRadius: "8px",
        }}
        onMouseEnter={(event) => {
          event.currentTarget.style.background = danger
            ? "rgba(239, 68, 68, 0.18)"
            : "rgba(255,255,255,0.08)";
        }}
        onMouseLeave={(event) => {
          event.currentTarget.style.background = "transparent";
        }}
      >
        {label}
      </button>
    );
  }

  function slider(label, key, min, max) {
    const value = safeCustom[key];

    return (
      <div style={{ marginBottom: "16px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "7px",
            color: "#dbe6ff",
            fontSize: "13px",
          }}
        >
          <span>{label}</span>
          <span>{value}</span>
        </div>

        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(event) => updateCustom(key, Number(event.target.value))}
          style={{
            width: "100%",
            accentColor: baseTheme.primary,
          }}
        />
      </div>
    );
  }

  function toggle(label, description, key) {
    return (
      <label
        style={{
          display: "block",
          padding: "11px",
          marginBottom: "10px",
          borderRadius: `${safeCustom.radius}px`,
          border: `1px solid ${baseTheme.primary}33`,
          background: "rgba(0,0,0,0.16)",
          cursor: "pointer",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "10px",
            alignItems: "center",
          }}
        >
          <span style={{ color: "#f4f7ff", fontSize: "13px", fontWeight: 800 }}>
            {label}
          </span>

          <input
            type="checkbox"
            checked={!!safeSettings[key]}
            onChange={(event) => updateSetting(key, event.target.checked)}
            style={{
              width: "18px",
              height: "18px",
              accentColor: baseTheme.primary,
            }}
          />
        </div>

        <div
          style={{
            marginTop: "6px",
            color: "#9aa8cc",
            fontSize: "11px",
            lineHeight: 1.35,
          }}
        >
          {description}
        </div>
      </label>
    );
  }

  const titleStyle = {
    color: baseTheme.primary,
    fontWeight: 900,
    letterSpacing: "-1px",
    textShadow: `0 0 ${safeCustom.glow / 2}px ${baseTheme.primary}88`,
  };

  const iconButton = {
    width: "42px",
    height: "42px",
    borderRadius: `${safeCustom.radius}px`,
    border: `1px solid ${baseTheme.primary}88`,
    background: "rgba(8, 23, 47, 0.72)",
    color: baseTheme.primary,
    cursor: "pointer",
    fontSize: "19px",
    display: "grid",
    placeItems: "center",
  };

  const chatPadding = safeSettings.compactMode
    ? "18px 24px 14px"
    : "28px 34px 20px";

  const messagePadding = safeSettings.compactMode ? "10px" : "18px";

  const floatingChat = chatMenu
    ? chats.find((chat) => chat.id === chatMenu.id)
    : null;

  if (!loaded) {
    return (
      <>
        <style>{`
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            width: 100%;
            height: 100%;
            overflow: hidden;
            background: #020814;
          }

          * { box-sizing: border-box; }
        `}</style>

        <main
          style={{
            position: "fixed",
            inset: 0,
            display: "grid",
            placeItems: "center",
            background: theme.mainBg,
            color: "white",
            fontFamily: "Arial, Helvetica, sans-serif",
          }}
        >
          <div style={{ color: baseTheme.primary, fontWeight: 800 }}>
            GoofyAI is booting...
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <style>{`
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          width: 100%;
          height: 100%;
          overflow: hidden;
          background: #020814;
        }

        * {
          box-sizing: border-box;
        }

        button, input, textarea {
          font-family: Arial, Helvetica, sans-serif;
        }

        button:hover {
          filter: brightness(1.08);
        }

        button:disabled {
          filter: none;
        }

        ::-webkit-scrollbar {
          width: 10px;
          height: 10px;
        }

        ::-webkit-scrollbar-track {
          background: #020814;
        }

        ::-webkit-scrollbar-thumb {
          background: ${baseTheme.primary}88;
          border-radius: 999px;
          border: 2px solid #020814;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: ${baseTheme.primary};
        }

        @keyframes softPop {
          from { opacity: 0; transform: scale(0.97); }
          to { opacity: 1; transform: scale(1); }
        }

        @keyframes floatIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes blinkDots {
          0%, 100% { opacity: 0.35; }
          50% { opacity: 1; }
        }

        .chat-row .chat-menu-button {
          opacity: 0;
          pointer-events: none;
          transition: opacity 140ms ease, background 140ms ease;
        }

        .chat-row:hover .chat-menu-button,
        .chat-row.menu-open .chat-menu-button {
          opacity: 1;
          pointer-events: auto;
        }
      `}</style>

      <main
        onClick={() => {
          setChatMenu(null);
          setSidebarMenuOpen(false);
        }}
        style={{
          position: "fixed",
          inset: 0,
          width: "100vw",
          height: "100vh",
          margin: 0,
          padding: 0,
          overflow: "hidden",
          color: "white",
          display: "flex",
          fontFamily: "Arial, Helvetica, sans-serif",
          background: theme.mainBg,
          border: `1px solid rgba(220, 230, 255, ${safeCustom.borderStrength / 100})`,
          boxShadow: `inset 0 0 0 1px rgba(180, 205, 255, 0.18), inset 0 0 ${safeCustom.glow}px ${baseTheme.primary}2a`,
          transition: "background 400ms ease",
        }}
      >
        <aside
          style={{
            width: sidebarOpen ? `${safeCustom.sidebarWidth}px` : "0px",
            minWidth: sidebarOpen ? `${safeCustom.sidebarWidth}px` : "0px",
            height: "100%",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            padding: sidebarOpen ? "20px 14px" : "20px 0px",
            background: theme.sidebarBg,
            borderRight: sidebarOpen
              ? "1px solid rgba(185, 205, 255, 0.22)"
              : "1px solid transparent",
            transition:
              "width 260ms ease, min-width 260ms ease, padding 260ms ease, background 400ms ease",
          }}
        >
          <div
            style={{
              minWidth: "210px",
              height: "100%",
              opacity: sidebarOpen ? 1 : 0,
              transform: sidebarOpen ? "translateX(0)" : "translateX(-14px)",
              transition: safeSettings.reduceMotion
                ? "none"
                : "opacity 200ms ease, transform 260ms ease",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ marginBottom: "16px" }}>
              <div style={{ fontSize: "23px", ...titleStyle }}>{APP_NAME}</div>

              <div
                title={activeProfile ? `Account: ${activeProfile.name}` : "No account"}
                style={{
                  color: "#8d99b8",
                  fontSize: "11px",
                  marginTop: "2px",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                Account: {activeProfile?.name || "None"}
              </div>
            </div>

            <div
              style={{
                position: "relative",
                display: "flex",
                gap: "8px",
                marginBottom: "10px",
              }}
            >
              <button
                onClick={createNewChat}
                disabled={!activeProfile}
                title="New chat"
                style={{
                  flex: 1,
                  border: "1px solid rgba(170, 195, 255, 0.55)",
                  background: activeProfile
                    ? theme.button
                    : "linear-gradient(135deg, #5b6788, #384057)",
                  color: "white",
                  borderRadius: `${safeCustom.radius}px`,
                  padding: "12px 14px",
                  cursor: activeProfile ? "pointer" : "not-allowed",
                  fontSize: "14px",
                }}
              >
                + New Chat
              </button>

              <button
                onClick={(event) => {
                  event.stopPropagation();
                  setSidebarMenuOpen((old) => !old);
                  setChatMenu(null);
                }}
                title="Sidebar options"
                style={{
                  width: "42px",
                  minWidth: "42px",
                  borderRadius: `${safeCustom.radius}px`,
                  border: `1px solid ${baseTheme.primary}55`,
                  background: sidebarMenuOpen
                    ? "rgba(255,255,255,0.12)"
                    : "rgba(8, 23, 47, 0.72)",
                  color: "#dbe6ff",
                  cursor: "pointer",
                  fontSize: "20px",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                ⋯
              </button>

              {sidebarMenuOpen && (
                <div
                  onClick={(event) => event.stopPropagation()}
                  style={{
                    position: "absolute",
                    top: "52px",
                    right: "0px",
                    zIndex: 60,
                    width: "198px",
                    maxHeight: "280px",
                    overflowY: "auto",
                    background: "rgba(3, 12, 29, 0.98)",
                    border: `1px solid ${baseTheme.primary}55`,
                    borderRadius: "12px",
                    padding: "6px",
                    boxShadow: `0 18px 45px rgba(0,0,0,0.45), 0 0 22px ${baseTheme.primary}22`,
                    animation: safeSettings.reduceMotion ? "none" : "softPop 120ms ease",
                  }}
                >
                  {menuItem("Clear current chat", clearCurrentChat)}
                  {menuItem("Export current chat", () => activeChat && exportChat(activeChat.id))}
                  {menuItem("Clear all chats", clearAllChats, true)}
                </div>
              )}
            </div>

            <input
              value={chatSearch}
              onChange={(event) => setChatSearch(event.target.value)}
              placeholder="Search chats..."
              title="Search chats"
              style={{
                width: "100%",
                background: "rgba(8, 23, 47, 0.56)",
                border: `1px solid ${baseTheme.primary}33`,
                color: "white",
                outline: "none",
                borderRadius: `${safeCustom.radius}px`,
                padding: "10px 12px",
                fontSize: "13px",
                marginBottom: "12px",
              }}
            />

            <div
              style={{
                flex: 1,
                minHeight: 0,
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                overflowY: "auto",
                paddingRight: "2px",
              }}
            >
              {filteredChats.map((chat) => {
                const isMenuOpen = chatMenu?.id === chat.id;

                return (
                  <div
                    key={chat.id}
                    className={`chat-row ${isMenuOpen ? "menu-open" : ""}`}
                    style={{
                      position: "relative",
                      animation: safeSettings.reduceMotion ? "none" : "softPop 160ms ease",
                    }}
                  >
                    <button
                      onClick={() => {
                        setActiveChatId(chat.id);
                        setChatMenu(null);
                      }}
                      title="Open chat"
                      style={{
                        width: "100%",
                        background:
                          activeChat?.id === chat.id
                            ? `linear-gradient(135deg, ${baseTheme.primary}44, ${baseTheme.secondary}22)`
                            : "rgba(8, 23, 47, 0.72)",
                        border:
                          activeChat?.id === chat.id
                            ? `1px solid ${baseTheme.primary}`
                            : "1px solid rgba(95, 128, 190, 0.18)",
                        color: "white",
                        textAlign: "left",
                        padding: "12px 42px 12px 12px",
                        borderRadius: `${safeCustom.radius}px`,
                        cursor: "pointer",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "13px",
                          marginBottom: "4px",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {chat.pinned ? "Pinned · " : ""}
                        {chat.title}
                      </div>

                      <div style={{ color: "#93a2c5", fontSize: "11px" }}>
                        {chat.messages.length} messages • {formatDateTime(chat.updatedAt)}
                      </div>
                    </button>

                    <button
                      className="chat-menu-button"
                      onClick={(event) => openFloatingChatMenu(event, chat.id)}
                      title="Chat options"
                      style={{
                        position: "absolute",
                        right: "8px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        width: "30px",
                        height: "30px",
                        borderRadius: "10px",
                        border: "1px solid rgba(255,255,255,0.12)",
                        background: isMenuOpen
                          ? "rgba(255,255,255,0.12)"
                          : "rgba(4, 12, 28, 0.72)",
                        color: "#dbe6ff",
                        cursor: "pointer",
                        fontSize: "18px",
                        lineHeight: 1,
                        display: "grid",
                        placeItems: "center",
                      }}
                    >
                      ⋯
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>

        {floatingChat && chatMenu && (
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              position: "fixed",
              top: `${chatMenu.top}px`,
              left: `${chatMenu.left}px`,
              zIndex: 999,
              width: "178px",
              maxHeight: "230px",
              overflowY: "auto",
              background: "rgba(3, 12, 29, 0.98)",
              border: `1px solid ${baseTheme.primary}55`,
              borderRadius: "12px",
              padding: "6px",
              boxShadow: `0 18px 45px rgba(0,0,0,0.45), 0 0 22px ${baseTheme.primary}22`,
              animation: safeSettings.reduceMotion ? "none" : "softPop 120ms ease",
            }}
          >
            {menuItem(floatingChat.pinned ? "Unpin chat" : "Pin chat", () =>
              togglePinChat(floatingChat.id)
            )}
            {menuItem("Rename chat", () => startRenameChat(floatingChat))}
            {menuItem("Export chat", () => exportChat(floatingChat.id))}
            {menuItem("Delete chat", () => deleteChat(floatingChat.id), true)}
          </div>
        )}

        <section
          style={{
            flex: 1,
            minWidth: 0,
            height: "100%",
            display: "flex",
            flexDirection: "column",
            background: theme.chatBg,
            overflow: "hidden",
            transition: "background 400ms ease",
          }}
        >
          <header
            style={{
              height: "72px",
              minHeight: "72px",
              padding: "0 22px",
              display: "flex",
              alignItems: "center",
              gap: "16px",
              borderBottom: "1px solid rgba(165, 190, 255, 0.18)",
              background: theme.topBarBg,
            }}
          >
            <button
              onClick={() => setSidebarOpen((old) => !old)}
              title={sidebarOpen ? "Close sidebar" : "Open sidebar"}
              style={{
                width: "38px",
                height: "38px",
                borderRadius: `${safeCustom.radius}px`,
                border: "1px solid rgba(170, 195, 255, 0.28)",
                background: "rgba(8, 23, 47, 0.72)",
                color: "white",
                cursor: "pointer",
                fontSize: "18px",
              }}
            >
              ☰
            </button>

            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: "26px", ...titleStyle }}>{APP_NAME}</div>
              <div style={{ color: "#8d99b8", fontSize: "11px", marginTop: "1px" }}>
                {APP_VERSION}
              </div>
            </div>

            <button
              onClick={() => setAccountOpen(true)}
              title="Switch account"
              style={{
                ...iconButton,
                marginLeft: "auto",
              }}
            >
              👤
            </button>

            <button
              onClick={() => setStudioOpen((old) => !old)}
              title="Studio: settings and themes"
              style={{
                ...iconButton,
                background: studioOpen
                  ? `${baseTheme.primary}33`
                  : "rgba(8, 23, 47, 0.72)",
              }}
            >
              ⚙
            </button>
          </header>

          <div
            style={{
              flex: 1,
              minHeight: 0,
              overflowY: "auto",
              overflowX: "hidden",
              padding: chatPadding,
              display: "flex",
              flexDirection: "column",
              gap: `${safeCustom.messageSpacing}px`,
              fontSize: `${safeCustom.fontSize}px`,
            }}
          >
            {!activeProfile && (
              <div
                style={{
                  color: "#dbe6ff",
                  border: `1px solid ${baseTheme.primary}55`,
                  borderRadius: `${safeCustom.radius}px`,
                  padding: "18px",
                  background: "rgba(0,0,0,0.2)",
                  maxWidth: "600px",
                }}
              >
                Choose or create an account to start. Accounts are saved only on this browser.
              </div>
            )}

            {messages.map((message) => {
              const isEmptyStreaming =
                thinking &&
                message.id === streamingMessageId &&
                message.role === "assistant" &&
                !clean(message.text);

              return (
                <div
                  key={message.id}
                  style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: message.role === "user" ? "flex-end" : "flex-start",
                    animation: safeSettings.reduceMotion ? "none" : "floatIn 180ms ease",
                  }}
                >
                  <div
                    style={{
                      maxWidth:
                        message.role === "user"
                          ? `${safeCustom.bubbleWidth}%`
                          : `${safeCustom.assistantWidth}%`,
                      background: message.role === "user" ? theme.userBubble : "transparent",
                      border:
                        message.role === "user"
                          ? "1px solid rgba(255,255,255,0.2)"
                          : "none",
                      padding: message.role === "user" ? messagePadding : "0px",
                      borderRadius:
                        message.role === "user" ? `${safeCustom.radius}px` : "0px",
                      lineHeight: 1.7,
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                      fontSize: `${safeCustom.fontSize}px`,
                    }}
                  >
                    {safeSettings.showMessageNames && (
                      <div
                        style={{
                          color: baseTheme.primary,
                          fontWeight: 800,
                          marginBottom: "8px",
                        }}
                      >
                        {message.role === "user" ? "You" : APP_NAME}
                      </div>
                    )}

                    <div>
                      {isEmptyStreaming ? (
                        <span style={{ color: "#aeb9d8" }}>
                          Thinking
                          <span style={{ animation: "blinkDots 1s infinite" }}>...</span>
                        </span>
                      ) : (
                        message.text
                      )}
                    </div>

                    {safeSettings.showTimestamps && (
                      <div
                        style={{
                          color: "#aeb9d8",
                          fontSize: "12px",
                          marginTop: "10px",
                        }}
                      >
                        {message.time}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            <div ref={bottomRef}></div>
          </div>

          <footer
            style={{
              padding: safeSettings.compactMode
                ? "12px 24px 12px"
                : "16px 34px 16px",
              borderTop: "1px solid rgba(160, 190, 255, 0.16)",
              background: `linear-gradient(180deg, rgba(3, 11, 26, 0.18), ${baseTheme.panelDark}cc)`,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                background: theme.inputBg,
                border: `1px solid ${baseTheme.primary}66`,
                borderRadius: `${safeCustom.inputRoundness}px`,
                padding: "10px 10px 10px 14px",
                boxShadow:
                  safeSettings.sendButtonGlow && activeProfile
                    ? `0 0 ${Math.round(safeCustom.glow / 2)}px ${baseTheme.primary}22`
                    : "none",
              }}
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleInputKeyDown}
                disabled={!activeProfile}
                placeholder={
                  activeProfile
                    ? `Message ${APP_NAME}...`
                    : "Choose an account first..."
                }
                title="Message box"
                style={{
                  flex: 1,
                  minHeight: "42px",
                  maxHeight: "140px",
                  resize: "none",
                  border: "none",
                  outline: "none",
                  background: "transparent",
                  color: "white",
                  padding: "10px",
                  fontSize: `${safeCustom.fontSize}px`,
                  opacity: activeProfile ? 1 : 0.55,
                }}
              />

              <button
                onClick={thinking ? stopResponse : () => sendText(input)}
                disabled={!thinking && (!clean(input) || !activeProfile)}
                title={thinking ? "Stop response" : "Send message"}
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  border: "1px solid rgba(180, 204, 255, 0.35)",
                  background: thinking
                    ? "linear-gradient(135deg, #ef4444, #991b1b)"
                    : !clean(input) || !activeProfile
                    ? "linear-gradient(135deg, #5b6788, #384057)"
                    : theme.button,
                  color: "white",
                  cursor:
                    thinking || (clean(input) && activeProfile)
                      ? "pointer"
                      : "not-allowed",
                  fontSize: thinking ? "17px" : "20px",
                  boxShadow:
                    safeSettings.sendButtonGlow &&
                    (thinking || (clean(input) && !thinking))
                      ? `0 0 22px ${baseTheme.primary}66`
                      : "none",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                {thinking ? "■" : "↑"}
              </button>
            </div>

            <div
              style={{
                color: "#8d99b8",
                fontSize: "12px",
                textAlign: "center",
                marginTop: "10px",
              }}
            >
              GoofyAI can make mistakes, especially emotionally.
            </div>
          </footer>
        </section>

        <aside
          style={{
            width: studioOpen ? "344px" : "0px",
            minWidth: studioOpen ? "344px" : "0px",
            height: "100%",
            overflow: "hidden",
            background: theme.sidebarBg,
            borderLeft: studioOpen
              ? `1px solid ${baseTheme.primary}55`
              : "1px solid transparent",
            transition: "width 280ms ease, min-width 280ms ease",
          }}
        >
          <div
            style={{
              width: "344px",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              opacity: studioOpen ? 1 : 0,
              transform: studioOpen ? "translateX(0)" : "translateX(20px)",
              transition: safeSettings.reduceMotion
                ? "none"
                : "opacity 220ms ease, transform 280ms ease",
            }}
          >
            <div
              style={{
                padding: "20px 18px",
                borderBottom: `1px solid ${baseTheme.primary}33`,
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <div>
                <div style={{ ...titleStyle, fontSize: "18px" }}>Studio</div>
                <div style={{ color: "#9aa8cc", fontSize: "12px" }}>
                  Settings, themes, and polish.
                </div>
              </div>

              <button
                onClick={() => setStudioOpen(false)}
                title="Close Studio"
                style={{
                  marginLeft: "auto",
                  width: "30px",
                  height: "30px",
                  borderRadius: "10px",
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(255,255,255,0.05)",
                  color: "white",
                  cursor: "pointer",
                }}
              >
                ×
              </button>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "18px" }}>
              <div style={{ color: "#dbe6ff", fontSize: "14px", fontWeight: 900, marginBottom: "10px" }}>
                Chat Settings
              </div>

              {toggle("Streaming chat", "Replies appear while GoofyAI writes.", "streaming")}
              {toggle("Smoother streaming", "Updates in cleaner batches.", "smootherStreaming")}
              {toggle("Save chats", "Keeps conversations in this browser.", "saveChats")}
              {toggle("Auto-scroll", "Scrolls to the newest message.", "autoScroll")}
              {toggle("Enter to send", "Enter sends. Shift+Enter makes a new line.", "enterToSend")}
              {toggle("Show timestamps", "Shows message times.", "showTimestamps")}
              {toggle("Show names", "Shows You and GoofyAI labels.", "showMessageNames")}
              {toggle("Compact mode", "Shrinks spacing.", "compactMode")}
              {toggle("Welcome messages", "New chats get a GoofyAI opener.", "welcomeMessages")}
              {toggle("Confirm delete", "Asks before deleting chats/accounts.", "confirmDelete")}
              {toggle("Reduce motion", "Turns down animation.", "reduceMotion")}
              {toggle("Send button glow", "Makes the send button dramatic.", "sendButtonGlow")}

              <button
                onClick={resetSettings}
                style={{
                  width: "100%",
                  marginTop: "4px",
                  marginBottom: "22px",
                  background: "rgba(255,255,255,0.06)",
                  color: "white",
                  border: `1px solid ${baseTheme.primary}55`,
                  padding: "10px",
                  borderRadius: `${safeCustom.radius}px`,
                  cursor: "pointer",
                  fontSize: "12px",
                }}
              >
                Reset Settings
              </button>

              <div style={{ color: "#dbe6ff", fontSize: "14px", fontWeight: 900, marginBottom: "10px" }}>
                Theme Presets
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "10px",
                  marginBottom: "22px",
                }}
              >
                {THEMES.map((preset, index) => (
                  <button
                    key={preset.id}
                    onClick={() => setThemeIndex(index)}
                    title={`Use ${preset.name}`}
                    style={{
                      minHeight: "58px",
                      borderRadius: `${safeCustom.radius}px`,
                      border:
                        themeIndex === index
                          ? `1px solid ${preset.primary}`
                          : "1px solid rgba(255,255,255,0.12)",
                      background: `linear-gradient(135deg, ${preset.panelDark}, ${preset.primary}55)`,
                      color: "white",
                      cursor: "pointer",
                      fontSize: "12px",
                    }}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>

              <div style={{ color: "#dbe6ff", fontSize: "14px", fontWeight: 900, marginBottom: "10px" }}>
                Theme Controls
              </div>

              {slider("Sidebar Width", "sidebarWidth", 190, 390)}
              {slider("Font Size", "fontSize", 13, 22)}
              {slider("Corner Roundness", "radius", 6, 30)}
              {slider("Input Roundness", "inputRoundness", 8, 34)}
              {slider("Glow Strength", "glow", 0, 100)}
              {slider("Silver Border", "borderStrength", 0, 100)}
              {slider("Background Energy", "backgroundEnergy", 8, 95)}
              {slider("Gradient Angle", "gradientAngle", 0, 360)}
              {slider("Text Bar Tint", "inputTint", 4, 45)}
              {slider("Message Spacing", "messageSpacing", 14, 54)}
              {slider("User Bubble Width", "bubbleWidth", 30, 78)}
              {slider("Assistant Width", "assistantWidth", 45, 92)}
              {slider("Panel Opacity", "panelOpacity", 55, 100)}
              {slider("Top Bar Opacity", "topBarOpacity", 8, 80)}

              <button
                onClick={resetThemeControls}
                style={{
                  width: "100%",
                  marginTop: "8px",
                  background: "rgba(255,255,255,0.06)",
                  color: "white",
                  border: `1px solid ${baseTheme.primary}55`,
                  padding: "12px",
                  borderRadius: `${safeCustom.radius}px`,
                  cursor: "pointer",
                }}
              >
                Reset Theme Controls
              </button>
            </div>
          </div>
        </aside>

        {accountOpen && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 1200,
              display: "grid",
              placeItems: "center",
              padding: "22px",
              background: "rgba(0,0,0,0.62)",
              backdropFilter: "blur(12px)",
            }}
          >
            <div
              style={{
                width: "min(720px, 100%)",
                maxHeight: "88vh",
                overflowY: "auto",
                background: theme.sidebarBg,
                border: `1px solid ${baseTheme.primary}66`,
                borderRadius: `${safeCustom.radius + 8}px`,
                padding: "24px",
                boxShadow: `0 30px 90px rgba(0,0,0,0.55), 0 0 35px ${baseTheme.primary}33`,
              }}
            >
              <div style={{ fontSize: "28px", ...titleStyle, marginBottom: "8px" }}>
                Choose an Account
              </div>

              <div
                style={{
                  color: "#dbe6ff",
                  lineHeight: 1.55,
                  marginBottom: "16px",
                }}
              >
                Accounts are saved only on this browser. There is no email,
                password, or online login.
              </div>

              <div style={{ display: "flex", gap: "10px", marginBottom: "18px" }}>
                <input
                  value={profileNameInput}
                  onChange={(event) => setProfileNameInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") createAccount(profileNameInput);
                  }}
                  placeholder="New account name..."
                  style={{
                    flex: 1,
                    background: "rgba(8, 23, 47, 0.72)",
                    border: `1px solid ${baseTheme.primary}55`,
                    color: "white",
                    outline: "none",
                    borderRadius: `${safeCustom.radius}px`,
                    padding: "12px 14px",
                    fontSize: "15px",
                  }}
                />

                <button
                  onClick={() => createAccount(profileNameInput)}
                  disabled={!clean(profileNameInput)}
                  style={{
                    background: clean(profileNameInput)
                      ? theme.button
                      : "linear-gradient(135deg, #5b6788, #384057)",
                    border: "1px solid rgba(180, 204, 255, 0.35)",
                    color: "white",
                    padding: "0 16px",
                    borderRadius: `${safeCustom.radius}px`,
                    cursor: clean(profileNameInput) ? "pointer" : "not-allowed",
                  }}
                >
                  Create
                </button>
              </div>

              <div style={{ color: "#dbe6ff", fontSize: "13px", marginBottom: "10px", fontWeight: 800 }}>
                Existing Accounts
              </div>

              {profiles.length === 0 && (
                <div style={{ color: "#9aa8cc", fontSize: "14px", marginBottom: "18px" }}>
                  No accounts yet. Create one to start using GoofyAI.
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "18px" }}>
                {profiles.map((profile) => (
                  <div
                    key={profile.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      background:
                        profile.id === activeProfileId
                          ? `${baseTheme.primary}22`
                          : "rgba(255,255,255,0.05)",
                      border:
                        profile.id === activeProfileId
                          ? `1px solid ${baseTheme.primary}88`
                          : "1px solid rgba(255,255,255,0.1)",
                      borderRadius: `${safeCustom.radius}px`,
                      padding: "12px",
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: "white", fontWeight: 800, marginBottom: "3px" }}>
                        {profile.name}
                      </div>
                      <div style={{ color: "#9aa8cc", fontSize: "12px" }}>
                        Saved on this browser
                      </div>
                    </div>

                    <button
                      onClick={() => switchAccount(profile.id)}
                      style={{
                        background: theme.button,
                        color: "white",
                        border: "1px solid rgba(255,255,255,0.2)",
                        borderRadius: `${safeCustom.radius}px`,
                        padding: "9px 12px",
                        cursor: "pointer",
                      }}
                    >
                      Use
                    </button>

                    <button
                      onClick={() => deleteAccount(profile.id)}
                      style={{
                        background: "rgba(255,255,255,0.05)",
                        color: "#dbe6ff",
                        border: "1px solid rgba(255,255,255,0.12)",
                        borderRadius: `${safeCustom.radius}px`,
                        padding: "9px 12px",
                        cursor: "pointer",
                      }}
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>

              {activeProfile && (
                <button
                  onClick={() => setAccountOpen(false)}
                  style={{
                    width: "100%",
                    background: "rgba(255,255,255,0.06)",
                    color: "white",
                    border: `1px solid ${baseTheme.primary}55`,
                    padding: "12px",
                    borderRadius: `${safeCustom.radius}px`,
                    cursor: "pointer",
                  }}
                >
                  Continue as {activeProfile.name}
                </button>
              )}
            </div>
          </div>
        )}

        {renameChatId && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 1300,
              display: "grid",
              placeItems: "center",
              padding: "22px",
              background: "rgba(0,0,0,0.52)",
              backdropFilter: "blur(10px)",
            }}
          >
            <div
              style={{
                width: "min(460px, 100%)",
                background: theme.sidebarBg,
                border: `1px solid ${baseTheme.primary}66`,
                borderRadius: `${safeCustom.radius + 6}px`,
                padding: "20px",
                boxShadow: "0 30px 90px rgba(0,0,0,0.55)",
              }}
            >
              <div style={{ ...titleStyle, fontSize: "22px", marginBottom: "12px" }}>
                Rename Chat
              </div>

              <input
                value={renameValue}
                onChange={(event) => setRenameValue(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") saveRenameChat();
                  if (event.key === "Escape") {
                    setRenameChatId(null);
                    setRenameValue("");
                  }
                }}
                autoFocus
                style={{
                  width: "100%",
                  background: "rgba(8, 23, 47, 0.72)",
                  border: `1px solid ${baseTheme.primary}55`,
                  color: "white",
                  outline: "none",
                  borderRadius: `${safeCustom.radius}px`,
                  padding: "12px 14px",
                  fontSize: "15px",
                  marginBottom: "14px",
                }}
              />

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  onClick={() => {
                    setRenameChatId(null);
                    setRenameValue("");
                  }}
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    color: "#dbe6ff",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: "10px",
                    padding: "8px 12px",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>

                <button
                  onClick={saveRenameChat}
                  style={{
                    background: theme.button,
                    color: "white",
                    border: "1px solid rgba(255,255,255,0.2)",
                    borderRadius: `${safeCustom.radius}px`,
                    padding: "9px 14px",
                    cursor: "pointer",
                  }}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        {toast && (
          <div
            style={{
              position: "fixed",
              left: "50%",
              bottom: "88px",
              transform: "translateX(-50%)",
              zIndex: 1400,
              background: "rgba(3, 12, 29, 0.92)",
              border: `1px solid ${baseTheme.primary}66`,
              color: "#f4f7ff",
              padding: "10px 14px",
              borderRadius: "999px",
              fontSize: "13px",
              boxShadow: `0 18px 50px rgba(0,0,0,0.42), 0 0 24px ${baseTheme.primary}22`,
              animation: safeSettings.reduceMotion ? "none" : "softPop 180ms ease",
            }}
          >
            {toast}
          </div>
        )}
      </main>
    </>
  );
}