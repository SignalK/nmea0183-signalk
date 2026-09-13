/**
 * Copyright 2016 Signal K and Fabian Tollenaar <fabian@signalk.org>.
 * Based on the work by Philip J Freeman
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import type {
  Delta,
  DeltaValue,
  HookFn,
  ParserInput,
  ParserSession
} from '../types'
import { forgetDscPosition, rememberDscPosition } from './dscSession'
import Debug from 'debug'
const debug = Debug('signalk-parser-nmea0183/DSC')
function parsePosition(line: string): { longitude: number; latitude: number } {
  /*
   * Position Format:
   *
   * / Quadrant Id ("0" = NE, "1" = NW, "2" = SE, and "3" = SW
   * |
   * |/ Degrees Latitude
   * ||
   * || / Minutes Latitude
   * || |
   * || | / Degrees Longitude
   * || | |
   * || | |  / Minutes Longitude
   * || | |  |
   * 1YYyyXXXxx
   */

  var lat = parseFloat(line.substring(1, 3))
  var lat_min = parseFloat(line.substring(3, 5))
  var lat_dec = lat + lat_min / 60

  var lon = parseFloat(line.substring(5, 8))
  var lon_min = parseFloat(line.substring(8, 10))
  var lon_dec = lon + lon_min / 60

  var quadrant = parseInt(line.substring(0, 1))

  if (quadrant == 1 || quadrant == 3) {
    lon_dec = lon_dec * -1
  }
  if (quadrant == 2 || quadrant == 3) {
    lat_dec = lat_dec * -1
  }
  debug('lat: ' + lat_dec + ' ,lon: ' + lon_dec)
  return { longitude: lon_dec, latitude: lat_dec }
}

function natureOfDistress(code: string | undefined): string {
  switch (code) {
    case '00': // = Fire, explosion
      return 'fire'
    case '01': // = Flooding
      return 'flooding'
    case '02': // = Collision
      return 'collision'
    case '03': // = Grounding
      return 'grounding'
    case '04': // = Listing, in danger of capsize
      return 'listing'
    case '05': // = Sinking
      return 'sinking'
    case '06': // = Disabled and adrift
      return 'adrift'
    case '07': // = Undesignated distress
      return 'undesignated'
    case '08': // = Abandoning ship
      return 'abandon'
    case '09': // = Piracy/armed robbery attack
      return 'piracy'
    case '10': // = Man overboard
      return 'mob'
    case '12': // = EPIRB emission
      return 'epirb'
    default:
      // unassigned symbol; take no action
      return 'unassigned'
  }
}

// A DSC address field holds the 9-digit MMSI, normally followed by a
// trailing zero: "3380400790" is MMSI 338040079. Anything else cannot name a
// vessel and would produce a malformed context.
function isMmsiField(field: string | undefined): field is string {
  return /^\d{9,10}$/.test(field ?? '')
}

const DSC: HookFn = function (
  input: ParserInput,
  session: ParserSession
): Delta | null {
  const { sentence, parts, tags } = input
  var values: DeltaValue[] = []

  // Only the format specifier (parts[0]) and the sender MMSI (parts[1])
  // are universally required. The DSC Category (parts[2]) is left null
  // by the standard whenever the Format Specifier is Distress (FS=12) —
  // see SignalK/nmea0183-signalk#217. Gating on parts[2] here would
  // silently drop every Distress Alert that follows the spec, which
  // is strictly worse than the pre-#192 behaviour of falling through
  // to the "unhandled" notification.
  if (
    typeof parts[0] !== 'string' ||
    parts[0].trim() === '' ||
    !isMmsiField(parts[1])
  ) {
    return null
  }

  // for some reason, it seems the sender identification is mmsi+'0', so we
  // strip the trailing zero to get a 9 digit mmsi
  var mmsi = parts[1]!.substring(0, 9)
  debug('mmsi: ' + mmsi)

  var handled = false
  var get_position = false
  var distress = false
  var distress_nature = ''
  // Set when another station reports this distress (relay or acknowledgement)
  var reportedBy: string | undefined
  var isAcknowledgement = false

  // A distress alert (format specifier 112) carries no DSC category — per
  // ITU-R M.493 it is implied. Fall back to the format specifier so an
  // implied-category alert reaches the distress branch below instead of the
  // "not handled" notification (#217).
  const category = parts[2]?.trim() ? parts[2] : parts[0] === '12' ? '12' : ''

  switch (category) {
    case '00': // routine category
      switch (parts[3]!) {
        case '21': // ship position
          handled = true
          get_position = true
          break
        //case '??': // other telecommands
      }
      break

    case '08': // * 108 = safety
      break
    case '10': // * 110 = urgency
      break
    case '12': // * 112 = distress
      handled = true
      get_position = true
      distress = true
      if (parts[0] !== '12') {
        // Another station reporting a vessel's distress, as an all-ships
        // (116), individual (120) or area (102) call: a relay or an
        // acknowledgement. Field 3 holds that telecommand, not a nature code;
        // the nature is in field 8 and the casualty's MMSI in field 7. The
        // position in field 5 is the casualty's, so the delta is attributed
        // to the casualty, not to the reporting station.
        // Field 3: "10" or "110" = acknowledgement, "12" or "112" = relay.
        distress_nature = natureOfDistress(parts[8])
        reportedBy = mmsi
        isAcknowledgement = (parts[3] ?? '').endsWith('10')
        const casualtyField = parts[7]
        if (isMmsiField(casualtyField)) {
          mmsi = casualtyField.substring(0, 9)
        }
      } else {
        distress_nature = natureOfDistress(parts[3])
      }
  }

  /*values.push({
    path: "",
    value: {
      mmsi: parts[1]!
    }
  })*/

  // A following $--DSE carries the sending station's address. For a relay or
  // acknowledgement that is the reporting station, not the casualty the delta
  // belongs to.
  const senderMmsi = reportedBy ?? mmsi

  // Only parse a full 10-digit position field; a missing or garbled one would
  // yield NaN latitude/longitude, and a sparse distress alert may omit it.
  if (get_position && /^\d{10}$/.test(parts[5] ?? '')) {
    var position = parsePosition(parts[5]!)
    values.push({
      path: 'navigation.position',
      value: {
        latitude: position.latitude,
        longitude: position.longitude
      }
    })
    // Remember this whole-minute fix so a following $--DSE sentence can refine
    // it to ten-thousandths of a minute.
    rememberDscPosition(session, senderMmsi, {
      context: 'vessels.urn:mrn:imo:mmsi:' + mmsi,
      latitude: position.latitude,
      longitude: position.longitude
    })
  } else {
    // This sentence carries no position for a DSE to refine, so an earlier
    // fix from the same station must not be refined in its place.
    forgetDscPosition(session, senderMmsi)
  }
  if (distress) {
    var message =
      'DSC Distress Received! Nature of distress: ' + distress_nature
    if (reportedBy !== undefined) {
      var casualty =
        reportedBy === mmsi ? 'an unknown vessel' : 'vessel ' + mmsi
      message = isAcknowledgement
        ? 'DSC distress acknowledgement received for ' +
          casualty +
          ' (acknowledged by ' +
          reportedBy +
          ')'
        : 'DSC distress relay received for ' +
          casualty +
          ' (relayed by ' +
          reportedBy +
          ')'
      message += '. Nature of distress: ' + distress_nature
      var ack = typeof parts[9] === 'string' ? parts[9]!.trim() : ''
      if (ack !== '') {
        message += '. Acknowledgement: ' + ack
      }
    }
    values.push({
      path: 'notifications.' + distress_nature,
      value: {
        message: message
      }
    })
  }
  if (!handled) {
    debug('DSC Message Not Handled: ' + sentence)
    values.push({
      path: 'notifications.dsc_parser',
      value: {
        message: 'DSC Message Not Handled: ' + sentence
      }
    })
  }
  if (values.length === 0) {
    return null
  }

  return {
    updates: [
      {
        source: tags.source,
        timestamp: tags.timestamp,
        values: values
      }
    ],
    context: 'vessels.urn:mrn:imo:mmsi:' + mmsi
  }
}

/*
 * DSC Codec - Some DSC Capable VHF Radios output DSC Sentences
 *
 * Handles position reports, distress alerts, and distress relays and
 * acknowledgements sent by other stations about a vessel in distress. Other
 * calls surface as a "DSC Message Not Handled" notification.
 *
 * NOTE: The position in the DSC sentence is only accurate to the minute. The
 * DSE sentence that can follow it refines the position; see DSE.ts.
 *
 *
 * Documentation for DSC Sentences:
 *
 *  * http://continuouswave.com/whaler/reference/DSC_Datagrams.html
 *
 * Distress Alert Example:
 * $CDDSC,12,3380400790,12,06,00,1423108312,2019,,,S,E*6A
 * $CDDSE,1,1,A,3380400790,00,45894494*1B
 *
 * Distress Relay Example (coast station 003160001 relaying the EPIRB alert
 * of vessel 316200911):
 * $CDDSC,16,0031600010,12,112,00,1423108312,2019,3162009110,12,,*47
 *
 * Distress Cancelation (unsupported):
 * $CDDSC,12,3381581370,12,06,00,1423108312,0236,3381581370,,S,*20
 *
 * Example of Non-Distress Call:
 * $CDDSC,20,3381581370,00,21,26,1423108312,1902,,,B,E*7B
 *
 *
 *
 *        0  1          2  3  4  5          6    7          8  9 10
 *        |  |          |  |  |  |          |    |          |  | |
 * $--DSC,XX,XXXXXXXXXX,XX,XX,XX,XXXXXXXXXX,XXXX,XXXXXXXXXX,XX,A,C*hh<CR><LF>
 *
 * Field Number:
 *   0.    Format Specifier (without first digit)
 *            102 = selective call to a group of ships in particular geographic area
 *            112 = distress alert call
 *            114 = selective call to a group of ships having common interest
 *            116 = all ships call
 *            120 = selective call to particular individual station
 *            123 = selective call to a particular individual using automatic service
 *
 *   1.    Sender MMSI, followed by a trailing zero (3380400790 = 338040079)
 *   2.    Category Element (without first digit); empty for a distress
 *         alert, where it is implied
 *            100 = Routine
 *            108 = Safety
 *            110 = Urgency
 *            112 = Distress
 *
 *   3.    Distress alert: nature of distress. Otherwise the first
 *         telecommand, e.g. 21 = ship position, 10 = distress
 *         acknowledgement, 12 = distress relay
 *   4.    variable based on category
 *   5.    Position (the casualty's, for a relay or acknowledgement)
 *   6.    time in UTC
 *   7.    MMSI of the vessel in distress (relay or acknowledgement)
 *   8.    Nature of distress (relay or acknowledgement)
 *   9.    Acknowledgement: R = requested, B = acknowledgement, S = neither
 *   10.   Expansion message follows
 *            E = true
 *           ' '= false
 *
 */

export default DSC
