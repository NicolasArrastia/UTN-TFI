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

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) {
    return null;
  }

  return (
    <p className="field__error" id={id}>
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
    <section className="card card--wide">
      <div className="card__header card__header--stack">
        <div>
          <h2 className="card__title">Etiquetas</h2>
          <p className="card__subtitle">
            Administrá las etiquetas del catálogo. Solo los administradores
            pueden crearlas, modificarlas o darlas de baja.
          </p>
        </div>

        <div className="toolbar">
          <label className="check-inline">
            <input
              type="checkbox"
              checked={includeInactive}
              onChange={(event) => setIncludeInactive(event.target.checked)}
            />
            Mostrar inactivas
          </label>

          <button
            type="button"
            className="btn btn--primary btn--sm"
            onClick={openCreate}
          >
            <IconPlus width={16} height={16} />
            Nueva etiqueta
          </button>

          <button
            type="button"
            className="icon-btn"
            onClick={reload}
            aria-label="Actualizar listado"
            title="Actualizar listado"
          >
            <IconRefresh width={18} height={18} />
          </button>
        </div>
      </div>

      {form ? (
        <form className="card__body" onSubmit={handleSubmit} noValidate>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="tag-name">Nombre *</label>
              <input
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

            <div className="field">
              <label htmlFor="tag-color">Color *</label>
              <div className="color-field">
                <input
                  id="tag-color"
                  type="color"
                  value={form.color}
                  onChange={(event) => updateField("color", event.target.value)}
                  aria-invalid={Boolean(errors.color)}
                  aria-describedby={
                    errors.color ? "tag-color-error" : undefined
                  }
                />
                <span className="color-field__value">
                  {form.color.toUpperCase()}
                </span>
              </div>
              <FieldError id="tag-color-error" message={errors.color} />
            </div>
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="btn btn--primary btn--sm"
              disabled={isSubmitting}
            >
              {isSubmitting ? <span className="spinner" /> : null}
              {editingTag ? "Guardar cambios" : "Crear etiqueta"}
            </button>
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={closeForm}
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            {editingTag ? (
              <span className="form-hint">Editando “{editingTag.name}”.</span>
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
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={reload}
            >
              Reintentar
            </button>
          }
        />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Etiqueta</th>
                <th>Color</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={4}>
                    <div className="table-state">
                      <span className="spinner spinner--lg" />
                      <span>Cargando etiquetas...</span>
                    </div>
                  </td>
                </tr>
              ) : null}

              {!isLoading && tags.length === 0 ? (
                <tr>
                  <td colSpan={4}>
                    <div className="table-state">
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
                      <td className="cell-strong">{tag.name}</td>
                      <td>
                        <span className="tag-color">
                          <span
                            className="tag-dot"
                            style={{ backgroundColor: tag.color }}
                          />
                          {tag.color}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            tag.isActive
                              ? "badge--success"
                              : "badge--neutral"
                          }`}
                        >
                          {tag.isActive ? "Activa" : "Inactiva"}
                        </span>
                      </td>
                      <td>
                        <div className="table__actions">
                          <button
                            type="button"
                            className="icon-btn icon-btn--sm"
                            title="Editar etiqueta"
                            aria-label={`Editar ${tag.name}`}
                            onClick={() => openEdit(tag)}
                          >
                            <IconEdit width={16} height={16} />
                          </button>

                          {tag.isActive ? (
                            <button
                              type="button"
                              className="icon-btn icon-btn--sm icon-btn--danger"
                              title="Dar de baja"
                              aria-label={`Dar de baja ${tag.name}`}
                              onClick={() => setTagToDeactivate(tag)}
                            >
                              <IconTrash width={16} height={16} />
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="btn btn--ghost btn--sm"
                              onClick={() => handleReactivate(tag)}
                              disabled={reactivatingId === tag.id}
                            >
                              {reactivatingId === tag.id ? (
                                <span className="spinner" />
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
