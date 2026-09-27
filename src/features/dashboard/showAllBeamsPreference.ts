const STORAGE_KEY = 'bunker-monitor.showAllExceptDisabled'

export function readShowAllExceptDisabled(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

export function writeShowAllExceptDisabled(checked: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, checked ? 'true' : 'false')
  } catch {
    // Private mode or a full quota should not block the toggle itself.
  }
}
