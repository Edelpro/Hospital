export function cargarPlantillasLocales<T>(clave: string): T[] {
  if (typeof window === 'undefined') return [];
  try {
    const datos = JSON.parse(window.localStorage.getItem(clave) || '[]');
    return Array.isArray(datos) ? datos : [];
  } catch {
    return [];
  }
}

export function guardarPlantillasLocales<T>(clave: string, plantillas: T[]): void {
  if (typeof window !== 'undefined') window.localStorage.setItem(clave, JSON.stringify(plantillas));
}
