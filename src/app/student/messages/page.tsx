'use client';

import React, { useState, useEffect, useRef } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  MessageSquare,
  Send,
  Paperclip,
  CheckCheck,
  Loader2,
  UserCheck,
  ShieldCheck,
  Clock,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

interface Partner {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  designation?: string;
}

interface MessageItem {
  id: string;
  senderId: string;
  content: string;
  attachmentUrl?: string | null;
  isRead: boolean;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    role: string;
    avatar?: string;
  };
}

interface Conversation {
  id: string;
  partner: Partner;
  lastMessage?: MessageItem | null;
  unreadCount: number;
  updatedAt: string;
}

export default function StudentMessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [showAttachmentInput, setShowAttachmentInput] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadConversations = async () => {
    try {
      const res = await fetch('/api/chat/conversations');
      if (res.ok) {
        const data = await res.json();
        const convos: Conversation[] = data.conversations || [];
        setConversations(convos);
        if (convos.length > 0 && !activeConversation) {
          setActiveConversation(convos[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const res = await fetch(`/api/chat/messages?conversationId=${conversationId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (activeConversation) {
      loadMessages(activeConversation.id);
      const interval = setInterval(() => loadMessages(activeConversation.id), 4000);
      return () => clearInterval(interval);
    }
  }, [activeConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversation || sending) return;

    setSending(true);
    try {
      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: activeConversation.id,
          content: newMessage.trim(),
          attachmentUrl: attachmentUrl || undefined,
        }),
      });

      if (res.ok) {
        setNewMessage('');
        setAttachmentUrl('');
        setShowAttachmentInput(false);
        loadMessages(activeConversation.id);
      }
    } catch (err) {
      console.error('Send message error:', err);
    } finally {
      setSending(false);
    }
  };

  return (
    <DashboardLayout role="STUDENT">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Faculty Mentorship Channel
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Direct, encrypted channel with your assigned senior industry mentor.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-purple-50 text-[#5B21B6] border border-purple-200">
              <ShieldCheck className="w-3.5 h-3.5 text-[#7C3AED]" />
              Enterprise End-to-End Logged
            </span>
          </div>
        </div>

        {/* Messaging Studio Container */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden grid grid-cols-1 md:grid-cols-3 h-[620px] shadow-xs">
          {/* Left: Mentor Contact Details */}
          <div className="border-r border-slate-200 flex flex-col h-full bg-slate-50/50">
            <div className="p-4 border-b border-slate-200 bg-white">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                Assigned Mentor Profile
              </span>
            </div>

            <div className="p-5 flex-1 overflow-y-auto space-y-4">
              {loading ? (
                <div className="p-6 text-center text-xs text-slate-400">Loading mentor channel...</div>
              ) : activeConversation ? (
                <div className="space-y-4">
                  {/* Mentor Card */}
                  <div className="bg-white p-4 rounded-xl border border-purple-100 shadow-2xs space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#4C1D95] to-[#7C3AED] text-white font-black text-base flex items-center justify-center shadow-xs">
                        {activeConversation.partner.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 leading-tight">
                          {activeConversation.partner.name}
                        </h3>
                        <p className="text-xs text-[#6D28D9] font-medium mt-0.5">
                          {activeConversation.partner.designation || 'Academic & Research Mentor'}
                        </p>
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                          {activeConversation.partner.email}
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-center">
                      <div className="bg-slate-50 p-2 rounded-lg">
                        <span className="text-[10px] text-slate-400 block font-semibold uppercase">Channel</span>
                        <span className="text-xs font-bold text-emerald-600">Active</span>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-lg">
                        <span className="text-[10px] text-slate-400 block font-semibold uppercase">Response</span>
                        <span className="text-xs font-bold text-slate-700">&lt; 12 Hours</span>
                      </div>
                    </div>
                  </div>

                  {/* Mentorship Guidelines */}
                  <div className="bg-purple-50/60 p-4 rounded-xl border border-purple-100 text-xs space-y-2">
                    <div className="font-bold text-[#5B21B6] flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Recommended Discussion Topics:</span>
                    </div>
                    <ul className="text-slate-600 text-[11px] space-y-1.5 list-disc list-inside">
                      <li>Architectural design reviews & PR feedback</li>
                      <li>Cloud infrastructure & deployment hurdles</li>
                      <li>Mid-term milestone blocker resolution</li>
                      <li>Career roadmap & research guidance</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-slate-400">
                  No mentor assigned to your batch yet. Please contact IVR Admin.
                </div>
              )}
            </div>
          </div>

          {/* Right: Active Chat Area */}
          <div className="md:col-span-2 flex flex-col h-full bg-white">
            {activeConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-purple-100 text-[#5B21B6] font-bold text-xs flex items-center justify-center">
                      {activeConversation.partner.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 leading-tight">
                        {activeConversation.partner.name}
                      </h3>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {activeConversation.partner.designation || 'Academic Mentor'}
                      </span>
                    </div>
                  </div>

                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Online
                  </span>
                </div>

                {/* Messages Body */}
                <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#FAF8FF]/40">
                  {messages.length === 0 ? (
                    <div className="py-20 text-center text-xs text-slate-400">
                      <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <p className="font-semibold text-slate-700">No conversation history yet</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Send a message to your mentor regarding your milestone tasks or technical questions.
                      </p>
                    </div>
                  ) : (
                    messages.map((m) => {
                      const isMe = m.sender.role === 'STUDENT';
                      return (
                        <div
                          key={m.id}
                          className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                        >
                          <div
                            className={`max-w-md p-3.5 rounded-2xl text-xs leading-relaxed shadow-2xs ${
                              isMe
                                ? 'bg-[#5B21B6] text-white rounded-br-xs'
                                : 'bg-white text-slate-800 border border-slate-200 rounded-bl-xs'
                            }`}
                          >
                            <p>{m.content}</p>
                            {m.attachmentUrl && (
                              <div className="mt-2 pt-2 border-t border-white/20">
                                <a
                                  href={m.attachmentUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className={`inline-flex items-center gap-1.5 text-[11px] font-semibold underline break-all ${
                                    isMe ? 'text-purple-200' : 'text-[#6D28D9]'
                                  }`}
                                >
                                  <Paperclip className="w-3 h-3" />
                                  <span>Attached Document / Repository Link</span>
                                  <ExternalLink className="w-3 h-3 opacity-70" />
                                </a>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-400 font-mono">
                            <span>
                              {new Date(m.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            {isMe && <CheckCheck className="w-3 h-3 text-purple-500" />}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Bar */}
                <form
                  onSubmit={handleSendMessage}
                  className="p-3 border-t border-slate-100 bg-white space-y-2"
                >
                  {showAttachmentInput && (
                    <div className="p-2 bg-purple-50 rounded-xl flex items-center gap-2 border border-purple-100">
                      <Paperclip className="w-4 h-4 text-[#6D28D9] shrink-0" />
                      <input
                        type="url"
                        placeholder="Paste document / repository / preview URL..."
                        value={attachmentUrl}
                        onChange={(e) => setAttachmentUrl(e.target.value)}
                        className="w-full text-xs p-1.5 rounded-lg border border-purple-200 bg-white focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
                      />
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAttachmentInput(!showAttachmentInput)}
                      className={`p-2.5 rounded-xl border transition-colors ${
                        showAttachmentInput
                          ? 'bg-purple-100 text-[#5B21B6] border-purple-300'
                          : 'text-slate-400 border-slate-200 hover:text-[#6D28D9] hover:bg-slate-50'
                      }`}
                      title="Attach URL"
                    >
                      <Paperclip className="w-4 h-4" />
                    </button>

                    <input
                      type="text"
                      placeholder="Type your question or project query for your mentor..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="flex-1 text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:bg-white bg-slate-50/50 transition-all"
                    />

                    <button
                      type="submit"
                      disabled={sending || !newMessage.trim()}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#4C1D95] to-[#6D28D9] hover:from-[#3B0764] hover:to-[#5B21B6] disabled:opacity-50 flex items-center gap-1.5 shadow-xs transition-all"
                    >
                      {sending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      <span>Send</span>
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-xs text-slate-400">
                Mentor channel not established. Contact IVR Platform Admin.
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
