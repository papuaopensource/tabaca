import { CheckCircle2 } from "lucide-react"
import { useEffect, useRef } from "react"

export interface ToastMessage {
  text: string
  /** Changes on every show, so repeating the same message shows it again. */
  id: number
}

/**
 * A popover (top layer) so it also appears above modal dialogs, which live in
 * the top layer too. Re-showing it makes it the newest, topmost layer.
 */
export default function Toast({ toast }: { toast: ToastMessage | null }) {
  const ref = useRef<HTMLDivElement>(null)
  const isOpen = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el || typeof el.showPopover !== "function") return
    if (isOpen.current) {
      el.hidePopover()
      isOpen.current = false
    }
    if (toast) {
      el.showPopover()
      isOpen.current = true
    }
  }, [toast])

  return (
    <div
      ref={ref}
      popover="manual"
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed top-auto right-6 bottom-6 left-auto m-0 h-fit w-fit overflow-visible border-0 bg-transparent p-0"
    >
      {toast && (
        <span
          key={toast.id}
          className="inline-flex items-center gap-2 rounded-xl bg-fg px-4 py-2.5 text-sm font-semibold text-canvas shadow-float motion-safe:animate-rise"
        >
          <CheckCircle2 size={16} aria-hidden />
          {toast.text}
        </span>
      )}
    </div>
  )
}
