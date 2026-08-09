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

function statusTone(status: AudioFile["status"]): string {
  switch (status) {
    case "VALIDATED":
      return "track-row__status--ok";
    case "PENDING":
    case "UPLOADED":
      return "track-row__status--busy";
    case "REJECTED":
    case "EXPIRED":
    case "DELETED":
      return "track-row__status--bad";
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
          className={editable ? "track-row track-row--editable" : "track-row"}
        >
          <span className="track-row__index" aria-hidden="true">
            {index + 1}
          </span>

          <div className="track-row__body">
            <p className="track-row__title" title={file.originalFilename}>
              {file.originalFilename}
            </p>
            <p className="track-row__meta">
              <span>
                {formatBytes(file.sizeBytes)} ·{" "}
                {formatDuration(file.durationSeconds)}
              </span>
              <span className={`track-row__status ${statusTone(file.status)}`}>
                {statusLabel(file.status)}
              </span>
            </p>
          </div>

          {editable ? (
            <div className="track-row__tools">
              <div className="track-row__reorder" role="group" aria-label="Порядок">
                <Button
                  variant="icon"
                  className="track-row__tool"
                  aria-label="Переместить вверх"
                  disabled={busy || index === 0}
                  onClick={() => onMoveUp(file.id)}
                >
                  <IconChevronUp size={14} />
                </Button>
                <Button
                  variant="icon"
                  className="track-row__tool"
                  aria-label="Переместить вниз"
                  disabled={busy || index === files.length - 1}
                  onClick={() => onMoveDown(file.id)}
                >
                  <IconChevronDown size={14} />
                </Button>
              </div>
              <Button
                variant="icon"
                className="track-row__tool track-row__tool--danger"
                aria-label="Удалить трек"
                disabled={busy}
                onClick={() => onDelete(file.id)}
              >
                <IconTrash size={14} />
              </Button>
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
