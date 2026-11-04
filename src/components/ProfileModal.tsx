"use client";
import { useState } from "react";
import {
  X,
  User,
  Phone,
  Shield,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Sparkles,
} from "lucide-react";
import { BRAZILIAN_TEAMS, getTeamByName } from "@/lib/teams";
import TeamBadge from "./TeamBadge";
import { PRESET_AVATARS } from "@/lib/avatars";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: {
    id: string;
    name: string;
    email: string;
    phone: string;
    favoriteTeam?: string | null;
    avatar?: string | null;
    pixKey?: string | null;
    pixKeyType?: string | null;
  };
  onProfileUpdated?: (updated: any) => void;
}

export default function ProfileModal({
  isOpen,
  onClose,
  currentUser,
  onProfileUpdated,
}: ProfileModalProps) {
  const [name, setName] = useState(currentUser.name);
  const [phone, setPhone] = useState(currentUser.phone);
  const [favoriteTeam, setFavoriteTeam] = useState(currentUser.favoriteTeam || "");
  const [avatar, setAvatar] = useState(currentUser.avatar || "");
  const [pixKey, setPixKey] = useState(currentUser.pixKey || "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          favoriteTeam: favoriteTeam || null,
          avatar: avatar || null,
          pixKey: pixKey || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar perfil.");

      setMessage({ text: "Perfil atualizado com sucesso!", type: "success" });
      if (onProfileUpdated) {
        onProfileUpdated(data.user);
      }
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setMessage({ text: err.message, type: "error" });
    } finally {
      setSaving(false);
    }
  }

  const selectedTeamData = getTeamByName(favoriteTeam);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <div className="w-full max-w-lg bg-arena-900 border border-arena-700 rounded-3xl p-6 shadow-2xl relative my-8">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-gray-400 hover:text-white rounded-full bg-arena-800 transition"
        >
          <X className="w-4 h-4" />
        </button>

        <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
          <User className="w-5 h-5 text-pitch-green" />
          <span>Meu Perfil & Time do Coração</span>
        </h3>
        <p className="text-xs text-gray-400 mb-5">
          Personalize seu avatar, escolha seu time brasileiro para exibir no ranking e cadastre sua chave Pix para receber os prêmios.
        </p>

        {message && (
          <div
            className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 mb-4 ${
              message.type === "success"
                ? "bg-pitch-green/10 border border-pitch-green/30 text-pitch-green"
                : "bg-red-500/10 border border-red-500/30 text-red-400"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* ESCOLHA DE TIME DO CORAÇÃO */}
          <div>
            <label className="block text-xs font-bold text-gray-200 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <span>⚽ Seu Time do Coração</span>
              {selectedTeamData && (
                <span className="text-pitch-green text-[11px] font-normal">
                  ({selectedTeamData.name})
                </span>
              )}
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-44 overflow-y-auto p-1.5 bg-arena-850/80 rounded-2xl border border-arena-750">
              {BRAZILIAN_TEAMS.map((team) => {
                const isSelected = favoriteTeam === team.name;
                return (
                  <button
                    key={team.id}
                    type="button"
                    onClick={() => setFavoriteTeam(team.name)}
                    className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition ${
                      isSelected
                        ? "bg-pitch-green/20 border-pitch-green text-white shadow-glow"
                        : "bg-arena-800/80 border-arena-700 text-gray-300 hover:border-gray-500"
                    }`}
                  >
                    <TeamBadge teamNameOrId={team.id} size="sm" />
                    <span className="text-[10px] font-bold truncate max-w-full">
                      {team.shortName}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* AVATAR RÁPIDO OU PERSONALIZADO */}
          <div>
            <label className="block text-xs font-bold text-gray-200 uppercase tracking-wider mb-2">
              Foto de Perfil / Avatar
            </label>
            <div className="flex items-center gap-2.5 mb-2 overflow-x-auto pb-1">
              {PRESET_AVATARS.map((av) => {
                const isSelected = avatar === av.dataUri;
                return (
                  <button
                    key={av.id}
                    type="button"
                    onClick={() => setAvatar(av.dataUri)}
                    title={av.label}
                    className={`w-12 h-12 rounded-2xl overflow-hidden border-2 transition shrink-0 p-0.5 ${
                      isSelected
                        ? "border-pitch-green scale-105 shadow-glow"
                        : "border-arena-700 opacity-75 hover:opacity-100 hover:border-gray-500"
                    }`}
                  >
                    <img src={av.dataUri} alt={av.label} className="w-full h-full object-contain" />
                  </button>
                );
              })}
            </div>
            <input
              type="url"
              placeholder="Ou cole o link de uma imagem da internet (URL)"
              value={avatar.startsWith("data:") ? "" : avatar}
              onChange={(e) => setAvatar(e.target.value)}
              className="w-full px-3.5 py-2 bg-arena-850 border border-arena-700 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-pitch-green"
            />
          </div>

          {/* NOME E WHATSAPP */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Nome de Exibição
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-arena-850 border border-arena-700 rounded-xl text-xs text-white focus:outline-none focus:border-pitch-green"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                WhatsApp com DDD
              </label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-arena-850 border border-arena-700 rounded-xl text-xs text-white focus:outline-none focus:border-pitch-green"
              />
            </div>
          </div>

          {/* CHAVE PIX PARA RECEBIMENTO DE PRÊMIO */}
          <div className="p-3 bg-arena-850 rounded-2xl border border-gold-500/20">
            <label className="block text-xs font-bold text-gold-400 mb-1 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-gold-500" />
              <span>Chave Pix para Recebimento de Prêmio</span>
            </label>
            <input
              type="text"
              placeholder="CPF, Telefone, E-mail ou Chave Aleatória"
              value={pixKey}
              onChange={(e) => setPixKey(e.target.value)}
              className="w-full px-3.5 py-2 bg-arena-900 border border-arena-700 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-gold-500 font-mono"
            />
            <span className="text-[10px] text-gray-400 mt-1 block">
              Se você for o campeão da rodada, a premiação será creditada diretamente nesta chave Pix!
            </span>
          </div>

          {/* BOTÕES */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-arena-800">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 text-xs font-semibold text-gray-400 hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="py-2.5 px-5 bg-pitch-green hover:bg-pitch-light text-arena-950 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-glow transition active:scale-95"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Salvar Meu Perfil</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
