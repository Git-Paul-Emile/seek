import { fakerFR as faker } from '@faker-js/faker';

export function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)] as T;
}

export function pickMany<T>(items: readonly T[], count: number): T[] {
  const shuffled = [...items].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, items.length));
}

export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomBool(probabilityTrue = 0.5): boolean {
  return Math.random() < probabilityTrue;
}

export function senegalPhone(): string {
  const prefixes = ['70', '75', '76', '77', '78'];
  const prefix = pick(prefixes);
  const rest = randomInt(1000000, 9999999).toString();
  return `+221${prefix}${rest}`;
}

export function pastDate(daysAgoMax: number): Date {
  return faker.date.recent({ days: daysAgoMax });
}

export function futureDate(daysAheadMax: number): Date {
  return faker.date.soon({ days: daysAheadMax });
}

export { faker };
