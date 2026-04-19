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

export interface DeltaValue {
  path: string
  value: unknown
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
