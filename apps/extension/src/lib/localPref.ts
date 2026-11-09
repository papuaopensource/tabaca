/** Small synchronous UI preferences (sidebar state) kept in localStorage. */
export function readFlag(key: string, fallback: boolean): boolean {
  try {
    const value = localStorage.getItem(key)
    return value === null ? fallback : value === "1"
  } catch {
    return fallback
  }
}

export function writeFlag(key: string, value: boolean): void {
  try {
    localStorage.setItem(key, value ? "1" : "0")
  } catch {
    // Not persisted; fine for a UI preference.
  }
}
