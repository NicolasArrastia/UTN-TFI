import { useState } from "react";
import type { FormEvent } from "react";
import { ConfirmDialog } from "../ConfirmDialog.tsx";
import { StateCard } from "../StateCard.tsx";
import { IconEdit, IconPlus, IconRefresh, IconTrash } from "../icons.tsx";
import { useTags } from "../../hooks/useTags.ts";
import { getTagErrorMessage, notify } from "../../services/notifications.ts";
import { tagService } from "../../services/tag.service.ts";
import type { Tag } from "../../types/catalog.types.ts";

const MAX_NAME_LENGTH = 50;
const DEFAULT_COLOR = "#4F46E5";
const HEX_COLOR_PATTERN = /^#[0-9a-f]{6}$/i;

interface TagFormState {
  name: string;
  color: string;
}

type TagFormErrors = Partial<Record<keyof TagFormState, string>>;

const validateForm = (form: TagFormState): TagFormErrors => {
  const errors: TagFormErrors = {};
  const name = form.name.trim();

  if (!name) {
    errors.name = "El nombre es obligatorio.";
  } else if (name.length > MAX_NAME_LENGTH) {
    errors.name = `El nombre no puede superar ${MAX_NAME_LENGTH} caracteres.`;
  }

  if (!HEX_COLOR_PATTERN.test(form.color)) {
    errors.color = "Elegí un color válido.";
  }

  return errors;
};

const CARD =
  "overflow-hidden rounded-card border border-line bg-white shadow-card";
const CARD_HEADER =
  "flex flex-wrap items-start justify-between gap-4 px-[22px] pt-5 pb-1";
const CARD_TITLE = "text-[15px] font-bold tracking-[-0.01em]";
const CARD_SUBTITLE = "mt-[3px] text-[12.5px] text-muted";
const CARD_BODY = "px-[22px] py-5";

const BADGE =
  "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11.5px] font-semibold";
const BADGE_SUCCESS = `${BADGE} bg-success-soft text-green-700`;
const BADGE_NEUTRAL = `${BADGE} bg-slate-100 text-slate-600`;

const PRIMARY_BUTTON =
  "inline-flex items-center justify-center gap-2 rounded-field bg-brand px-3.5 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-65";

const GHOST_BUTTON =
  "inline-flex items-center justify-center gap-2 rounded-field border border-line px-3.5 py-2 text-[13px] font-semibold text-ink-soft transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-65";

const ICON_BUTTON =
  "inline-flex size-[38px] items-center justify-center rounded-field border border-line bg-white text-ink-soft transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-ink";

const ICON_BUTTON_SM =
  "inline-flex size-8 items-center justify-center rounded-lg border border-line bg-white text-ink-soft transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-ink";

const ICON_BUTTON_DANGER =
  "hover:border-red-200 hover:bg-danger-soft hover:text-red-700";

const FORM_GRID = "grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4";
const FIELD = "flex flex-col gap-[7px]";
const LABEL = "text-[13px] font-semibold text-ink-soft";
const INPUT =
  "w-full rounded-field border border-line bg-white px-[13px] py-[11px] text-sm text-ink focus:border-brand focus:outline-none focus:ring-[3px] focus:ring-brand/13 disabled:bg-slate-50 disabled:text-muted aria-[invalid=true]:border-red-300 aria-[invalid=true]:bg-[#fff7f7]";

const COLOR_FIELD = "flex min-h-11 items-center gap-3";
const COLOR_INPUT =
  "h-10 w-[52px] cursor-pointer rounded-field border border-line bg-white p-[3px] focus:border-brand focus:outline-none focus:ring-[3px] focus:ring-brand/13";
const COLOR_VALUE =
  "text-[13px] font-semibold tracking-[0.04em] text-ink-soft tabular-nums";

const FORM_ACTIONS = "mt-[22px] flex flex-wrap items-center gap-3.5";
const FORM_HINT = "text-[12px] text-muted";

const TH =
  "whitespace-nowrap border-b border-line px-[22px] py-2.5 text-left text-[11px] font-bold uppercase tracking-[0.07em] text-muted max-md:px-4";
const TD =
  "whitespace-nowrap border-b border-slate-100 px-[22px] py-[13px] align-middle max-md:px-4";

const SPINNER = "size-4 animate-spin rounded-full border-2 border-white/35 border-t-white";

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) {
    return null;
  }

  return (
    <p className="text-[12px] font-medium text-danger" id={id}>
      {message}
    </p>
  );
}

export function TagManager() {
  const [includeInactive, setIncludeInactive] = useState(false);
  const { tags, isLoading, error, reload } = useTags(includeInactive);

  const [form, setForm] = useState<TagFormState | null>(null);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [errors, setErrors] = useState<TagFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tagToDeactivate, setTagToDeactivate] = useState<Tag | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [reactivatingId, setReactivatingId] = useState<number | null>(null);

  const openCreate = () => {
    setEditingTag(null);
    setErrors({});
    setForm({ name: "", color: DEFAULT_COLOR });
  };

  const openEdit = (tag: Tag) => {
    setEditingTag(tag);
    setErrors({});
    setForm({ name: tag.name, color: tag.color });
  };

  const closeForm = () => {
    if (isSubmitting) {
      return;
    }

    setForm(null);
    setEditingTag(null);
    setErrors({});
  };

  const updateField = (field: keyof TagFormState, value: string) => {
    setForm((current) =>
      current ? { ...current, [field]: value } : current,
    );
    setErrors((current) => {
      if (!current[field]) {
        return current;
      }

      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form) {
      return;
    }

    const validation = validateForm(form);
    setErrors(validation);

    if (Object.keys(validation).length > 0) {
      return;
    }

    const payload = {
      name: form.name.trim(),
      color: form.color.toUpperCase(),
    };

    setIsSubmitting(true);

    try {
      if (editingTag) {
        await tagService.update(editingTag.id, payload);
        notify.success(`Etiqueta "${payload.name}" actualizada.`);
      } else {
        await tagService.create(payload);
        notify.success(`Etiqueta "${payload.name}" creada.`);
      }

      setForm(null);
      setEditingTag(null);
      setErrors({});
      reload();
    } catch (submitError) {
      notify.error(getTagErrorMessage(submitError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDeactivate = async () => {
    if (!tagToDeactivate) {
      return;
    }

    setIsDeleting(true);

    try {
      await tagService.remove(tagToDeactivate.id);
      notify.success(`Se dio de baja "${tagToDeactivate.name}".`);

      if (editingTag?.id === tagToDeactivate.id) {
        setForm(null);
        setEditingTag(null);
      }

      setTagToDeactivate(null);
      reload();
    } catch (deleteError) {
      notify.error(getTagErrorMessage(deleteError));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleReactivate = async (tag: Tag) => {
    setReactivatingId(tag.id);

    try {
      await tagService.update(tag.id, { isActive: true });
      notify.success(`Se reactivó "${tag.name}".`);
      reload();
    } catch (reactivateError) {
      notify.error(getTagErrorMessage(reactivateError));
    } finally {
      setReactivatingId(null);
    }
  };

  return (
    <section className={CARD}>
      <div className={CARD_HEADER}>
        <div>
          <h2 className={CARD_TITLE}>Etiquetas</h2>
          <p className={CARD_SUBTITLE}>
            Administrá las etiquetas del catálogo. Solo los administradores
            pueden crearlas, modificarlas o darlas de baja.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <label className="inline-flex cursor-pointer select-none items-center gap-2 text-[13px] font-medium text-ink-soft">
            <input
              className="size-4 cursor-pointer accent-brand"
              type="checkbox"
              checked={includeInactive}
              onChange={(event) => setIncludeInactive(event.target.checked)}
            />
            Mostrar inactivas
          </label>

          <button
            type="button"
            className={PRIMARY_BUTTON}
            onClick={openCreate}
          >
            <IconPlus width={16} height={16} />
            Nueva etiqueta
          </button>

          <button
            type="button"
            className={ICON_BUTTON}
            onClick={reload}
            aria-label="Actualizar listado"
            title="Actualizar listado"
          >
            <IconRefresh width={18} height={18} />
          </button>
        </div>
      </div>

      {form ? (
        <form className={CARD_BODY} onSubmit={handleSubmit} noValidate>
          <div className={FORM_GRID}>
            <div className={FIELD}>
              <label className={LABEL} htmlFor="tag-name">
                Nombre *
              </label>
              <input
                className={INPUT}
                id="tag-name"
                type="text"
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
                placeholder="Ej.: Oferta"
                maxLength={MAX_NAME_LENGTH}
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? "tag-name-error" : undefined}
              />
              <FieldError id="tag-name-error" message={errors.name} />
            </div>

            <div className={FIELD}>
              <label className={LABEL} htmlFor="tag-color">
                Color *
              </label>
              <div className={COLOR_FIELD}>
                <input
                  className={COLOR_INPUT}
                  id="tag-color"
                  type="color"
                  value={form.color}
                  onChange={(event) => updateField("color", event.target.value)}
                  aria-invalid={Boolean(errors.color)}
                  aria-describedby={
                    errors.color ? "tag-color-error" : undefined
                  }
                />
                <span className={COLOR_VALUE}>{form.color.toUpperCase()}</span>
              </div>
              <FieldError id="tag-color-error" message={errors.color} />
            </div>
          </div>

          <div className={FORM_ACTIONS}>
            <button
              type="submit"
              className={PRIMARY_BUTTON}
              disabled={isSubmitting}
            >
              {isSubmitting ? <span className={SPINNER} /> : null}
              {editingTag ? "Guardar cambios" : "Crear etiqueta"}
            </button>
            <button
              type="button"
              className={GHOST_BUTTON}
              onClick={closeForm}
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            {editingTag ? (
              <span className={FORM_HINT}>Editando “{editingTag.name}”.</span>
            ) : null}
          </div>
        </form>
      ) : null}

      {error ? (
        <StateCard
          title="No pudimos cargar las etiquetas"
          message={error}
          tone="error"
          action={
            <button type="button" className={GHOST_BUTTON} onClick={reload}>
              Reintentar
            </button>
          }
        />
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full border-collapse text-[13.5px]">
            <thead>
              <tr>
                <th className={TH}>Etiqueta</th>
                <th className={TH}>Color</th>
                <th className={TH}>Estado</th>
                <th className={TH}>Acciones</th>
              </tr>
            </thead>
            <tbody className="[&>tr:last-child>td]:border-b-0 [&>tr:hover]:bg-slate-50">
              {isLoading ? (
                <tr>
                  <td className={TD} colSpan={4}>
                    <div className="flex items-center justify-center gap-3 py-[26px] text-[13.5px] text-muted">
                      <span
                        className="size-8 animate-spin rounded-full border-[3px] border-line border-t-brand"
                        aria-hidden="true"
                      />
                      <span>Cargando etiquetas...</span>
                    </div>
                  </td>
                </tr>
              ) : null}

              {!isLoading && tags.length === 0 ? (
                <tr>
                  <td className={TD} colSpan={4}>
                    <div className="flex items-center justify-center gap-3 py-[26px] text-[13.5px] text-muted">
                      {includeInactive
                        ? "Todavía no hay etiquetas cargadas."
                        : "No hay etiquetas activas. Creá una nueva o activá la opción de mostrar inactivas."}
                    </div>
                  </td>
                </tr>
              ) : null}

              {!isLoading
                ? tags.map((tag) => (
                    <tr key={tag.id}>
                      <td className={`${TD} font-semibold text-ink`}>
                        {tag.name}
                      </td>
                      <td className={TD}>
                        <span className="inline-flex items-center gap-2 text-[12.5px] font-semibold text-ink-soft tabular-nums">
                          <span
                            className="inline-block size-3.5 rounded-full border border-ink/12"
                            style={{ backgroundColor: tag.color }}
                          />
                          {tag.color}
                        </span>
                      </td>
                      <td className={TD}>
                        <span
                          className={
                            tag.isActive ? BADGE_SUCCESS : BADGE_NEUTRAL
                          }
                        >
                          {tag.isActive ? "Activa" : "Inactiva"}
                        </span>
                      </td>
                      <td className={TD}>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            className={ICON_BUTTON_SM}
                            title="Editar etiqueta"
                            aria-label={`Editar ${tag.name}`}
                            onClick={() => openEdit(tag)}
                          >
                            <IconEdit width={16} height={16} />
                          </button>

                          {tag.isActive ? (
                            <button
                              type="button"
                              className={`${ICON_BUTTON_SM} ${ICON_BUTTON_DANGER}`}
                              title="Dar de baja"
                              aria-label={`Dar de baja ${tag.name}`}
                              onClick={() => setTagToDeactivate(tag)}
                            >
                              <IconTrash width={16} height={16} />
                            </button>
                          ) : (
                            <button
                              type="button"
                              className={GHOST_BUTTON}
                              onClick={() => handleReactivate(tag)}
                              disabled={reactivatingId === tag.id}
                            >
                              {reactivatingId === tag.id ? (
                                <span className={SPINNER} />
                              ) : null}
                              Reactivar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                : null}
            </tbody>
          </table>
        </div>
      )}

      {tagToDeactivate ? (
        <ConfirmDialog
          title="Dar de baja etiqueta"
          message={`¿Confirmás que querés dar de baja "${tagToDeactivate.name}"? Dejará de estar disponible para asignar a productos, pero podrás reactivarla.`}
          confirmLabel="Dar de baja"
          tone="danger"
          isBusy={isDeleting}
          onConfirm={handleConfirmDeactivate}
          onCancel={() => {
            if (!isDeleting) {
              setTagToDeactivate(null);
            }
          }}
        />
      ) : null}
    </section>
  );
}
