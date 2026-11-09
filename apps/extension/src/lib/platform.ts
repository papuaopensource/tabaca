export const isMac =
  typeof navigator !== "undefined" &&
  /Mac|iPhone|iPad/.test(navigator.userAgent)

/** Label for the search shortcut, e.g. "⌘K" or "Ctrl K". */
export const searchShortcutLabel = isMac ? "⌘K" : "Ctrl K"
