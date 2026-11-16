const currencyFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("es-AR");

const dateTimeFormatter = new Intl.DateTimeFormat("es-AR", {
  dateStyle: "medium",
  timeStyle: "short",
});

const monthFormatter = new Intl.DateTimeFormat("es-AR", { month: "short" });

export const formatCurrency = (value: number): string =>
  currencyFormatter.format(value);

export const formatNumber = (value: number): string => numberFormatter.format(value);

export const formatDateTime = (value: string): string =>
  dateTimeFormatter.format(new Date(value));

/** Convierte un período `YYYY-MM` en la etiqueta corta del mes. */
export const formatMonthLabel = (value: string): string => {
  const [year = "0", month = "1"] = value.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);

  return monthFormatter.format(date).replace(".", "");
};
