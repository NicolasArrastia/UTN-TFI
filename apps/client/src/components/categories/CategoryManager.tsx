import { useState } from "react";
import type { FormEvent } from "react";
import { ConfirmDialog } from "../ConfirmDialog.tsx";
import { StateCard } from "../StateCard.tsx";
import { IconEdit, IconPlus, IconRefresh, IconTrash } from "../icons.tsx";
import { useCategories } from "../../hooks/useCategories.ts";
import {
  getCategoryErrorMessage,
  notify,
} from "../../services/notifications.ts";
import { categoryService } from "../../services/category.service.ts";
import type { Category } from "../../types/catalog.types.ts";

const MAX_NAME_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 500;
const DESCRIPTION_PREVIEW_LENGTH = 80;

interface CategoryFormState {
  name: string;
  description: string;
}

type CategoryFormErrors = Partial<Record<keyof CategoryFormState, string>>;

const truncate = (value: string): string =>
  value.length > DESCRIPTION_PREVIEW_LENGTH
    ? `${value.slice(0, DESCRIPTION_PREVIEW_LENGTH).trimEnd()}…`
    : value;

const validateForm = (form: CategoryFormState): CategoryFormErrors => {
  const errors: CategoryFormErrors = {};
  const name = form.name.trim();

  if (!name) {
    errors.name = "El nombre es obligatorio.";
  } else if (name.length > MAX_NAME_LENGTH) {
    errors.name = `El nombre no puede superar ${MAX_NAME_LENGTH} caracteres.`;
  }

  if (form.description.trim().length > MAX_DESCRIPTION_LENGTH) {
    errors.description = `La descripción no puede superar ${MAX_DESCRIPTION_LENGTH} caracteres.`;
  }

  return errors;
};

const getDeactivateMessage = (category: Category): string => {
  const count = category.activeProductCount ?? 0;

  if (count === 0) {
    return `¿Confirmás que querés dar de baja "${category.name}"? Dejará de estar disponible para asignar a productos, pero podrás reactivarla.`;
  }

  const productLabel = count === 1 ? "producto activo" : "productos activos";

  return `¿Confirmás que querés dar de baja "${category.name}"? La usan ${count} ${productLabel} que conservarán la categoría, pero no podrá asignarse a nuevos productos. Podrás reactivarla.`;
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
const TEXTAREA = `${INPUT} min-h-[104px] resize-y leading-normal`;

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

export function CategoryManager() {
  const [includeInactive, setIncludeInactive] = useState(false);
  const { categories, isLoading, error, reload } =
    useCategories(includeInactive);

  const [form, setForm] = useState<CategoryFormState | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [errors, setErrors] = useState<CategoryFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categoryToDeactivate, setCategoryToDeactivate] =
    useState<Category | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [reactivatingId, setReactivatingId] = useState<number | null>(null);

  const openCreate = () => {
    setEditingCategory(null);
    setErrors({});
    setForm({ name: "", description: "" });
  };

  const openEdit = (category: Category) => {
    setEditingCategory(category);
    setErrors({});
    setForm({
      name: category.name,
      description: category.description ?? "",
    });
  };

  const closeForm = () => {
    if (isSubmitting) {
      return;
    }

    setForm(null);
    setEditingCategory(null);
    setErrors({});
  };

  const updateField = (field: keyof CategoryFormState, value: string) => {
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

    const description = form.description.trim();
    const payload = {
      name: form.name.trim(),
      description: description || null,
    };

    setIsSubmitting(true);

    try {
      if (editingCategory) {
        await categoryService.update(editingCategory.id, payload);
        notify.success(`Categoría "${payload.name}" actualizada.`);
      } else {
        await categoryService.create(payload);
        notify.success(`Categoría "${payload.name}" creada.`);
      }

      setForm(null);
      setEditingCategory(null);
      setErrors({});
      reload();
    } catch (submitError) {
      notify.error(getCategoryErrorMessage(submitError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDeactivate = async () => {
    if (!categoryToDeactivate) {
      return;
    }

    setIsDeleting(true);

    try {
      await categoryService.remove(categoryToDeactivate.id);
      notify.success(`Se dio de baja "${categoryToDeactivate.name}".`);

      if (editingCategory?.id === categoryToDeactivate.id) {
        setForm(null);
        setEditingCategory(null);
      }

      setCategoryToDeactivate(null);
      reload();
    } catch (deleteError) {
      notify.error(getCategoryErrorMessage(deleteError));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleReactivate = async (category: Category) => {
    setReactivatingId(category.id);

    try {
      await categoryService.update(category.id, { isActive: true });
      notify.success(`Se reactivó "${category.name}".`);
      reload();
    } catch (reactivateError) {
      notify.error(getCategoryErrorMessage(reactivateError));
    } finally {
      setReactivatingId(null);
    }
  };

  return (
    <section className={CARD}>
      <div className={CARD_HEADER}>
        <div>
          <h2 className={CARD_TITLE}>Categorías</h2>
          <p className={CARD_SUBTITLE}>
            Administrá las categorías del catálogo. Solo los administradores
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
            Nueva categoría
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
              <label className={LABEL} htmlFor="category-name">
                Nombre *
              </label>
              <input
                className={INPUT}
                id="category-name"
                type="text"
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
                placeholder="Ej.: Almacén"
                maxLength={MAX_NAME_LENGTH}
                aria-invalid={Boolean(errors.name)}
                aria-describedby={
                  errors.name ? "category-name-error" : undefined
                }
              />
              <FieldError id="category-name-error" message={errors.name} />
            </div>

            <div className={`${FIELD} col-span-full`}>
              <label className={LABEL} htmlFor="category-description">
                Descripción
              </label>
              <textarea
                className={TEXTAREA}
                id="category-description"
                value={form.description}
                onChange={(event) =>
                  updateField("description", event.target.value)
                }
                placeholder="Detalle de la categoría (opcional)."
                rows={3}
                maxLength={MAX_DESCRIPTION_LENGTH}
                aria-invalid={Boolean(errors.description)}
                aria-describedby={
                  errors.description ? "category-description-error" : undefined
                }
              />
              <FieldError
                id="category-description-error"
                message={errors.description}
              />
            </div>
          </div>

          <div className={FORM_ACTIONS}>
            <button
              type="submit"
              className={PRIMARY_BUTTON}
              disabled={isSubmitting}
            >
              {isSubmitting ? <span className={SPINNER} /> : null}
              {editingCategory ? "Guardar cambios" : "Crear categoría"}
            </button>
            <button
              type="button"
              className={GHOST_BUTTON}
              onClick={closeForm}
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            {editingCategory ? (
              <span className={FORM_HINT}>
                Editando “{editingCategory.name}”.
              </span>
            ) : null}
          </div>
        </form>
      ) : null}

      {error ? (
        <StateCard
          title="No pudimos cargar las categorías"
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
                <th className={TH}>Categoría</th>
                <th className={TH}>Descripción</th>
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
                      <span>Cargando categorías...</span>
                    </div>
                  </td>
                </tr>
              ) : null}

              {!isLoading && categories.length === 0 ? (
                <tr>
                  <td className={TD} colSpan={4}>
                    <div className="flex items-center justify-center gap-3 py-[26px] text-[13.5px] text-muted">
                      {includeInactive
                        ? "Todavía no hay categorías cargadas."
                        : "No hay categorías activas. Creá una nueva o activá la opción de mostrar inactivas."}
                    </div>
                  </td>
                </tr>
              ) : null}

              {!isLoading
                ? categories.map((category) => (
                    <tr key={category.id}>
                      <td className={`${TD} font-semibold text-ink`}>
                        {category.name}
                      </td>
                      <td className={TD}>
                        {category.description
                          ? truncate(category.description)
                          : "—"}
                      </td>
                      <td className={TD}>
                        <span
                          className={
                            category.isActive
                              ? BADGE_SUCCESS
                              : BADGE_NEUTRAL
                          }
                        >
                          {category.isActive ? "Activa" : "Inactiva"}
                        </span>
                      </td>
                      <td className={TD}>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            className={ICON_BUTTON_SM}
                            title="Editar categoría"
                            aria-label={`Editar ${category.name}`}
                            onClick={() => openEdit(category)}
                          >
                            <IconEdit width={16} height={16} />
                          </button>

                          {category.isActive ? (
                            <button
                              type="button"
                              className={`${ICON_BUTTON_SM} ${ICON_BUTTON_DANGER}`}
                              title="Dar de baja"
                              aria-label={`Dar de baja ${category.name}`}
                              onClick={() =>
                                setCategoryToDeactivate(category)
                              }
                            >
                              <IconTrash width={16} height={16} />
                            </button>
                          ) : (
                            <button
                              type="button"
                              className={GHOST_BUTTON}
                              onClick={() => handleReactivate(category)}
                              disabled={reactivatingId === category.id}
                            >
                              {reactivatingId === category.id ? (
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

      {categoryToDeactivate ? (
        <ConfirmDialog
          title="Dar de baja categoría"
          message={getDeactivateMessage(categoryToDeactivate)}
          confirmLabel="Dar de baja"
          tone="danger"
          isBusy={isDeleting}
          onConfirm={handleConfirmDeactivate}
          onCancel={() => {
            if (!isDeleting) {
              setCategoryToDeactivate(null);
            }
          }}
        />
      ) : null}
    </section>
  );
}
