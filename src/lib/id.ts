let counter = 0;

/** Short, collision-resistant local id. No accounts, so nothing global needed. */
export function newId(): string {
  counter = (counter + 1) % 1000;
  return `${Date.now().toString(36)}${counter.toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}
