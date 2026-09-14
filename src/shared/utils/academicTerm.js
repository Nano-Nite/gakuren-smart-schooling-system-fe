export function getAutomaticAcademicTerm(date = new Date()) {
  const secondHalf = date.getMonth() >= 6;
  return { startYear: date.getFullYear() - (secondHalf ? 0 : 1), semester: secondHalf ? "Ganjil" : "Genap" };
}

export function isValidAcademicTerm(value) {
  return Boolean(value && Number.isInteger(value.startYear) && value.startYear >= 1900 && value.startYear <= 9998 && ["Ganjil", "Genap"].includes(value.semester));
}

export function readAcademicTermOverride(storage, key) {
  try {
    const value = JSON.parse(storage.getItem(key));
    return isValidAcademicTerm(value) ? value : null;
  } catch { return null; }
}
