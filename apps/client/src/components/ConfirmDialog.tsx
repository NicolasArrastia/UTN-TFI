import { useEffect } from "react";

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "primary" | "danger";
  isBusy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  tone = "primary",
  isBusy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isBusy) {
        onCancel();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isBusy, onCancel]);

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isBusy) {
          onCancel();
        }
      }}
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
      >
        <h2 className="modal__title" id="confirm-dialog-title">
          {title}
        </h2>
        <p className="modal__text" id="confirm-dialog-message">
          {message}
        </p>

        <div className="modal__actions">
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={onCancel}
            disabled={isBusy}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`btn btn--sm ${
              tone === "danger" ? "btn--danger" : "btn--primary"
            }`}
            onClick={onConfirm}
            disabled={isBusy}
          >
            {isBusy ? <span className="spinner" /> : null}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
