/** Lien WhatsApp avec message prérempli. L'utilisateur choisit d'envoyer. */
export function whatsappUrl(number: string, message?: string) {
  const digits = number.replace(/\D/g, "");
  if (!digits) return null;
  const base = `https://wa.me/${digits}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

/** Normalise un numéro saisi (Sénégal par défaut) pour WhatsApp. */
export function toWhatsappNumber(phone: string) {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.length === 9 && /^[37]/.test(digits)) digits = `221${digits}`;
  return digits;
}
