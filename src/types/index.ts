/**
 * Core types shared across the parser, hooks, and tests.
 *
 * Every NMEA hook receives a `ParserInput` and returns either a `Delta` (the
 * Signal K update envelope) or `null` when the sentence carries no usable data.
 */

export interface ParserTags {
  source?: string
  timestamp?: string
}

export interface ParserInput {
  id: string
  sentence: string
  parts: string[]
  tags: ParserTags
  talker: string
}

/**
 * Signal K delta value. `null` is the IEC 61162-1 §7.2.3.4 "sensor working,
 * value not available" marker; `undefined` is deliberately disallowed at
 * the type level — a hook that can't compute a value must emit `null`
 * explicitly so the compiler catches drift back to "implicit 0 for missing"
 * or "drop the field entirely" and leave the absent-vs-unavailable
 * distinction in the IEC-correct shape.
 *
 * `{}` here is the TypeScript "any non-nullish value" type (not the empty
 * object): it accepts every primitive, object literal, and array, which is
 * what hooks legitimately emit. `| null` re-admits null.
 */
// eslint-disable-next-line @typescript-eslint/ban-types
export type DeltaValueType = {} | null

export interface DeltaValue {
  path: string
  value: DeltaValueType
  meta?: unknown
}

export interface DeltaUpdate {
  source?: unknown
  timestamp?: string
  values: DeltaValue[]
}

export interface Delta {
  context?: string
  updates: DeltaUpdate[]
}

/**
 * Optional session object that persists across `parse()` calls. Hooks like
 * GSV (multi-sentence satellite data) or the seatalk lat/lon splits stash
 * partial state on this object.
 */
export type ParserSession = Record<string, unknown>

export type HookFn = (
  input: ParserInput,
  session: ParserSession
) => Delta | null | undefined | void

/**
 * Shape accepted by the `emitPropertyValue` / `onPropertyValues` mechanism
 * used by the Signal K server to register custom sentence parsers at runtime.
 */
export interface CustomSentenceParserEntry {
  sentence: string
  parser: HookFn
}

export interface ParserOptions {
  validateChecksum?: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  emitPropertyValue?: (name: string, value: unknown) => void
  onPropertyValues?: (
    name: string,
    callback: (values: Array<{ value: unknown }> | undefined) => void
  ) => void
}
