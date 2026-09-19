export const favoritesKey = 'mizan-favorites-v1';
export function loadFavorites(): string[] {
  try {const value:unknown=JSON.parse(localStorage.getItem(favoritesKey)||'null');if(Array.isArray(value)&&value.every(id=>typeof id==='string'))return [...new Set(value)];} catch {}
  return [];
}
export function saveFavorites(ids:string[]) {localStorage.setItem(favoritesKey,JSON.stringify(ids));}
