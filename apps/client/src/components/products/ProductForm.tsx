import { useState } from "react";
import type { FormEvent } from "react";
import { formatCurrency } from "../../utils/format.ts";
import type { Category, Tag } from "../../types/catalog.types.ts";
import type { Product, ProductPayload } from "../../types/product.types.ts";

const MAX_NAME_LENGTH = 150;
const MAX_DESCRIPTION_LENGTH = 2000;
const MAX_MONEY = 99_999_999.99;
const MONEY_PATTERN = /^\d+(?:\.\d{1,2})?$/;
const INTEGER_PATTERN = /^\d+$/;

interface FormValues {
  name: string;
  categoryId: string;
  description: string;
  price: string;
  cost: string;
  stock: string;
  minStock: string;
  isActive: boolean;
  tagIds: number[];
}

interface CategoryOption {
  id: number;
  name: string;
  isActive: boolean;
}

interface TagOption {
  id: number;
  name: string;
  color: string;
  isActive: boolean;
}

type FormErrors = Partial<Record<keyof FormValues, string>>;

interface ValidationResult {
  errors: FormErrors;
  payload: ProductPayload | null;
}

interface ProductFormProps {
  mode: "create" | "edit";
  initialProduct?: Product | null;
  categories: Category[];
  tags: Tag[];
  isSubmitting: boolean;
  onSubmit: (payload: ProductPayload) => void;
  onCancel: () => void;
}

const getInitialValues = (product?: Product | null): FormValues => ({
  name: product?.name ?? "",
  categoryId: product ? String(product.categoryId) : "",
  description: product?.description ?? "",
  price: product ? String(product.price) : "",
  cost: product ? String(product.cost) : "",
  stock: product ? String(product.stock) : "0",
  minStock: product ? String(product.minStock) : "0",
  isActive: product?.isActive ?? true,
  tagIds: product?.tags.map((tag) => tag.id) ?? [],
});

const parseMoney = (value: string): number | null => {
  const normalized = value.trim().replace(",", ".");

  if (!MONEY_PATTERN.test(normalized)) {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed <= MAX_MONEY ? parsed : null;
};

const parseInteger = (value: string): number | null => {
  const normalized = value.trim();

  if (!INTEGER_PATTERN.test(normalized)) {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isSafeInteger(parsed) ? parsed : null;
};

const validateForm = (
  values: FormValues,
  categoryOptions: CategoryOption[],
): ValidationResult => {
  const errors: FormErrors = {};

  const name = values.name.trim();

  if (!name) {
    errors.name = "El nombre es obligatorio.";
  } else if (name.length > MAX_NAME_LENGTH) {
    errors.name = `El nombre no puede superar ${MAX_NAME_LENGTH} caracteres.`;
  }

  const description = values.description.trim();

  if (description.length > MAX_DESCRIPTION_LENGTH) {
    errors.description = `La descripción no puede superar ${MAX_DESCRIPTION_LENGTH} caracteres.`;
  }

  const categoryId = values.categoryId ? Number(values.categoryId) : null;

  if (
    categoryId === null ||
    !Number.isInteger(categoryId) ||
    categoryId <= 0
  ) {
    errors.categoryId = "Seleccioná una categoría.";
  } else if (!categoryOptions.some((category) => category.id === categoryId)) {
    errors.categoryId = "La categoría seleccionada no está disponible.";
  }

  const price = parseMoney(values.price);

  if (price === null) {
    errors.price =
      "Ingresá un precio válido, mayor o igual a 0 y con hasta dos decimales.";
  }

  const cost = parseMoney(values.cost);

  if (cost === null) {
    errors.cost =
      "Ingresá un costo válido, mayor o igual a 0 y con hasta dos decimales.";
  }

  const stock = parseInteger(values.stock);

  if (stock === null) {
    errors.stock = "Ingresá una cantidad entera mayor o igual a 0.";
  }

  const minStock = parseInteger(values.minStock);

  if (minStock === null) {
    errors.minStock = "Ingresá una cantidad entera mayor o igual a 0.";
  }

  if (Object.keys(errors).length > 0) {
    return { errors, payload: null };
  }

  if (
    price === null ||
    cost === null ||
    stock === null ||
    minStock === null ||
    categoryId === null
  ) {
    return { errors, payload: null };
  }

  return {
    errors,
    payload: {
      categoryId,
      name,
      description: description || null,
      price,
      cost,
      stock,
      minStock,
      isActive: values.isActive,
      tagIds: [...values.tagIds],
    },
  };
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

export function ProductForm({
  mode,
  initialProduct,
  categories,
  tags,
  isSubmitting,
  onSubmit,
  onCancel,
}: ProductFormProps) {
  const [values, setValues] = useState<FormValues>(() =>
    getInitialValues(initialProduct),
  );
  const [errors, setErrors] = useState<FormErrors>({});

  const retainedCategory =
    initialProduct &&
    !categories.some((category) => category.id === initialProduct.categoryId)
      ? initialProduct.category
      : null;

  const categoryOptions: CategoryOption[] = [
    ...categories.map(({ id, name }) => ({ id, name, isActive: true })),
    ...(retainedCategory
      ? [{ ...retainedCategory, isActive: false }]
      : []),
  ];

  const retainedTags =
    initialProduct?.tags.filter(
      (tag) => !tags.some((activeTag) => activeTag.id === tag.id),
    ) ?? [];

  const tagOptions: TagOption[] = [
    ...tags.map(({ id, name, color }) => ({
      id,
      name,
      color,
      isActive: true,
    })),
    ...retainedTags.map(({ id, name, color }) => ({
      id,
      name,
      color,
      isActive: false,
    })),
  ];

  const availableTagIds = new Set(tagOptions.map((tag) => tag.id));
  const hasCategories = categoryOptions.length > 0;
  const priceValue = Number(values.price);
  const costValue = Number(values.cost);
  const hasMargin =
    values.price !== "" &&
    values.cost !== "" &&
    Number.isFinite(priceValue) &&
    Number.isFinite(costValue);

  const updateField = <K extends keyof FormValues>(
    field: K,
    value: FormValues[K],
  ) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      if (!current[field]) {
        return current;
      }

      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const toggleTag = (tagId: number) => {
    updateField(
      "tagIds",
      values.tagIds.includes(tagId)
        ? values.tagIds.filter((id) => id !== tagId)
        : [...values.tagIds, tagId],
    );
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const result = validateForm(values, categoryOptions);
    setErrors(result.errors);

    if (!result.payload) {
      return;
    }

    onSubmit({
      ...result.payload,
      tagIds: result.payload.tagIds.filter((id) => availableTagIds.has(id)),
    });
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="form-grid">
        <div className="field field--full">
          <label htmlFor="product-name">Nombre *</label>
          <input
            id="product-name"
            type="text"
            value={values.name}
            onChange={(event) => updateField("name", event.target.value)}
            placeholder="Ej.: Yerba mate compuesta 1 kg"
            maxLength={MAX_NAME_LENGTH}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "product-name-error" : undefined}
          />
          <FieldError id="product-name-error" message={errors.name} />
        </div>

        <div className="field">
          <label htmlFor="product-category">Categoría *</label>
          <select
            id="product-category"
            value={values.categoryId}
            onChange={(event) => updateField("categoryId", event.target.value)}
            aria-invalid={Boolean(errors.categoryId)}
            aria-describedby={
              errors.categoryId ? "product-category-error" : undefined
            }
            disabled={!hasCategories}
          >
            <option value="">Seleccioná una categoría</option>
            {categoryOptions.map((category) => (
              <option key={category.id} value={category.id}>
                {category.isActive
                  ? category.name
                  : `${category.name} (inactiva)`}
              </option>
            ))}
          </select>
          <FieldError
            id="product-category-error"
            message={errors.categoryId}
          />
        </div>

        <div className="field">
          <span className="field__label">Estado</span>
          <label className="check-inline check-inline--boxed">
            <input
              type="checkbox"
              checked={values.isActive}
              onChange={(event) =>
                updateField("isActive", event.target.checked)
              }
            />
            {values.isActive ? "Producto activo" : "Producto inactivo"}
          </label>
        </div>

        <div className="field">
          <label htmlFor="product-price">Precio de venta *</label>
          <input
            id="product-price"
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            value={values.price}
            onChange={(event) => updateField("price", event.target.value)}
            placeholder="0.00"
            aria-invalid={Boolean(errors.price)}
            aria-describedby={errors.price ? "product-price-error" : undefined}
          />
          <FieldError id="product-price-error" message={errors.price} />
        </div>

        <div className="field">
          <label htmlFor="product-cost">Costo *</label>
          <input
            id="product-cost"
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            value={values.cost}
            onChange={(event) => updateField("cost", event.target.value)}
            placeholder="0.00"
            aria-invalid={Boolean(errors.cost)}
            aria-describedby={errors.cost ? "product-cost-error" : undefined}
          />
          <FieldError id="product-cost-error" message={errors.cost} />
        </div>

        <div className="field">
          <label htmlFor="product-stock">Stock actual *</label>
          <input
            id="product-stock"
            type="number"
            min="0"
            step="1"
            inputMode="numeric"
            value={values.stock}
            onChange={(event) => updateField("stock", event.target.value)}
            aria-invalid={Boolean(errors.stock)}
            aria-describedby={errors.stock ? "product-stock-error" : undefined}
          />
          <FieldError id="product-stock-error" message={errors.stock} />
        </div>

        <div className="field">
          <label htmlFor="product-min-stock">Stock mínimo *</label>
          <input
            id="product-min-stock"
            type="number"
            min="0"
            step="1"
            inputMode="numeric"
            value={values.minStock}
            onChange={(event) => updateField("minStock", event.target.value)}
            aria-invalid={Boolean(errors.minStock)}
            aria-describedby={
              errors.minStock ? "product-min-stock-error" : undefined
            }
          />
          <FieldError
            id="product-min-stock-error"
            message={errors.minStock}
          />
        </div>

        <div className="field field--full">
          <label htmlFor="product-description">Descripción</label>
          <textarea
            id="product-description"
            value={values.description}
            onChange={(event) =>
              updateField("description", event.target.value)
            }
            placeholder="Detalle del producto, presentación o características."
            rows={4}
            maxLength={MAX_DESCRIPTION_LENGTH}
            aria-invalid={Boolean(errors.description)}
            aria-describedby={
              errors.description ? "product-description-error" : undefined
            }
          />
          <FieldError
            id="product-description-error"
            message={errors.description}
          />
        </div>

        <div className="field field--full">
          <span className="field__label">Etiquetas</span>
          {tagOptions.length === 0 ? (
            <p className="form-hint">No hay etiquetas disponibles.</p>
          ) : (
            <div className="tag-picker">
              {tagOptions.map((tag) => {
                const isSelected = values.tagIds.includes(tag.id);

                return (
                  <label
                    key={tag.id}
                    className={`tag-option${
                      isSelected ? " is-selected" : ""
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleTag(tag.id)}
                    />
                    <span
                      className="tag-dot"
                      style={{ backgroundColor: tag.color }}
                    />
                    {tag.name}
                    {tag.isActive ? null : (
                      <span className="badge badge--neutral">Inactiva</span>
                    )}
                  </label>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {hasCategories ? null : (
        <p className="form-warning">
          No hay categorías activas disponibles. Un administrador debe crear
          una categoría antes de registrar productos.
        </p>
      )}

      <div className="form-actions">
        <button
          type="submit"
          className="btn btn--primary btn--sm"
          disabled={isSubmitting || !hasCategories}
        >
          {isSubmitting ? <span className="spinner" /> : null}
          {mode === "create" ? "Crear producto" : "Guardar cambios"}
        </button>
        <button
          type="button"
          className="btn btn--ghost btn--sm"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancelar
        </button>
        {hasMargin ? (
          <span className="form-hint">
            Margen estimado: {formatCurrency(priceValue - costValue)}
          </span>
        ) : (
          <span className="form-hint">
            Los precios se expresan en pesos argentinos (ARS).
          </span>
        )}
      </div>
    </form>
  );
}
