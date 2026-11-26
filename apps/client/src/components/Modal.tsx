import { useEffect, useId, useRef } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  title: string;
  description?: string;
  children: ReactNode;
  size?: "default" | "wide";
  isBusy?: boolean;
  onClose: () => void;
}

export function Modal({
  title,
  description,
  children,
  size = "default",
  isBusy = false,
  onClose,
}: ModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;

      if (previousFocus instanceof HTMLElement) {
        previousFocus.focus();
      }
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isBusy) {
        onClose();
      }

      if (event.key === "Tab") {
        const elements = dialogRef.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
        );

        if (!elements?.length) {
          event.preventDefault();
          return;
        }

        const first = elements[0];
        const last = elements[elements.length - 1];

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        } else if (document.activeElement === dialogRef.current) {
          event.preventDefault();
          (event.shiftKey ? last : first).focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isBusy, onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-[80] grid place-items-center bg-ink/55 p-3 sm:p-5"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isBusy) {
          onClose();
        }
      }}
    >
      <div
        ref={dialogRef}
        className={`max-h-[calc(100dvh-1.5rem)] w-full overflow-y-auto rounded-card bg-white p-[18px] shadow-soft sm:max-h-[calc(100dvh-2.5rem)] sm:p-[22px] ${size === "wide" ? "max-w-[800px]" : "max-w-[520px]"}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
      >
        <div className="flex items-start justify-between gap-3 border-b border-line pb-5 sm:gap-5">
          <div>
            <h2 className="text-lg font-bold tracking-[-0.01em]" id={titleId}>
              {title}
            </h2>
            {description && (
              <p className="mt-1.5 text-sm leading-[1.55] text-muted" id={descriptionId}>
                {description}
              </p>
            )}
          </div>

          <button
            type="button"
            className="inline-flex items-center justify-center rounded-field border border-line px-3.5 py-2 text-[13px] font-semibold text-ink-soft transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-65"
            onClick={onClose}
            disabled={isBusy}
            aria-label="Cerrar ventana"
          >
            Cerrar
          </button>
        </div>

        <div className="pt-[22px]">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
