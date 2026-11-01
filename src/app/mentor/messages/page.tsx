'use client';

import React, { useState, useEffect, useRef } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { MessageSquare, Send, Paperclip, Search, User, Loader2, CheckCheck } from 'lucide-react';

export default function MentorMessagesPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConversation, setActiveConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [showAttachmentInput, setShowAttachmentInput] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadConversations = async () => {
    try {
      const res = await fetch('/api/chat/conversations');
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
        if (data.conversations?.length > 0 && !activeConversation) {
          setActiveConversation(data.conversations[0]);
        }
      }
    } catch (err) {
      console.error(err);
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
      console.error(err);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (activeConversation) {
      loadMessages(activeConversation.id);
      const interval = setInterval(() => loadMessages(activeConversation.id), 5000); // 5s live refresh
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
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  return (
    <DashboardLayout role="MENTOR">
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Direct Mentorship Channels</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time direct communication with assigned fellows. Secure, archived, and role-guarded.
          </p>
        </div>

        {/* Messaging Studio Container */}
        <div className="ivr-card bg-white border border-slate-200 rounded-2xl overflow-hidden grid grid-cols-1 md:grid-cols-3 h-[600px]">
          {/* Left: Fellows Conversation List */}
          <div className="border-r border-slate-200 flex flex-col h-full bg-slate-50/50">
            <div className="p-3.5 border-b border-slate-200 bg-white">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block mb-2">
                Assigned Fellows ({conversations.length})
              </span>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {loading ? (
                <div className="p-6 text-center text-xs text-slate-400">Loading channels...</div>
              ) : conversations.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">No assigned fellows yet.</div>
              ) : (
                conversations.map((convo) => {
                  const isSelected = activeConversation?.id === convo.id;
                  return (
                    <button
                      key={convo.id}
                      onClick={() => setActiveConversation(convo)}
                      className={`w-full p-3.5 text-left flex items-start gap-3 transition-colors ${
                        isSelected ? 'bg-purple-50/80 border-l-4 border-l-[#6D28D9]' : 'hover:bg-slate-100/70'
                      }`}
                    >
                      <div className="w-9 h-9 rounded-full bg-purple-100 text-[#5B21B6] font-bold text-xs flex items-center justify-center shrink-0">
                        {convo.partner.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900 truncate">
                            {convo.partner.name}
                          </span>
                          {convo.unreadCount > 0 && (
                            <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                              {convo.unreadCount}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 block truncate">
                          {convo.partner.batchName}
                        </span>
                        {convo.lastMessage && (
                          <p className="text-[11px] text-slate-500 truncate mt-1">
                            {convo.lastMessage.content}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right: Active Chat Area */}
          <div className="md:col-span-2 flex flex-col h-full bg-white">
            {activeConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-purple-100 text-[#5B21B6] font-bold text-xs flex items-center justify-center">
                      {activeConversation.partner.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 leading-tight">
                        {activeConversation.partner.name}
                      </h3>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {activeConversation.partner.email}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Messages Body */}
                <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#FAF8FF]/40">
                  {messages.length === 0 ? (
                    <div className="py-16 text-center text-xs text-slate-400">
                      No message history yet. Send a greeting to initiate your architectural dialogue!
                    </div>
                  ) : (
                    messages.map((m) => {
                      const isMe = m.sender.role === 'MENTOR';
                      return (
                        <div
                          key={m.id}
                          className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                        >
                          <div
                            className={`max-w-md p-3 rounded-xl text-xs leading-relaxed shadow-2xs ${
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
                                  className="underline text-[11px] font-mono break-all"
                                >
                                  Attachment File Link
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
                            {isMe && <CheckCheck className="w-3 h-3 text-purple-400" />}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Bar */}
                <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-100 bg-white space-y-2">
                  {showAttachmentInput && (
                    <div className="p-2 bg-purple-50 rounded-lg flex items-center gap-2">
                      <input
                        type="url"
                        placeholder="Paste document / attachment URL (e.g. Google Drive, GitHub)..."
                        value={attachmentUrl}
                        onChange={(e) => setAttachmentUrl(e.target.value)}
                        className="w-full text-xs p-1.5 rounded border border-purple-200 bg-white"
                      />
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAttachmentInput(!showAttachmentInput)}
                      className="p-2 text-slate-400 hover:text-[#6D28D9] rounded-lg hover:bg-slate-100 transition-colors"
                      title="Attach URL"
                    >
                      <Paperclip className="w-4 h-4" />
                    </button>

                    <input
                      type="text"
                      placeholder="Type mentorship critique or message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="flex-1 text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                    />

                    <button
                      type="submit"
                      disabled={sending || !newMessage.trim()}
                      className="btn-ivr-primary px-4 py-2.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                    >
                      {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      Send
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-xs text-slate-400">
                Select an assigned fellow from the left panel to begin mentoring.
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
