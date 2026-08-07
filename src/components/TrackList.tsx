import {
  formatBytes,
  formatDuration,
  type AudioFile,
} from "../api/client";
import { Button } from "./Button";
import { IconChevronDown, IconChevronUp, IconTrash } from "./icons";

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

function statusChipClass(status: AudioFile["status"]): string {
  switch (status) {
    case "VALIDATED":
      return "status-chip status-chip--ready";
    case "PENDING":
    case "UPLOADED":
      return "status-chip status-chip--uploading";
    case "REJECTED":
    case "EXPIRED":
    case "DELETED":
      return "status-chip status-chip--failed";
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
        Треков пока нет. Добавьте аудиофайлы, на которые у вас есть права.
      </p>
    );
  }

  return (
    <ul className="track-list">
      {files.map((file, index) => (
        <li
          key={file.id}
          className={
            editable ? "track-card track-card--editable" : "track-card"
          }
        >
          <div className="track-card__main">
            <span className="track-card__mark" aria-hidden="true">
              {index + 1}
            </span>
            <div className="track-card__body">
              <p className="track-card__title" title={file.originalFilename}>
                {file.originalFilename}
              </p>
              <div className="track-card__meta-row">
                <span className="track-card__meta">
                  {formatBytes(file.sizeBytes)} ·{" "}
                  {formatDuration(file.durationSeconds)}
                </span>
                <span className={statusChipClass(file.status)}>
                  {statusLabel(file.status)}
                </span>
              </div>
            </div>
          </div>

          {editable ? (
            <div className="track-card__tools">
              <div className="track-card__reorder" role="group" aria-label="Порядок">
                <Button
                  variant="icon"
                  aria-label="Переместить вверх"
                  disabled={busy || index === 0}
                  onClick={() => onMoveUp(file.id)}
                >
                  <IconChevronUp size={16} />
                </Button>
                <Button
                  variant="icon"
                  aria-label="Переместить вниз"
                  disabled={busy || index === files.length - 1}
                  onClick={() => onMoveDown(file.id)}
                >
                  <IconChevronDown size={16} />
                </Button>
              </div>
              <Button
                variant="icon"
                className="btn--icon-danger"
                aria-label="Удалить трек"
                disabled={busy}
                onClick={() => onDelete(file.id)}
              >
                <IconTrash size={15} />
              </Button>
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
