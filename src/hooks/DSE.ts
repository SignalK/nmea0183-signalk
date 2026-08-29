import type { Delta, HookFn, ParserInput, ParserSession } from '../types'
import { recallDscPosition } from './dscSession'
import Debug from 'debug'
const debug = Debug('signalk-parser-nmea0183/DSE')

const CODE_ENHANCED_POSITION = '00'

/**
 * The DSC position is truncated toward zero to whole minutes, so the DSE
 * fraction always extends the magnitude — applied sign-preserving so the
 * quadrant is retained.
 */
function refine(value: number, minuteFraction: number): number {
  const sign = value < 0 ? -1 : 1
  return sign * (Math.abs(value) + minuteFraction / 60)
}

/*
 * $--DSE — the expansion sentence that can follow a $--DSC, refining its
 * position from whole minutes to ten-thousandths of a minute.
 *
 *        0 1 2 3          4  5
 * $--DSE,t,n,A,XXXXXXXXXX,00,llllyyyy*hh
 *
 *  0: total sentences in this group
 *  1: sentence number
 *  2: query flag ('A' = automatic/unsolicited)
 *  3: address — MMSI * 10, same convention as $--DSC
 *  4+: repeated (code, data) pairs; code 00 = enhanced position resolution,
 *      data = 4 digits latitude + 4 digits longitude, in 1/10000 of a minute
 */
const DSE: HookFn = function (
  input: ParserInput,
  session: ParserSession
): Delta | null {
  const { parts, tags } = input

  // Multi-sentence groups are vanishingly rare on Class-D gear; skip them.
  if (parts[0] !== '1' || parts[1] !== '1') {
    return null
  }

  const mmsi = (parts[3] ?? '').substring(0, 9)
  if (mmsi.length < 9) {
    return null
  }

  const previous = recallDscPosition(session, mmsi)
  if (!previous) {
    debug('No preceding DSC position for mmsi ' + mmsi)
    return null
  }

  for (let i = 4; i + 1 < parts.length; i += 2) {
    const data = parts[i + 1] ?? ''
    if (parts[i] === CODE_ENHANCED_POSITION && /^\d{8}$/.test(data)) {
      return {
        updates: [
          {
            source: tags.source,
            timestamp: tags.timestamp,
            values: [
              {
                path: 'navigation.position',
                value: {
                  latitude: refine(
                    previous.latitude,
                    Number(data.substring(0, 4)) / 10000
                  ),
                  longitude: refine(
                    previous.longitude,
                    Number(data.substring(4, 8)) / 10000
                  )
                }
              }
            ]
          }
        ],
        context: previous.context
      }
    }
  }
  return null
}

export default DSE
