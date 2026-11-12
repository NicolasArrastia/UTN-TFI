import { useEffect, useId, useRef } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  title: string;
  description?: string;
  children: ReactNode;
  isBusy?: boolean;
  onClose: () => void;
}

export function Modal({
  title,
  description,
  children,
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
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isBusy) {
          onClose();
        }
      }}
    >
      <div
        ref={dialogRef}
        className="modal modal--form"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
      >
        <div className="modal-form__header">
          <div>
            <h2 className="modal__title" id={titleId}>
              {title}
            </h2>
            {description && (
              <p className="modal__text" id={descriptionId}>
                {description}
              </p>
            )}
          </div>

          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={onClose}
            disabled={isBusy}
            aria-label="Cerrar ventana"
          >
            Cerrar
          </button>
        </div>

        <div className="modal-form__body">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
