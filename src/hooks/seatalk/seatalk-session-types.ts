/**
 * Shared session-stash types used by the 0x54 (time) and 0x56 (date)
 * SeaTalk hooks. Each sentence alone is incomplete; the Parser's shared
 * `session` object carries date/time across calls so datetime can be
 * emitted once both are known.
 */

export interface SessionTime {
  hour: number
  minute: number
  second: number
  milliSecond: number
}

export interface SessionDate {
  year: number
  month: number
  day: number
}
