// Minimal stand-ins for the "framer" module so the project's code components run unchanged
// outside Framer. Property controls only matter inside the Framer editor, so they are no-ops here.

/* eslint-disable @typescript-eslint/no-explicit-any */
export const ControlType: any = new Proxy({}, { get: (_target, key) => String(key) })

export function addPropertyControls(..._args: unknown[]): void {}

export const RenderTarget = {
  canvas: "CANVAS",
  export: "EXPORT",
  thumbnail: "THUMBNAIL",
  preview: "PREVIEW",
  current: (): string => "PREVIEW",
  hasRestrictions: (): boolean => false,
}

export function useIsStaticRenderer(): boolean {
  return false
}
