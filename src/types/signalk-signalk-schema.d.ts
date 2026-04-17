/**
 * Minimal ambient declaration for @signalk/signalk-schema. Only the bits
 * actually used by this repo are covered: the chai plugin, delta->full
 * conversion used by tests, and a couple of lookup helpers used by VDM.
 */

declare module '@signalk/signalk-schema' {
  import type { Assertion } from 'chai'

  export function chaiModule(chai: unknown, utils: unknown): void

  export const fakeMmsiId: string

  export function deltaToFull(delta: unknown): unknown

  export function getAISShipTypeName(code: number | string): string | undefined

  export function getAtonTypeName(code: number | string): string | undefined

  // Chai augmentation: expose the `validSignalK` property used in tests.
  global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Chai {
      interface Assertion {
        validSignalK: Assertion
      }
    }
  }
}
