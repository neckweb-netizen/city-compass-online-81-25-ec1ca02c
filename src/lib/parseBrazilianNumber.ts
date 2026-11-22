// Interpreta valores informados no padrão brasileiro, sem permitir lixo numérico.
// Ex.: "1.234,56" -> 1234.56, "1234,56" -> 1234.56 e "6.19" -> 6.19.
export const parseBrazilianNumber = (input: string): number | null => {
  const value = input.trim().replace(/\s/g, '');
  if (!value) return null;
  let normalized: string;
  if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(value)) {
    normalized = value.replace(/\./g, '').replace(',', '.');
  } else if (/^\d+(,\d+)?$/.test(value)) {
    normalized = value.replace(',', '.');
  } else if (/^\d+(\.\d+)?$/.test(value)) {
    normalized = value;
  } else return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
};
