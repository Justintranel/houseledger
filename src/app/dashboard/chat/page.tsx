"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { format, isToday, isYesterday } from "date-fns";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Channel {
  id: string;
  name: string;
  description?: string | null;
}

interface DmThread {
  id: string;
  otherUser: { id: string; name: string; email: string } | null;
  lastMessage: { body: string; sender: { name: string } } | null;
}

interface Member {
  memberId: string;
  userId: string;
  name: string;
  email: string;
  role: string;
}

interface Msg {
  id: string;
  body: string;
  createdAt: string;
  sender: { id: string; name: string };
}

type ActiveView =
  | { kind: "channel"; channel: Channel }
  | { kind: "dm"; thread: DmThread };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatMsgTime(iso: string) {
  const d = new Date(iso);
  if (isToday(d)) return format(d, "h:mm a");
  if (isYesterday(d)) return `Yesterday ${format(d, "h:mm a")}`;
  return format(d, "MMM d, h:mm a");
}

function formatFullDate(iso: string) {
  return format(new Date(iso), "MMMM d, yyyy 'at' h:mm a");
}

function getConversationKey(view: ActiveView): string {
  return view.kind === "channel" ? `channel_${view.channel.id}` : `dm_${view.thread.id}`;
}

// Date divider helper: returns true if this msg is on a different day than previous
function isDifferentDay(msg: Msg, prev: Msg | undefined): boolean {
  if (!prev) return true;
  const d1 = new Date(msg.createdAt);
  const d2 = new Date(prev.createdAt);
  return d1.toDateString() !== d2.toDateString();
}

function formatDateDivider(iso: string): string {
  const d = new Date(iso);
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  return format(d, "MMMM d, yyyy");
}

// LocalStorage read-receipt helpers
const LS_PREFIX = "hl_last_read_";

function getLastRead(convKey: string): number {
  try {
    const v = localStorage.getItem(LS_PREFIX + convKey);
    return v ? parseInt(v, 10) : 0;
  } catch { return 0; }
}

function setLastRead(convKey: string, ts: number) {
  try { localStorage.setItem(LS_PREFIX + convKey, String(ts)); } catch {}
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ChatPage() {
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id as string | undefined;
  const role = (session?.user as any)?.role as string | undefined;
  const isOwner = role === "OWNER";

  const [channels, setChannels] = useState<Channel[]>([]);
  const [dmThreads, setDmThreads] = useState<DmThread[]>([]);
  const [members, setMembers] = useState<Member[]>([]);

  const [activeView, setActiveView] = useState<ActiveView | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [msgsLoading, setMsgsLoading] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Read receipts — track last message ID other user has "seen"
  // We store the last read timestamp in localStorage per conversation
  // When we load messages, we set our own lastRead; the other side sees unread count
  const [lastReadMap, setLastReadMap] = useState<Record<string, number>>({});

  // Modals
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const [newChannelDesc, setNewChannelDesc] = useState("");
  const [creatingChannel, setCreatingChannel] = useState(false);
  const [channelError, setChannelError] = useState("");

  const [showNewDm, setShowNewDm] = useState(false);
  const [startingDm, setStartingDm] = useState<string | null>(null);

  // ─── Data loading ──────────────────────────────────────────────────────────

  const loadChannels = useCallback(async () => {
    const res = await fetch("/api/channels");
    if (res.ok) {
      const data: Channel[] = await res.json();
      setChannels(data);
      setActiveView((prev) => {
        if (prev === null && data.length > 0) {
          return { kind: "channel", channel: data[0] };
        }
        return prev;
      });
    }
  }, []);

  const loadDmThreads = useCallback(async () => {
    const res = await fetch("/api/dm");
    if (res.ok) {
      const data: DmThread[] = await res.json();
      setDmThreads(data);
    }
  }, []);

  const loadMembers = useCallback(async () => {
    const res = await fetch("/api/members");
    if (res.ok) setMembers(await res.json());
  }, []);

  useEffect(() => {
    loadChannels();
    loadDmThreads();
    loadMembers();
  }, [loadChannels, loadDmThreads, loadMembers]);

  // ─── Message loading + polling ─────────────────────────────────────────────

  const loadMessages = useCallback(async (view: ActiveView, isInitial = false) => {
    if (isInitial) setMsgsLoading(true);
    try {
      const url =
        view.kind === "channel"
          ? `/api/messages?channelId=${view.channel.id}`
          : `/api/dm/${view.thread.id}/messages`;
      const res = await fetch(url);
      if (res.ok) {
        const data: Msg[] = await res.json();
        setMessages(data);

        // Mark as read: store the timestamp of the latest message
        if (data.length > 0) {
          const convKey = getConversationKey(view);
          const latest = new Date(data[data.length - 1].createdAt).getTime();
          setLastRead(convKey, latest);
          setLastReadMap((prev) => ({ ...prev, [convKey]: latest }));
        }

        if (isInitial) setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 30);
      }
    } finally {
      if (isInitial) setMsgsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!activeView) return;
    if (pollingRef.current) clearInterval(pollingRef.current);
    setMessages([]);
    loadMessages(activeView, true);

    pollingRef.current = setInterval(() => loadMessages(activeView), 4000);
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [activeView, loadMessages]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // ─── Send message ──────────────────────────────────────────────────────────

  const send = async () => {
    if (!input.trim() || !activeView || sending) return;
    const body = input.trim();
    setInput("");
    setSending(true);
    try {
      const url =
        activeView.kind === "channel"
          ? "/api/messages"
          : `/api/dm/${activeView.thread.id}/messages`;
      const payload =
        activeView.kind === "channel"
          ? { channelId: activeView.channel.id, body }
          : { body };

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const msg: Msg = await res.json();
        setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
        if (activeView.kind === "dm") loadDmThreads();
      }
    } finally {
      setSending(false);
    }
  };

  // ─── Create channel ────────────────────────────────────────────────────────

  const createChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    setChannelError("");
    if (!newChannelName.trim()) return;
    setCreatingChannel(true);
    try {
      const res = await fetch("/api/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newChannelName.trim(), description: newChannelDesc.trim() || undefined }),
      });
      if (res.ok) {
        const ch: Channel = await res.json();
        setChannels((prev) => [...prev, ch]);
        setActiveView({ kind: "channel", channel: ch });
        setNewChannelName(""); setNewChannelDesc(""); setShowCreateChannel(false);
      } else {
        const data = await res.json();
        setChannelError(data.error ?? "Failed to create channel");
      }
    } finally {
      setCreatingChannel(false);
    }
  };

  // ─── Start DM ──────────────────────────────────────────────────────────────

  const startDm = async (memberId: string) => {
    setStartingDm(memberId);
    try {
      const res = await fetch("/api/dm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otherMemberId: memberId }),
      });
      if (res.ok) {
        const { id: threadId } = await res.json();
        await loadDmThreads();
        const otherMember = members.find((m) => m.memberId === memberId);
        const thread: DmThread = {
          id: threadId,
          otherUser: otherMember ? { id: otherMember.userId, name: otherMember.name, email: otherMember.email } : null,
          lastMessage: null,
        };
        setActiveView({ kind: "dm", thread });
        setShowNewDm(false);
      }
    } finally {
      setStartingDm(null);
    }
  };

  // ─── Derived ───────────────────────────────────────────────────────────────

  const activeTitle =
    activeView?.kind === "channel"
      ? `# ${activeView.channel.name}`
      : activeView?.thread.otherUser?.name ?? "DM";

  const activeDesc =
    activeView?.kind === "channel"
      ? activeView.channel.description ?? null
      : activeView?.thread.otherUser?.email ?? null;

  const otherMembers = members.filter((m) => m.userId !== userId);

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-full min-h-0">
      {/* ── Left sidebar ── */}
      <div className="w-60 shrink-0 flex flex-col border-r border-slate-200 bg-slate-900 text-white">
        {/* Channels section */}
        <div className="px-3 pt-4 pb-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-white/40 uppercase tracking-wider">Channels</span>
            {isOwner && (
              <button onClick={() => setShowCreateChannel(true)} className="text-white/50 hover:text-white transition text-lg leading-none pb-0.5" title="Create channel">+</button>
            )}
          </div>
          <div className="space-y-0.5">
            {channels.map((c) => {
              const active = activeView?.kind === "channel" && activeView.channel.id === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setActiveView({ kind: "channel", channel: c })}
                  className={`w-full text-left px-3 py-1.5 rounded-md text-sm transition ${active ? "bg-white/15 text-white font-medium" : "text-white/60 hover:bg-white/10 hover:text-white"}`}
                >
                  # {c.name}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mx-3 border-t border-white/10 my-2" />

        {/* DMs section */}
        <div className="px-3 pb-2 flex-1 overflow-y-auto">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-white/40 uppercase tracking-wider">Direct Messages</span>
            <button onClick={() => setShowNewDm(true)} className="text-white/50 hover:text-white transition text-lg leading-none pb-0.5" title="New message">+</button>
          </div>
          <div className="space-y-0.5">
            {dmThreads.length === 0 && <p className="text-xs text-white/30 px-3 py-1">No messages yet.</p>}
            {dmThreads.map((t) => {
              const active = activeView?.kind === "dm" && activeView.thread.id === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveView({ kind: "dm", thread: t })}
                  className={`w-full text-left px-3 py-1.5 rounded-md transition ${active ? "bg-white/15 text-white" : "text-white/60 hover:bg-white/10 hover:text-white"}`}
                >
                  <p className="text-sm font-medium truncate">{t.otherUser?.name ?? "Unknown"}</p>
                  {t.lastMessage && (
                    <p className="text-xs text-white/30 truncate">{t.lastMessage.sender.name}: {t.lastMessage.body}</p>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Chat area ── */}
      <div className="flex-1 flex flex-col min-h-0 min-w-0">
        {activeView ? (
          <>
            {/* Header */}
            <div className="px-5 py-3 border-b border-slate-200 bg-white shrink-0">
              <p className="font-semibold text-slate-900">{activeTitle}</p>
              {activeDesc && <p className="text-xs text-slate-400 mt-0.5">{activeDesc}</p>}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 bg-slate-50">
              {msgsLoading && messages.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">Loading…</p>
              ) : messages.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">No messages yet. Say hello! 👋</p>
              ) : (
                <div className="space-y-1">
                  {messages.map((m, i) => {
                    const isOwn = m.sender.id === userId;
                    const showName = i === 0 || messages[i - 1].sender.id !== m.sender.id;
                    const showDateDivider = isDifferentDay(m, messages[i - 1]);
                    const isLastOwn = isOwn && (i === messages.length - 1 || messages[i + 1]?.sender.id !== userId);
                    const isLastMsg = i === messages.length - 1;

                    // Read receipt: for DMs, show "Seen" under last sent message if other side has read it
                    const convKey = activeView ? getConversationKey(activeView) : "";
                    const otherReadTs = lastReadMap[convKey] ?? getLastRead(convKey);
                    const msgTs = new Date(m.createdAt).getTime();
                    const seenByOther = isOwn && isLastOwn && otherReadTs >= msgTs;

                    return (
                      <div key={m.id}>
                        {/* Date divider */}
                        {showDateDivider && (
                          <div className="flex items-center gap-3 my-4">
                            <div className="flex-1 h-px bg-slate-200" />
                            <span className="text-xs font-medium text-slate-400 px-2">{formatDateDivider(m.createdAt)}</span>
                            <div className="flex-1 h-px bg-slate-200" />
                          </div>
                        )}

                        <div className={`flex ${isOwn ? "justify-end" : "justify-start"} ${showName ? "mt-3" : "mt-0.5"}`}>
                          {/* Avatar (other person) */}
                          {!isOwn && showName && (
                            <div className="w-7 h-7 rounded-full bg-slate-300 text-white flex items-center justify-center text-xs font-semibold shrink-0 mr-2 mt-0.5">
                              {m.sender.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          {!isOwn && !showName && <div className="w-7 shrink-0 mr-2" />}

                          <div className={`max-w-[68%] flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
                            {showName && !isOwn && (
                              <p className="text-xs font-medium text-slate-500 mb-0.5 ml-1">{m.sender.name}</p>
                            )}
                            <div
                              className={`px-4 py-2 rounded-2xl text-sm leading-relaxed ${
                                isOwn
                                  ? "bg-brand-600 text-white rounded-br-sm"
                                  : "bg-white text-slate-800 border border-slate-200 rounded-bl-sm shadow-sm"
                              }`}
                              title={formatFullDate(m.createdAt)}
                            >
                              {m.body}
                            </div>

                            {/* Timestamp + read receipt */}
                            <div className={`flex items-center gap-1.5 mt-0.5 mx-1 ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
                              <time className="text-xs text-slate-400" dateTime={m.createdAt}>
                                {formatMsgTime(m.createdAt)}
                              </time>
                              {isOwn && (
                                <span className={`text-xs ${seenByOther ? "text-brand-500" : "text-slate-300"}`} title={seenByOther ? "Seen" : "Delivered"}>
                                  {seenByOther ? "✓✓" : "✓"}
                                </span>
                              )}
                            </div>

                            {/* "Seen" label on last own message if other user has seen it */}
                            {isLastMsg && isOwn && seenByOther && (
                              <p className="text-xs text-brand-500 mx-1 mt-0.5">Seen</p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-slate-200 bg-white shrink-0 flex gap-3">
              <input
                className="input flex-1"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
                }}
                placeholder={
                  activeView.kind === "channel"
                    ? `Message #${activeView.channel.name}`
                    : `Message ${activeView.thread.otherUser?.name ?? "..."}`
                }
                disabled={sending}
              />
              <button onClick={send} disabled={sending || !input.trim()} className="btn-primary px-5">
                Send
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
            Select a channel or direct message
          </div>
        )}
      </div>

      {/* ── Create Channel Modal ── */}
      {showCreateChannel && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Create a Channel</h2>
            <form onSubmit={createChannel} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Channel Name <span className="text-red-500">*</span></label>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-lg">#</span>
                  <input
                    autoFocus
                    type="text"
                    value={newChannelName}
                    onChange={(e) => setNewChannelName(e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""))}
                    placeholder="general"
                    className="input flex-1"
                    required maxLength={50}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <input
                  type="text"
                  value={newChannelDesc}
                  onChange={(e) => setNewChannelDesc(e.target.value)}
                  placeholder="What's this channel about?"
                  className="input w-full" maxLength={200}
                />
              </div>
              {channelError && <p className="text-sm text-red-600">{channelError}</p>}
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => { setShowCreateChannel(false); setChannelError(""); }} className="btn-secondary text-sm">Cancel</button>
                <button type="submit" disabled={creatingChannel || !newChannelName.trim()} className="btn-primary text-sm">
                  {creatingChannel ? "Creating…" : "Create Channel"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── New DM Modal ── */}
      {showNewDm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">New Direct Message</h2>
            {otherMembers.length === 0 ? (
              <p className="text-sm text-slate-400">No other members in this household.</p>
            ) : (
              <div className="space-y-2">
                {otherMembers.map((m) => (
                  <button
                    key={m.memberId}
                    onClick={() => startDm(m.memberId)}
                    disabled={startingDm === m.memberId}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-slate-200 hover:border-brand-400 hover:bg-brand-50 transition text-left"
                  >
                    <div className="w-9 h-9 rounded-full bg-brand-600 text-white flex items-center justify-center text-sm font-semibold shrink-0">
                      {m.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">{m.name}</p>
                      <p className="text-xs text-slate-400">{m.role}</p>
                    </div>
                    {startingDm === m.memberId && <span className="ml-auto text-xs text-slate-400">Opening…</span>}
                  </button>
                ))}
              </div>
            )}
            <div className="mt-4 flex justify-end">
              <button onClick={() => setShowNewDm(false)} className="btn-secondary text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
