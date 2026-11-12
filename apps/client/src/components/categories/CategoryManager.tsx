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
    <section className="card card--wide">
      <div className="card__header card__header--stack">
        <div>
          <h2 className="card__title">Categorías</h2>
          <p className="card__subtitle">
            Administrá las categorías del catálogo. Solo los administradores
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
            Nueva categoría
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
              <label htmlFor="category-name">Nombre *</label>
              <input
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

            <div className="field field--full">
              <label htmlFor="category-description">Descripción</label>
              <textarea
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

          <div className="form-actions">
            <button
              type="submit"
              className="btn btn--primary btn--sm"
              disabled={isSubmitting}
            >
              {isSubmitting ? <span className="spinner" /> : null}
              {editingCategory ? "Guardar cambios" : "Crear categoría"}
            </button>
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={closeForm}
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            {editingCategory ? (
              <span className="form-hint">
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
                <th>Categoría</th>
                <th>Descripción</th>
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
                      <span>Cargando categorías...</span>
                    </div>
                  </td>
                </tr>
              ) : null}

              {!isLoading && categories.length === 0 ? (
                <tr>
                  <td colSpan={4}>
                    <div className="table-state">
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
                      <td className="cell-strong">{category.name}</td>
                      <td>
                        {category.description
                          ? truncate(category.description)
                          : "—"}
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            category.isActive
                              ? "badge--success"
                              : "badge--neutral"
                          }`}
                        >
                          {category.isActive ? "Activa" : "Inactiva"}
                        </span>
                      </td>
                      <td>
                        <div className="table__actions">
                          <button
                            type="button"
                            className="icon-btn icon-btn--sm"
                            title="Editar categoría"
                            aria-label={`Editar ${category.name}`}
                            onClick={() => openEdit(category)}
                          >
                            <IconEdit width={16} height={16} />
                          </button>

                          {category.isActive ? (
                            <button
                              type="button"
                              className="icon-btn icon-btn--sm icon-btn--danger"
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
                              className="btn btn--ghost btn--sm"
                              onClick={() => handleReactivate(category)}
                              disabled={reactivatingId === category.id}
                            >
                              {reactivatingId === category.id ? (
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
