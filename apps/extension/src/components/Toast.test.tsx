import { render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import Toast from "./Toast"

// jsdom has no Popover API; stub it to check the toast uses the top layer.
const show = vi.fn()
const hide = vi.fn()

beforeEach(() => {
  show.mockClear()
  hide.mockClear()
  Object.assign(HTMLElement.prototype, { showPopover: show, hidePopover: hide })
})

afterEach(() => {
  const proto = HTMLElement.prototype as unknown as Record<string, unknown>
  delete proto.showPopover
  delete proto.hidePopover
})

describe("Toast", () => {
  it("shows as a popover so it sits above open dialogs, and re-shows on repeat", () => {
    const { rerender } = render(
      <Toast toast={{ text: "Link copied", id: 1 }} />
    )
    expect(screen.getByRole("status", { hidden: true })).toHaveAttribute(
      "popover",
      "manual"
    )
    expect(screen.getByText("Link copied")).toBeInTheDocument()
    expect(show).toHaveBeenCalledTimes(1)

    rerender(<Toast toast={{ text: "Link copied", id: 2 }} />)
    expect(hide).toHaveBeenCalledTimes(1)
    expect(show).toHaveBeenCalledTimes(2)

    rerender(<Toast toast={null} />)
    expect(hide).toHaveBeenCalledTimes(2)
    expect(screen.queryByText("Link copied")).toBeNull()
  })
})
