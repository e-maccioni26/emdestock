/** EAN-13 : 13 chiffres et clé de contrôle valide. */
export const isValidEan13 = (ean: string): boolean => {
  if (!/^\d{13}$/.test(ean)) return false;
  const digits = [...ean].map(Number);
  const sum = digits.slice(0, 12).reduce((acc, d, i) => acc + d * (i % 2 === 0 ? 1 : 3), 0);
  return (10 - (sum % 10)) % 10 === digits[12];
};
