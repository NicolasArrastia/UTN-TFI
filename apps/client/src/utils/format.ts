const currencyFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("es-AR");

export const formatCurrency = (value: number): string =>
  currencyFormatter.format(value);

export const formatNumber = (value: number): string => numberFormatter.format(value);
