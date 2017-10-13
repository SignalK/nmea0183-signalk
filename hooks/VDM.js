'use strict'

/**
 * Copyright 2016 Signal K and Fabian Tollenaar <fabian@signalk.org>.
 * 
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const debug = require('debug')('signalk-parser-nmea0183/VDM')
const utils = require('@signalk/nmea0183-utilities')
const Decoder = require('ggencoder').AisDecode

const atonTypeMap = {
  0: "0 Default: Type of AtoN not specified",
  1: "1 Referece point",
  2: "2 RACON",
  3: "3 Fixed structure off-shore",
  4: "4 Emergency Wreck Marking Buoy",
  5: "5 Light: without sectors",
  6: "6 Light: with sectors",
  7: "7 Leading Light Front",
  8: "8 Leading Light Rear",
  9: "9 Beacon: Cardinal N",
  10: "10 Beacon, Cardinal E",
  11: "11 Beacon, Cardinal S",
  12: "12 Beacon, Cardinal W",
  13: "13 Beacon, Port hand",
  14: "14 Beacon, Starboard hand",
  15: "15 Beacon, Preferred Channel port hand",
  16: "16 Beacon, Preferred Channel starboard hand",
  17: "17 Beacon, Isolated danger",
  18: "18 Beacon, Safe water",
  19: "19 Beacon, Special mark",  
  20: "20 Cardinal Mark N",
  21: "21 Cardinal Mark E",
  22: "22 Cardinal Mark S",
  23: "23 Cardinal Mark W",
  24: "24 Port hand Mark",
  25: "25 Starboard hand Mark",
  26: "26 Preferred Channel Port hand",
  27: "27 Preferred Channel Starboard hand",
  28: "28 Isolated danger",
  29: "29 Safe Water",
  30: "30 Special Mark",
  31: "31 Light Vessel/LANBY/Rigs"
};

const stateMapping = {
  0: 'motoring',
  1: 'anchored',
  2: 'not under command',
  3: 'restricted manouverability',
  4: 'constrained by draft',
  5: 'moored',
  6: 'aground',
  7: 'fishing',
  8: 'sailing',
  9: 'hazardous material high speed',
  10: 'hazardous material wing in ground',
  14: 'ais-sart'
};

module.exports = function (parser, input) {
  try {
    const { id, sentence, parts, tags } = input
    const data = new Decoder(sentence, parser.session)
    const values = []

    if (data.valid === false) {
      return Promise.resolve(null)
    }

    if (data.mmsi) {
      values.push({
        path: '',
        value: {
          mmsi: data.mmsi
        }
      })
    }

    if (data.shipname) {
      values.push({
        path: '',
        value: {
          name: data.shipname
        }
      })
    }

    if (typeof data.sog != 'undefined') {
      values.push({
        path: 'navigation.speedOverGround',
        value: utils.transform(data.sog, 'knots', 'ms')
      })
    }

    if (typeof data.cog != 'undefined') {
      values.push({
        path: 'navigation.courseOverGroundTrue',
        value: utils.transform(data.cog, 'deg', 'rad')
      })
    }

    if (typeof data.hdg != 'undefined') {
      values.push({
        path: 'navigation.headingTrue',
        value: utils.transform(data.hdg, 'deg', 'rad')
      })
    }

    if (data.lon && data.lat) {
      values.push({
        path: 'navigation.position',
        value: {
          longitude: data.lon,
          latitude: data.lat
        }
      })
    }

    if ( data.length ) {
      values.push({
        path: 'design.length',
        value: data.length
      })
    }

    if ( data.width ) {
      values.push({
        path: 'design.beam',
        value: data.width
      })
    }    

    if ( data.draught ) {
      values.push({
        path: 'design.draft.maximum',
        value: data.draught
      })
    }

    if ( data.dimA ) {
      values.push({
        path: 'sensors.ais.fromBow',
        value: data.dimA
      })
    }

    if ( data.dimD && data.width ) {
      var fromCenter;
      if (data.dimD > data.width / 2) {
        fromCenter = (data.dimD - data.width / 2) * -1
      } else {
        fromCenter =  data.width / 2 - data.dimD
      }

      values.push({
        path: 'sensors.ais.fromCenter',
        value: fromCenter
      })
    }

    if ( data.navstatus ) {
      var state = stateMapping[data.navstatus]
      if ( typeof state !== 'undefined' ) {
        values.push({
          path: 'navigation.state',
          value: state
        })
      }        
    }

    if ( data.destination ) {
      values.push({
        path: 'navigation.destination.commonName',
        value: data.destination
      })
    }

    if ( data.callsign ) {
      values.push({
        path: 'communication.callsignVhf',
        value: data.callsign
      })
    }
    
    var contextPrefix = "vessels."

    if ( data.aidtype ) {
      contextPrefix = "atons."
      values.push({
        path: 'atonType',
        value: atonTypeMap[data.aidtype]
      })
    }

    if ( data.cargo )
    {
      values.push({
        path: 'design.aisShipType',
        value: data.cargo
      })
    }
    
    if (values.length === 0) {
      return Promise.resolve(null)
    }

    const delta = {
      context: contextPrefix + `urn:mrn:imo:mmsi:${data.mmsi}`,
      updates: [
        {
          source: tags.source,
          timestamp: tags.timestamp,
          values: values
        }
      ],
    }

    return Promise.resolve({ delta })
  } catch (e) {
    debug(`Try/catch failed: ${e.message}`)
    return Promise.reject(e)
  }
}
