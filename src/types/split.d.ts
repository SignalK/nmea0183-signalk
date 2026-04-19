/**
 * Minimal ambient declaration for `split` (the npm package that splits a
 * stream into chunks by newline). Only the default-export factory signature
 * used by the CLI is declared.
 */

declare module 'split' {
  import { Duplex } from 'stream'

  interface SplitOptions {
    maxLength?: number
    trailing?: boolean
  }

  function split(
    matcher?: string | RegExp,
    mapper?: (chunk: string) => unknown,
    options?: SplitOptions
  ): Duplex

  export = split
}
