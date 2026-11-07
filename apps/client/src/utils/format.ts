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

export const formatCurrency = (value: number): string =>
  currencyFormatter.format(value);

export const formatNumber = (value: number): string => numberFormatter.format(value);

export const formatDateTime = (value: string): string =>
  dateTimeFormatter.format(new Date(value));
