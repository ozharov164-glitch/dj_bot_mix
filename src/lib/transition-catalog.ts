import type {
  Capabilities,
  TransitionStyle,
  TransitionStyleCatalogEntry,
} from "../api/client";

/** Fallback when capabilities omit catalog (offline preview / old API). */
export const TRANSITION_STYLE_FALLBACK: TransitionStyleCatalogEntry[] = [
  {
    id: "variety",
    labelRu: "Рекомендуем · Живой микс",
    hintRu: "На каждом стыке чередуется другой аккуратный приём.",
    recommended: true,
  },
  {
    id: "safe",
    labelRu: "Чистый переход",
    hintRu: "Короткое ровное сведение без лишней обработки.",
  },
  {
    id: "smooth",
    labelRu: "Смена баса",
    hintRu: "Низ одного трека аккуратно уступает место следующему.",
  },
  {
    id: "energetic",
    labelRu: "Частотный переход",
    hintRu: "Частотные слои сменяются по очереди и подчёркивают стык.",
  },
  {
    id: "echo_out",
    labelRu: "Эхо-уход",
    hintRu: "Первый трек уходит коротким эхом, освобождая место следующему.",
  },
  {
    id: "dark_fade",
    labelRu: "Тёмный переход",
    hintRu: "Верхние частоты гаснут первыми, и новый трек проявляется снизу.",
  },
  {
    id: "punch",
    labelRu: "Резкая смена",
    hintRu: "Короткий уверенный стык без долгого наложения.",
  },
];

export function resolveTransitionCatalog(
  capabilities: Capabilities | null | undefined,
): TransitionStyleCatalogEntry[] {
  if (capabilities?.transitionStyleCatalog?.length) {
    return capabilities.transitionStyleCatalog;
  }
  const ids = capabilities?.transitionStyles;
  if (ids?.length) {
    const byId = new Map(TRANSITION_STYLE_FALLBACK.map((e) => [e.id, e]));
    return ids.map(
      (id) =>
        byId.get(id) ?? {
          id,
          labelRu: id,
          hintRu: "Стиль склейки треков.",
        },
    );
  }
  return TRANSITION_STYLE_FALLBACK;
}

export function transitionEntry(
  catalog: TransitionStyleCatalogEntry[],
  id: TransitionStyle,
): TransitionStyleCatalogEntry {
  return (
    catalog.find((e) => e.id === id) ?? {
      id,
      labelRu: id,
      hintRu: "Стиль склейки треков.",
    }
  );
}
