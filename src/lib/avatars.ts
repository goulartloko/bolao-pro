export interface PresetAvatar {
  id: string;
  label: string;
  emoji: string;
  dataUri: string;
}

function makeSvgAvatar(bgColor1: string, bgColor2: string, emojiOrChar: string, label: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${bgColor1}"/>
        <stop offset="100%" stop-color="${bgColor2}"/>
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="48" fill="url(#grad)" stroke="#ffffff" stroke-width="3"/>
    <text x="50" y="58" font-size="44" text-anchor="middle" dominant-baseline="central">${emojiOrChar}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const PRESET_AVATARS: PresetAvatar[] = [
  {
    id: "artilheiro",
    label: "Artilheiro",
    emoji: "⚽",
    dataUri: makeSvgAvatar("#ff9100", "#ffd700", "⚽", "Artilheiro"),
  },
  {
    id: "camisa10",
    label: "Camisa 10",
    emoji: "🔟",
    dataUri: makeSvgAvatar("#00c853", "#00e676", "🔟", "Camisa 10"),
  },
  {
    id: "paredao",
    label: "Paredão",
    emoji: "🧤",
    dataUri: makeSvgAvatar("#0091ea", "#00b0ff", "🧤", "Paredão"),
  },
  {
    id: "campeao",
    label: "Campeão",
    emoji: "🏆",
    dataUri: makeSvgAvatar("#ffd600", "#ff6d00", "🏆", "Campeão"),
  },
  {
    id: "xerife",
    label: "Xerife",
    emoji: "🛡️",
    dataUri: makeSvgAvatar("#6200ea", "#7c4dff", "🛡️", "Xerife"),
  },
];
