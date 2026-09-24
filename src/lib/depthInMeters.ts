/**
 * The depth field group `x.x,f,x.x,M,x.x,F` shared by DBT, DBK and DBS.
 *
 * All three sentences carry the same reading three times over, in feet,
 * metres and fathoms, and a talker is free to populate only the one its
 * operator has selected. Reading the metres field alone dropped the sounding
 * entirely from a unit configured for feet or fathoms.
 */

import * as utils from '@signalk/nmea0183-utilities'

// Exact by definition, a fathom being six feet. Deliberately not
// `utils.transform('ft', 'm')`, which divides by RATIOS.METER_IN_FEET, a
// truncated 3.2808, and so reads 0.0012% high. The exact factors cost
// nothing and keep a converted sounding consistent with one a talker
// reports in metres directly.
const FEET_TO_METERS = 0.3048
const FATHOMS_TO_METERS = 1.8288

/**
 * Depth in metres, preferring the field that needs no conversion. Returns
 * `null` when none of the three is present, which is the IEC 61162-1
 * §7.2.3.4 "sensor working, value not available" marker rather than a
 * sounding of zero.
 */
export default function depthInMeters(parts: string[]): number | null {
  const meters = utils.floatOrNull(parts[2] ?? '')
  if (meters !== null) {
    return meters
  }

  const feet = utils.floatOrNull(parts[0] ?? '')
  if (feet !== null) {
    return feet * FEET_TO_METERS
  }

  const fathoms = utils.floatOrNull(parts[4] ?? '')
  if (fathoms !== null) {
    return fathoms * FATHOMS_TO_METERS
  }

  return null
}
