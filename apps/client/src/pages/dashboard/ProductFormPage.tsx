import { useState } from "react";
import type { ReactNode } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { StateCard } from "../../components/StateCard.tsx";
import { IconChevronLeft } from "../../components/icons.tsx";
import { ProductForm } from "../../components/products/ProductForm.tsx";
import { useCatalog } from "../../hooks/useCatalog.ts";
import { useProduct } from "../../hooks/useProduct.ts";
import { productService } from "../../services/product.service.ts";
import {
  getProductErrorMessage,
  notify,
} from "../../services/notifications.ts";
import type { ProductPayload } from "../../types/product.types.ts";
import { getPreviousPath } from "../../utils/navigation.ts";

const parseProductId = (value: string | undefined): number | null => {
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

interface FormShellProps {
  backTo: string;
  backLabel: string;
  title: string;
  subtitle: string;
  children: ReactNode;
}

function FormShell({
  backTo,
  backLabel,
  title,
  subtitle,
  children,
}: FormShellProps) {
  return (
    <div className="detail-page">
      <Link to={backTo} className="back-link">
        <IconChevronLeft width={16} height={16} />
        {backLabel}
      </Link>

      <section className="card">
        <div className="card__header">
          <div>
            <h2 className="card__title">{title}</h2>
            <p className="card__subtitle">{subtitle}</p>
          </div>
        </div>
        <div className="card__body">{children}</div>
      </section>
    </div>
  );
}

interface ProductFormPageProps {
  mode: "create" | "edit";
}

export function ProductFormPage({ mode }: ProductFormPageProps) {
  const isEdit = mode === "edit";
  const { id: idParam } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const id = isEdit ? parseProductId(idParam) : null;

  const {
    product,
    isLoading: isProductLoading,
    error: productError,
    reload: reloadProduct,
  } = useProduct(id);

  const {
    categories,
    tags,
    isLoading: isCatalogLoading,
    error: catalogError,
    reload: reloadCatalog,
  } = useCatalog();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaultBackTo =
    isEdit && product
      ? `/dashboard/products/${product.id}`
      : "/dashboard/products";
  const backTo = getPreviousPath(location.state, defaultBackTo);
  const listPath = getPreviousPath(location.state, "/dashboard/products");
  const backLabel = isEdit && product ? "Volver al detalle" : "Volver al listado";
  const pageTitle = isEdit ? "Editar producto" : "Nuevo producto";
  const pageSubtitle = isEdit
    ? "Actualizá los datos, el precio y el stock del producto."
    : "Registrá un producto nuevo en el catálogo.";

  const handleSubmit = async (payload: ProductPayload) => {
    setIsSubmitting(true);

    try {
      if (isEdit && product) {
        const updated = await productService.update(product.id, payload);
        notify.success("Producto actualizado correctamente.");
        navigate(`/dashboard/products/${updated.id}`, {
          replace: true,
          state: { from: backTo },
        });
        return;
      }

      const created = await productService.create(payload);
      notify.success("Producto creado correctamente.");
      navigate(`/dashboard/products/${created.id}`, {
        replace: true,
        state: { from: backTo },
      });
    } catch (error) {
      notify.error(getProductErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isEdit && id === null) {
    return (
      <FormShell
        backTo={listPath}
        backLabel="Volver al listado"
        title="Producto no encontrado"
        subtitle="El identificador del producto no es válido."
      >
        <StateCard
          title="No pudimos abrir el formulario"
          message="El producto que intentás editar no existe o el enlace es incorrecto."
          tone="error"
          action={
            <Link to={listPath} className="btn btn--ghost btn--sm">
              Ir al listado
            </Link>
          }
        />
      </FormShell>
    );
  }

  if ((isEdit && isProductLoading) || isCatalogLoading) {
    return (
      <FormShell
        backTo={backTo}
        backLabel={backLabel}
        title={pageTitle}
        subtitle={pageSubtitle}
      >
        <div className="table-state">
          <span className="spinner spinner--lg" />
          <span>Cargando información...</span>
        </div>
      </FormShell>
    );
  }

  if (isEdit && (productError || !product)) {
    return (
      <FormShell
        backTo={listPath}
        backLabel="Volver al listado"
        title={pageTitle}
        subtitle={pageSubtitle}
      >
        <StateCard
          title="No pudimos cargar el producto"
          message={productError ?? "El producto no existe."}
          tone="error"
          action={
            <div className="toolbar toolbar--end">
              <Link to={listPath} className="btn btn--ghost btn--sm">
                Ir al listado
              </Link>
              <button
                type="button"
                className="btn btn--primary btn--sm"
                onClick={reloadProduct}
              >
                Reintentar
              </button>
            </div>
          }
        />
      </FormShell>
    );
  }

  if (catalogError) {
    return (
      <FormShell
        backTo={backTo}
        backLabel={backLabel}
        title={pageTitle}
        subtitle={pageSubtitle}
      >
        <StateCard
          title="No pudimos cargar el catálogo"
          message={catalogError}
          tone="error"
          action={
            <div className="toolbar toolbar--end">
              <Link to={listPath} className="btn btn--ghost btn--sm">
                Ir al listado
              </Link>
              <button
                type="button"
                className="btn btn--primary btn--sm"
                onClick={reloadCatalog}
              >
                Reintentar
              </button>
            </div>
          }
        />
      </FormShell>
    );
  }

  return (
    <FormShell
      backTo={backTo}
      backLabel={backLabel}
      title={pageTitle}
      subtitle={pageSubtitle}
    >
      <ProductForm
        mode={mode}
        initialProduct={product}
        categories={categories}
        tags={tags}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
        onCancel={() => navigate(backTo)}
      />
    </FormShell>
  );
}
