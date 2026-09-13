/**
 * Timestamps for sentences that carry a UTC time of day but no date, such as
 * GGA or GLL. RMC and ZDA carry a date and use `utils.timestamp(time, date)`,
 * except that an RMC with an empty date field is dated here too.
 *
 * The date comes from a reference time: the tag block `c:` time when the
 * sentence has one, otherwise the host clock. Taking the reference's UTC
 * date as-is breaks around midnight: a fix stamped 23:59:59 that arrives a
 * moment after 00:00 would be dated almost 24 hours in the future. Instead,
 * the date is chosen so the result lies within 12 hours of the reference,
 * which absorbs transport latency and small clock offsets in either
 * direction, and keeps replayed logs on the dates they were recorded.
 *
 * Input:  time "235959", reference 2026-09-12T00:00:00.691Z
 * Output: "2026-09-11T23:59:59.000Z" (not "2026-09-12T23:59:59.000Z")
 *
 * When another hook starts using this, add it to the table of sentences in
 * test/timestampFromTimeOfDay.ts.
 */

import * as utils from '@signalk/nmea0183-utilities'

const DAY_MS = 24 * 60 * 60 * 1000

/** Returns `reference` unchanged when the sentence has no time. */
function timestampFromTimeOfDay(
  time: string,
  reference?: string
): string | undefined {
  if (!time) {
    return reference
  }
  const referenceMs =
    reference === undefined ? Date.now() : Date.parse(reference)
  // Start from the time of day on 1970-01-01 and move it by whole days to the
  // candidate nearest the reference. Math.round sends an exact 12 hour tie
  // towards the past, since a late sentence is far more likely than one from
  // the future.
  const timeOfDayMs = parseTimeOfDay(time)
  const dayShift = Math.round((timeOfDayMs - referenceMs) / DAY_MS)
  return new Date(timeOfDayMs - dayShift * DAY_MS).toISOString()
}

/**
 * Milliseconds since midnight for an NMEA `hhmmss[.sss]` field, read the way
 * `utils.timestamp` reads it: unparseable fields count as 0 and up to three
 * fraction digits are kept.
 *
 * Input:  "235959.75"
 * Output: 86399750 (23:59:59.750)
 */
function parseTimeOfDay(time: string): number {
  const hours = utils.int(time.slice(0, 2))
  const minutes = utils.int(time.slice(2, 4))
  const seconds = utils.int(time.slice(4, 6))
  // ".2" -> 200, ".25" -> 250, ".2567" -> 256
  const fraction = /\.(\d+)/.exec(time)
  const millis = fraction ? parseInt((fraction[1]! + '000').slice(0, 3), 10) : 0
  return ((hours * 60 + minutes) * 60 + seconds) * 1000 + millis
}

export default timestampFromTimeOfDay
