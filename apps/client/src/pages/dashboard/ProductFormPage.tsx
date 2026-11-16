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

const PRIMARY_BUTTON =
  "inline-flex items-center justify-center gap-2 rounded-field bg-brand px-3.5 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-65";

const GHOST_BUTTON =
  "inline-flex items-center justify-center gap-2 rounded-field border border-line px-3.5 py-2 text-[13px] font-semibold text-ink-soft transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-65";

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
    <div className="grid gap-3.5">
      <Link
        to={backTo}
        className="inline-flex w-fit items-center gap-1.5 text-[13px] font-semibold text-muted transition-colors hover:text-brand"
      >
        <IconChevronLeft width={16} height={16} />
        {backLabel}
      </Link>

      <section className="rounded-card border border-line bg-white shadow-card">
        <div className="flex items-start justify-between gap-4 px-[22px] pt-5 max-md:px-4">
          <div>
            <h2 className="text-[15px] font-bold tracking-[-0.01em]">{title}</h2>
            <p className="mt-[3px] text-[12.5px] text-muted">{subtitle}</p>
          </div>
        </div>
        <div className="px-[22px] py-5">{children}</div>
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
            <Link to={listPath} className={GHOST_BUTTON}>
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
        <div className="flex items-center justify-center gap-3 py-[26px] text-[13.5px] text-muted">
          <span className="size-8 animate-spin rounded-full border-[3px] border-line border-t-brand" />
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
            <div className="flex flex-wrap items-center justify-end gap-2.5">
              <Link to={listPath} className={GHOST_BUTTON}>
                Ir al listado
              </Link>
              <button
                type="button"
                className={PRIMARY_BUTTON}
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
            <div className="flex flex-wrap items-center justify-end gap-2.5">
              <Link to={listPath} className={GHOST_BUTTON}>
                Ir al listado
              </Link>
              <button
                type="button"
                className={PRIMARY_BUTTON}
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
