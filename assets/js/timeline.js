import { COUNTRIES, PINS } from '../../data/places.js';

export const YEARS = [2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026];

export function clampYear(y) {
  if (!Number.isFinite(y)) return YEARS[YEARS.length - 1];
  return Math.min(YEARS[YEARS.length - 1], Math.max(YEARS[0], Math.round(y)));
}

// A city lights up with its country, unless a pin gives it a later year of its own.
export function unlockedAt(year) {
  const y = clampYear(year);
  const pinYear = new Map(PINS.map(p => [p.city, p.year]));
  const countries = COUNTRIES.filter(c => c.year <= y);
  const cities = countries.flatMap(c => c.cities.filter(city => (pinYear.get(city) ?? c.year) <= y));
  return { countries: countries.map(c => c.id), cities, count: countries.length };
}
