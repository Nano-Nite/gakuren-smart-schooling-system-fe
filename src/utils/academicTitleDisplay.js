// Display only: preserve selected UUIDs and distinguish Dr. from dr.
export const uniqueTitleLabels = (labels = []) => [...new Set(labels.filter(Boolean).map(label => String(label).trim()).filter(Boolean))];

export const formatIndonesianAcademicName = (name, prefixes = [], suffixes = []) => {
  const baseName = String(name || "").trim();
  const prefixPart = uniqueTitleLabels(prefixes).join(" ");
  const suffixPart = uniqueTitleLabels(suffixes).join(", ");
  return `${prefixPart ? `${prefixPart} ` : ""}${baseName}${suffixPart ? `, ${suffixPart}` : ""}`.trim();
};
