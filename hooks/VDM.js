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

    if (values.length === 0) {
      return Promise.resolve(null)
    }

    const delta = {
      context: `vessels.urn:mrn:imo:mmsi:${data.mmsi}`,
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
