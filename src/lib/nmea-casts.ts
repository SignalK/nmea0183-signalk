/**
 * NMEA-field → typed-union boundary helpers.
 *
 * Raw NMEA fields are `string` at parse time; TypeScript can't narrow them
 * to the tight `Pole` / `UnitFormat` unions that `@signalk/nmea0183-utilities`
 * exposes without runtime validation. Each helper below does that validation
 * and returns `null` when the field doesn't match the spec letter set, so
 * malformed sentences produce a `null` delta value instead of bubbling a
 * `TypeError` up through the Parser.
 */

import * as utils from '@signalk/nmea0183-utilities'
import type { Pole, UnitFormat } from '@signalk/nmea0183-utilities'

const POLES = new Set<string>(['N', 'S', 'E', 'W'])

/** Narrow a raw NMEA cardinal-letter field to `Pole`, or `null` if invalid. */
export function toPole(raw: string | undefined | null): Pole | null {
  if (raw === undefined || raw === null) return null
  return POLES.has(raw) ? (raw as Pole) : null
}

const UNITS = new Set<string>([
  'km',
  'nm',
  'm',
  'ft',
  'fa',
  'knots',
  'kph',
  'ms',
  'mph',
  'deg',
  'rad',
  'c',
  'k',
  'f'
])

/** Narrow a raw NMEA unit-letter field to `UnitFormat`, or `null` if invalid. */
export function toUnit(raw: string | undefined | null): UnitFormat | null {
  if (raw === undefined || raw === null) return null
  return UNITS.has(raw) ? (raw as UnitFormat) : null
}

/**
 * `utils.coordinate` with pole-field validation. Returns `null` when the
 * pole letter isn't `N` / `S` / `E` / `W` rather than throwing.
 */
export function coord(value: string, pole: string): number | null {
  const p = toPole(pole)
  if (p === null) return null
  return utils.coordinate(value, p)
}

/**
 * `utils.magneticVariation` with pole-field validation. Returns `null`
 * when the pole letter isn't valid rather than throwing.
 */
export function magVar(degrees: number | string, pole: string): number | null {
  const p = toPole(pole)
  if (p === null) return null
  return utils.magneticVariation(degrees, p)
}
