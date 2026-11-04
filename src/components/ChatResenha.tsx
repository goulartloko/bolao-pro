"use client";
import { useEffect, useState, useRef } from "react";
import {
  MessageSquare,
  Send,
  Sparkles,
  Flame,
  ShieldCheck,
  Loader2,
  RefreshCw,
  Trash2,
} from "lucide-react";
import TeamBadge from "./TeamBadge";
import { getTeamByName } from "@/lib/teams";

interface ChatMessageItem {
  id: string;
  message: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    favoriteTeam?: string | null;
    avatar?: string | null;
    role?: string;
  };
}

interface ChatResenhaProps {
  tournamentId: string;
  currentUser?: {
    id: string;
    name: string;
    role?: string;
    favoriteTeam?: string | null;
  } | null;
}

const QUICK_BANTERS = [
  "Cravei o placar! 🎯",
  "Ninguém me tira do 1º lugar! 🚀",
  "Hoje tem gol! 🔥",
  "Secando os adversários 👀",
  "O prêmio do Pix já é meu! 💰",
  "Bora Mengão! ❤️🖤",
  "Vai Corinthians! ⚪⚫",
  "Palmeiras sem chance! 🟢",
];

export default function ChatResenha({ tournamentId, currentUser }: ChatResenhaProps) {
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const chatScrollRef = useRef<HTMLDivElement>(null);

  function scrollChatToBottom(smooth = true) {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTo({
        top: chatScrollRef.current.scrollHeight,
        behavior: smooth ? "smooth" : "auto",
      });
    }
  }

  async function fetchMessages(showSpinner = false, isInitial = false) {
    if (showSpinner) setLoading(true);
    try {
      const res = await fetch(`/api/chat?tournamentId=${tournamentId}`);
      const data = await res.json();
      if (data.messages) {
        setMessages(data.messages);
        if (isInitial) {
          setTimeout(() => scrollChatToBottom(false), 100);
        }
      }
    } catch (err) {
      console.error("Erro ao carregar mensagens:", err);
    } finally {
      if (showSpinner) setLoading(false);
    }
  }

  useEffect(() => {
    fetchMessages(true, true);
    // Polling a cada 6 segundos para novas mensagens (sem rolar a janela principal)
    const interval = setInterval(() => {
      fetchMessages(false, false);
    }, 6000);
    return () => clearInterval(interval);
  }, [tournamentId]);

  async function handleSendMessage(textToSend?: string) {
    const text = (textToSend || inputMessage).trim();
    if (!text || sending) return;

    if (!currentUser) {
      setErrorMsg("Conecte-se para mandar mensagens na resenha.");
      return;
    }

    setSending(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tournamentId,
          message: text,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao postar mensagem.");

      setInputMessage("");
      if (data.message) {
        setMessages((prev) => [...prev, data.message]);
        setTimeout(() => scrollChatToBottom(true), 100);
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSending(false);
    }
  }

  async function handleDeleteMessage(messageId: string) {
    if (!confirm("Tem certeza que deseja apagar esta mensagem da resenha?")) return;

    try {
      const res = await fetch(`/api/chat?messageId=${messageId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao apagar mensagem.");

      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    } catch (err: any) {
      alert(err.message || "Erro ao apagar mensagem.");
    }
  }

  return (
    <div className="bg-arena-900/90 border border-arena-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[520px]">
      {/* CABEÇALHO DO CHAT */}
      <div className="bg-gradient-to-r from-arena-850 via-arena-900 to-arena-850 px-5 py-4 border-b border-arena-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-pitch-green/10 border border-pitch-green/30 flex items-center justify-center text-pitch-green">
            <Flame className="w-5 h-5 animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-white text-sm sm:text-base tracking-tight">
                Resenha dos Jogadores
              </h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-pitch-green/20 text-pitch-green text-[10px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-pitch-green animate-ping" /> Ao Vivo
              </span>
            </div>
            <p className="text-[11px] text-gray-400">
              Bate-papo oficial dos palpiteiros desta rodada
            </p>
          </div>
        </div>

        <button
          onClick={() => fetchMessages(false)}
          className="p-2 text-gray-400 hover:text-white rounded-xl bg-arena-800/60 hover:bg-arena-800 transition"
          title="Atualizar mensagens"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* FEED DE MENSAGENS (CONTAINER COM SCROLL INDEPENDENTE) */}
      <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 text-xs">
            <Loader2 className="w-6 h-6 text-pitch-green animate-spin mb-2" />
            <span>Carregando a resenha...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400">
            <MessageSquare className="w-10 h-10 text-arena-700 mb-2" />
            <p className="text-sm font-bold text-gray-300">Nenhuma mensagem ainda!</p>
            <p className="text-xs text-gray-500 mt-1 max-w-xs">
              Seja o primeiro a mandar um recado ou provocar seus adversários no ranking!
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = currentUser?.id === msg.user.id;
            const team = getTeamByName(msg.user.favoriteTeam);
            const canDelete = isMe || currentUser?.role === "ADMIN";

            return (
              <div
                key={msg.id}
                className={`flex items-start gap-2.5 ${isMe ? "flex-row-reverse" : "flex-row"}`}
              >
                {/* Avatar / Escudo do Time */}
                <div className="w-8 h-8 rounded-full bg-arena-800 border border-arena-700 flex items-center justify-center shrink-0 overflow-hidden text-xs font-bold text-gray-300 shadow-sm">
                  {msg.user.avatar ? (
                    <img
                      src={msg.user.avatar}
                      alt={msg.user.name}
                      className="w-full h-full object-cover"
                    />
                  ) : msg.user.favoriteTeam ? (
                    <TeamBadge teamNameOrId={msg.user.favoriteTeam} size="xs" />
                  ) : (
                    <span>{msg.user.name.charAt(0).toUpperCase()}</span>
                  )}
                </div>

                {/* Balão de mensagem */}
                <div
                  className={`max-w-[78%] rounded-2xl px-3.5 py-2 text-xs shadow-md ${
                    isMe
                      ? "bg-pitch-green text-arena-950 font-medium rounded-tr-none"
                      : "bg-arena-800/90 text-gray-100 border border-arena-750 rounded-tl-none"
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span
                      className={`font-black text-[11px] truncate max-w-[120px] ${
                        isMe ? "text-arena-950" : "text-gold-400"
                      }`}
                    >
                      {msg.user.name}
                    </span>

                    {msg.user.role === "ADMIN" && (
                      <span className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded bg-gold-500/20 text-gold-400 text-[9px] font-bold border border-gold-500/30">
                        <ShieldCheck className="w-2.5 h-2.5" /> Admin
                      </span>
                    )}

                    {team && (
                      <span
                        className={`text-[9px] px-1 rounded font-bold ${
                          isMe ? "bg-black/20 text-arena-950" : "bg-arena-700 text-gray-300"
                        }`}
                      >
                        {team.shortName}
                      </span>
                    )}

                    <span
                      className={`text-[9px] ml-auto ${
                        isMe ? "text-arena-950/70" : "text-gray-400"
                      }`}
                    >
                      {new Date(msg.createdAt).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>

                    {canDelete && (
                      <button
                        onClick={() => handleDeleteMessage(msg.id)}
                        title="Apagar mensagem"
                        className={`p-0.5 rounded transition ml-1 ${
                          isMe
                            ? "text-arena-950/60 hover:text-red-800"
                            : "text-gray-400 hover:text-red-400"
                        }`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  <p className="leading-snug break-words text-xs">{msg.message}</p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* QUICK REACTIONS / RESENHA RÁPIDA */}
      <div className="px-3 py-2 bg-arena-850/60 border-t border-arena-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {QUICK_BANTERS.map((banter, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(banter)}
            disabled={sending}
            className="whitespace-nowrap px-2.5 py-1 rounded-full bg-arena-800 hover:bg-arena-700 border border-arena-700 text-[11px] text-gray-300 hover:text-white transition active:scale-95"
          >
            {banter}
          </button>
        ))}
      </div>

      {/* CAMPO DE ENVIO */}
      <div className="p-3 bg-arena-850 border-t border-arena-800">
        {errorMsg && (
          <div className="text-[11px] text-red-400 mb-2 px-1 font-medium">{errorMsg}</div>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            placeholder={
              currentUser
                ? "Envie uma mensagem na resenha..."
                : "Faça login para mandar um recado na resenha"
            }
            value={inputMessage}
            disabled={!currentUser || sending}
            onChange={(e) => setInputMessage(e.target.value)}
            maxLength={250}
            className="flex-1 px-4 py-2.5 bg-arena-900 border border-arena-700 rounded-2xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-pitch-green disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!currentUser || !inputMessage.trim() || sending}
            className="p-2.5 rounded-2xl bg-pitch-green hover:bg-pitch-light text-arena-950 font-bold transition disabled:opacity-40 active:scale-95 flex items-center justify-center shrink-0 shadow-glow"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </form>
      </div>
    </div>
  );
}
