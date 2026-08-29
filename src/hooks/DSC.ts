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
    case '07': // = Undesignated distres
      return 'undesignated'
    case '08': // = Abandoning ship
      return 'abandon'
    case '09': // = Piracy/armed robbery attack
      return 'piracy'
    case '10': // = Man overboard
      return 'mob'
    case '12': // = EPRIB emission
      return 'epirb'
    default:
      // unassigned symbol; take no action
      return 'unassigned'
  }
}

const DSC: HookFn = function (
  input: ParserInput,
  _session: ParserSession
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
    typeof parts[1] !== 'string' ||
    parts[1].trim() === ''
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
  var relayedBy: string | undefined

  switch (parts[2]!) {
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
        // A distress *relay* (all-ships 116, individual 120 or area 102
        // format carrying the distress category): field 3 holds the relay
        // telecommand, not a nature code — the nature is in field 8 and the
        // casualty's MMSI in field 7. The position in field 5 is the
        // casualty's, so the delta is attributed to the casualty, not to
        // the relaying station.
        distress_nature = natureOfDistress(parts[8])
        relayedBy = mmsi
        if (!isEmpty(parts[7])) {
          mmsi = parts[7]!.substring(0, 9)
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

  if (get_position) {
    var position = parsePosition(parts[5]!)
    values.push({
      path: 'navigation.position',
      value: {
        latitude: position.latitude,
        longitude: position.longitude
      }
    })
  }
  if (distress) {
    var message =
      'DSC Distress Recieved! Nature of distress: ' + distress_nature
    if (relayedBy !== undefined) {
      var casualty = relayedBy === mmsi ? 'an unknown vessel' : 'vessel ' + mmsi
      message =
        'DSC distress relay received for ' +
        casualty +
        ' (relayed by ' +
        relayedBy +
        '). Nature of distress: ' +
        distress_nature
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
 * This codec currently contains basic support for distress messages and
 * position messages.
 *
 * NOTE: The position in the DSC sentence is only accurate to the minute,
 * however, there is an extended sentence that provides further detail. The
 * DSE Sentence (which can follow the DSC sentence) contains further position
 * detail.
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
 * Distress Cancelation (unsupported):
 * $CDDSC,12,3381581370,12,06,00,1423108312,0236,3381581370,,S,*20
 *
 * Example of Non-Distress Call:
 * $CDDSC,20,3381581370,00,21,26,1423108312,1902,,,B,E*7B
 *
 *
 *
 *        0  1          2  3  4  5          6      9 10
 *        |  |          |  |  |  |          |      | |
 * $--DSC,XX,XXXXXXXXXX,XX,XX,XX,XXXXXXXXXX,XXXX,,,A,C*hh<CR><LF>
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
 *   1.    Sender MMSI
 *   2.    Category Element (without first digit)
 *            100 = Routine
 *            108 = Safety
 *            110 = Urgency
 *            112 = Distress
 *
 *   3.    variable based on Category
 *   4.    variable based on category
 *   5.    Sender Position
 *   6.    time in UTC
 *   7.    address of vessel in distress (if different than sending vessel?)
 *   8.    Unknown
 *   9.    Unknown (It may be a representation of a service command)
 *   10.   Expansion message follows
 *            E = true
 *           ' '= false
 *
 */

export default DSC
