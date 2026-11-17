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
      className="fixed inset-0 z-[80] grid place-items-center bg-ink/55 p-5"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isBusy) {
          onCancel();
        }
      }}
    >
      <div
        className="w-full max-w-[440px] rounded-card bg-white p-[22px] shadow-soft"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
      >
        <h2
          className="text-lg font-bold tracking-[-0.01em]"
          id="confirm-dialog-title"
        >
          {title}
        </h2>
        <p className="mt-2 text-sm leading-[1.55] text-muted" id="confirm-dialog-message">
          {message}
        </p>

        <div className="mt-[22px] flex justify-end gap-2.5">
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-field border border-line px-3.5 py-2 text-[13px] font-semibold text-ink-soft transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-65"
            onClick={onCancel}
            disabled={isBusy}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`inline-flex items-center justify-center gap-2 rounded-field px-3.5 py-2 text-[13px] font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-65 ${
              tone === "danger"
                ? "bg-danger hover:bg-red-700"
                : "bg-brand hover:bg-brand-dark"
            }`}
            onClick={onConfirm}
            disabled={isBusy}
          >
            {isBusy ? (
              <span
                className="size-4 animate-spin rounded-full border-2 border-white/35 border-t-white"
                aria-hidden="true"
              />
            ) : null}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
