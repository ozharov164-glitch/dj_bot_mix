import type {
  Capabilities,
  TransitionStyle,
  TransitionStyleCatalogEntry,
} from "../api/client";

/** Fallback when capabilities omit catalog (offline preview / old API). */
export const TRANSITION_STYLE_FALLBACK: TransitionStyleCatalogEntry[] = [
  {
    id: "variety",
    labelRu: "Рекомендуем · Разные переходы",
    hintRu:
      "На каждом стыке другой приём — микс не звучит одинаково. Живее, чем одна склейка на весь проект.",
    recommended: true,
  },
  {
    id: "safe",
    labelRu: "Клубный бленд",
    hintRu:
      "Треки мягко сливаются: сначала слышны верха нового, бас меняется в конце.",
  },
  {
    id: "smooth",
    labelRu: "Смена баса",
    hintRu:
      "Долго слышны оба трека сверху; низкий гул переключается одним жестом.",
  },
  {
    id: "energetic",
    labelRu: "Фильтр-свип",
    hintRu:
      "Старый трек «сжимается» в тонкий звук, новый раскрывается из него.",
  },
  {
    id: "echo_out",
    labelRu: "Эхо-уход",
    hintRu: "Старый уходит с повторами, новый входит под это эхо.",
  },
  {
    id: "dark_fade",
    labelRu: "Тёмный уход",
    hintRu:
      "Старый становится глуше и темнее, новый проявляется из тишины.",
  },
  {
    id: "punch",
    labelRu: "Жёсткий стык",
    hintRu: "Короткий уверенный переход без долгого наложения.",
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
