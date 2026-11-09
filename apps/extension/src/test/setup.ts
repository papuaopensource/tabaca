import "@testing-library/jest-dom/vitest"
import { cleanup } from "@testing-library/react"
import { afterEach } from "vitest"

// jsdom may not implement modal dialogs; a minimal stand-in is enough for tests.
if (typeof HTMLDialogElement !== "undefined") {
  HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) {
    this.open = true
  }
  HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) {
    this.open = false
    this.dispatchEvent(new Event("close"))
  }
}

// jsdom doesn't implement scrolling.
window.scrollTo = () => {}

afterEach(() => {
  cleanup()
  localStorage.clear()
})
