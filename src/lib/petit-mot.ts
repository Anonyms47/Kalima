// Brouillon du petit mot écrit sur l'accueil, repris au moment de commander.
// Stockage local uniquement : rien n'est envoyé avant la commande.

const KEY = "kalima-petit-mot";
export const PETIT_MOT_MAX = 300;

export function readPetitMot(): string {
  try {
    return (window.localStorage.getItem(KEY) ?? "").slice(0, PETIT_MOT_MAX);
  } catch {
    return "";
  }
}

export function savePetitMot(text: string) {
  try {
    if (text.trim()) window.localStorage.setItem(KEY, text.slice(0, PETIT_MOT_MAX));
    else window.localStorage.removeItem(KEY);
  } catch {
    // Navigation privée : le mot reste simplement à l'écran.
  }
}
