import {
  formatBytes,
  formatDuration,
  type AudioFile,
} from "../api/client";
import { Button } from "./Button";

type TrackListProps = {
  files: AudioFile[];
  editable: boolean;
  onMoveUp: (fileId: string) => void;
  onMoveDown: (fileId: string) => void;
  onDelete: (fileId: string) => void;
  busy?: boolean;
};

function statusLabel(status: AudioFile["status"]): string {
  switch (status) {
    case "PENDING":
      return "Ожидает";
    case "UPLOADED":
      return "Загружен";
    case "VALIDATED":
      return "Проверен";
    case "REJECTED":
      return "Отклонён";
    case "EXPIRED":
      return "Истёк";
    case "DELETED":
      return "Удалён";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

export function TrackList({
  files,
  editable,
  onMoveUp,
  onMoveDown,
  onDelete,
  busy = false,
}: TrackListProps) {
  if (files.length === 0) {
    return (
      <p className="muted empty-hint">
        Треков пока нет. Загрузите аудиофайлы, на которые у вас есть права.
      </p>
    );
  }

  return (
    <ul className="track-list">
      {files.map((file, index) => (
        <li key={file.id} className="track-list__item">
          <div className="track-list__main">
            <span className="track-list__position">{index + 1}</span>
            <div className="track-list__info">
              <p className="track-list__name">{file.originalFilename}</p>
              <p className="track-list__meta">
                {formatBytes(file.sizeBytes)} · {formatDuration(file.durationSeconds)} ·{" "}
                {statusLabel(file.status)}
              </p>
            </div>
          </div>
          {editable ? (
            <div className="track-list__actions">
              <Button
                variant="ghost"
                aria-label="Переместить вверх"
                disabled={busy || index === 0}
                onClick={() => onMoveUp(file.id)}
              >
                ↑
              </Button>
              <Button
                variant="ghost"
                aria-label="Переместить вниз"
                disabled={busy || index === files.length - 1}
                onClick={() => onMoveDown(file.id)}
              >
                ↓
              </Button>
              <Button
                variant="danger"
                aria-label="Удалить трек"
                disabled={busy}
                onClick={() => onDelete(file.id)}
              >
                ✕
              </Button>
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
