import { CLASS_NAMES, type ClassCode, type Draw } from '../types/api'

/**
 * Filters an already-fetched draw list down to one class, by matching the class field.
 * Mirrors the simple match the home page's DrawsSection already relies on (via the
 * backend's /draws/filter, which returns this same match under `draws`) - doesn't
 * chase the backend's subclass fallback, keeping this predictable for a first version.
 */
export function filterDrawsByClass(draws: Draw[], classCode: ClassCode): Draw[] {
  const className = CLASS_NAMES[classCode]
  return draws.filter((draw) => draw.class.includes(className))
}
