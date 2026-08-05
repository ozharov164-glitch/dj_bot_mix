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
