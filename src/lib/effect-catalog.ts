import type { SingleEffect } from "../api/client";

/** User-facing names for the actual DSP recipes. */
export const EFFECT_LABELS: Readonly<Record<SingleEffect, string>> = {
  normalise: "Ровная громкость",
  speed_pitch: "Разгон",
  slow_reverb: "Замедление с пространством",
  echo: "Объёмное эхо",
  eq: "Клубная окраска",
  bass_boost: "Усиленный бас",
};

/** Short engaging footnotes — plain Russian, no EN DJ jargon. */
export const EFFECT_HINTS: Readonly<Record<SingleEffect, string>> = {
  normalise:
    "Выравнивает громкость и слегка «дожимает» трек — звучит чище и увереннее.",
  speed_pitch:
    "Ускоряет трек и поднимает тон — больше драйва, будто разогнал пластинку.",
  slow_reverb:
    "Замедляет и добавляет пространство — глубже, атмосфернее, с вечерним вайбом.",
  echo: "Добавляет объёмные отклики вокруг трека — шире и эффектнее.",
  eq: "Клубная кривая: мощный низ, чистая середина, яркий верх.",
  bass_boost:
    "Делает низ плотным и упругим — бас слышен даже в наушниках.",
};
