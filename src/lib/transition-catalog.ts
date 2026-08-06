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
    hintRu:
      "На каждом стыке — свой приём. Микс звучит живо, как набор от диджея.",
    recommended: true,
  },
  {
    id: "safe",
    labelRu: "Чистый переход",
    hintRu:
      "Мягкое ровное сведение. Смена трека проходит гладко и почти незаметно.",
  },
  {
    id: "smooth",
    labelRu: "Смена баса",
    hintRu:
      "Сначала смешиваются верх и середина, потом бас переходит одним уверенным движением.",
  },
  {
    id: "energetic",
    labelRu: "Яркий переход",
    hintRu:
      "Частоты сменяются слоями сверху вниз — стык слышен, энергия поднимается.",
  },
  {
    id: "echo_out",
    labelRu: "Эхо-уход",
    hintRu:
      "Первый трек уходит в объёмное эхо, и на этом фоне уверенно входит следующий.",
  },
  {
    id: "dark_fade",
    labelRu: "Тёмный переход",
    hintRu:
      "Свет гаснет сверху вниз — новый трек проявляется из глубины и тепла.",
  },
  {
    id: "punch",
    labelRu: "Резкая смена",
    hintRu:
      "Короткий уверенный стык без долгого наложения. Для быстрой смены настроения.",
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
