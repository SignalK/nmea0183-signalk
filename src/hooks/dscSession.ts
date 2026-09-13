import type { ParserSession } from '../types'

/**
 * The position reported by a $--DSC sentence, remembered so that a following
 * $--DSE expansion sentence can refine it. DSE carries only the fractional
 * minutes of a position, never the absolute coordinates, so it is meaningless
 * without the preceding DSC fix from the same station.
 */
export interface DscPosition {
  context: string
  latitude: number
  longitude: number
}

const SESSION_KEY = 'dscPositions'

// Keyed by the MMSI of the station that sent the DSC, because that is the
// address its DSE carries. For a distress relay that is the relaying station,
// while `context` names the casualty the position belongs to.
function positions(session: ParserSession): Record<string, DscPosition> {
  let store = session[SESSION_KEY] as Record<string, DscPosition> | undefined
  if (!store) {
    store = {}
    session[SESSION_KEY] = store
  }
  return store
}

export function rememberDscPosition(
  session: ParserSession,
  mmsi: string,
  position: DscPosition
): void {
  positions(session)[mmsi] = position
}

export function forgetDscPosition(session: ParserSession, mmsi: string): void {
  delete positions(session)[mmsi]
}

export function recallDscPosition(
  session: ParserSession,
  mmsi: string
): DscPosition | undefined {
  return positions(session)[mmsi]
}
