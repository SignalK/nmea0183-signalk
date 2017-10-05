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
  0: "Default: Type of AtoN not specified",
  1: "Referece point",
  2: "RACON",
  3: "Fixed structure off-shore",
  4: "Reserved for future use",
  5: "Fixed light: without sectors",
  6: "Fixed light: with sectors",
  7: "Fixed leading light front",
  8: "Fixed leading light rear",
  9: "Fixed beacon: cardinal N",
  10: "Fixed beacon: cardinal E",
  11: "Fixed beacon: cardinal S",
  12: "Fixed beacon: cardinal W",
  13: "Fixed beacon: port hand",
  14: "Fixed beacon: starboard hand",
  15: "Fixed beacon: preferred channel port hand",
  16: "Fixed beacon: preferred channel starboard hand",
  17: "Fixed beacon: isolated danger",
  18: "Fixed beacon: safe water",
  20: "Floating AtoN: cardinal N",
  21: "Floating AtoN: cardinal E",
  22: "Floating AtoN: cardinal S",
  23: "Floating AtoN: cardinal W",
  24: "Floating AtoN: port hand mark",
  25: "Floating AtoN: starboard hand mark",
  26: "Floating AtoN: preferred channel port hand",
  27: "Floating AtoN: preferred channel starboard hand",
  28: "Floating AtoN: isolated danger",
  29: "Floating AtoN: safe water",
  30: "Floating AtoN: special mark",
  31: "Floating AtoN: light vessel/LANBY/rigs"
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
        fromCenter = (data.dimD - width / 2) * -1
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
      return Promise.resolve("nothing found")
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
