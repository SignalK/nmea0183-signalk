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
const schema = require('@signalk/signalk-schema')
const knotsToMs = (v) => utils.transform(v, 'knots', 'ms')
const degToRad = (v) => utils.transform(v, 'deg', 'rad')
const cToK = (v) => utils.transform(v, 'c', 'k')
const nmToM = (v) => utils.transform(v, 'nm', 'm')

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
  14: 'ais-sart',
  15: 'default',
}

const msgTypeToTransmitterClass = {
  1: 'A',
  2: 'A',
  3: 'A',
  4: 'BASE',
  5: 'A',
  18: 'B',
  19: 'B',
  21: 'ATON',
}

const msgTypeToPrefix = {
  1: 'vessels.',
  2: 'vessels.',
  3: 'vessels.',
  5: 'vessels.',
  9: 'aircraft.',
  18: 'vessels.',
  19: 'vessels.',
  21: 'atons.',
  24: 'vessels.',
}

const specialManeuverMapping = {
  0: 'not available',
  1: 'not engaged',
  2: 'engaged',
  3: 'reserved',
}

const beaufortScale = {
  0: 'Calm, 0–0.2 m/s',
  1: 'Light air, 0.3–1.5 m/s',
  2: 'Light breeze, 1.6–3.3 m/s',
  3: 'Gentle breeze, 3.4–5.4 m/s',
  4: 'Moderate breeze, 5.5–7.9 m/s',
  5: 'Fresh breeze, 8–10.7 m/s',
  6: 'Strong breeze, 10.8–13.8 m/s',
  7: 'High wind, 13.9–17.1 m/s',
  8: 'Gale, 17.2–20.7 m/s',
  9: 'Strong gale, 20.8–24.4 m/s',
  10: 'Storm, 24.5–28.4 m/s',
  11: 'Violent storm, 28.5–32.6 m/s',
  12: 'Hurricane-force, ≥ 32.7 m/s',
  13: 'not available',
  14: 'reserved',
  15: 'reserved',
}

const statusTable = {
  0: 'steady',
  1: 'decreasing',
  2: 'increasing',
  3: 'not available',
}

const precipitationType = {
  0: 'reserved',
  1: 'rain',
  2: 'thunderstorm',
  3: 'freezing rain',
  4: 'mixed/ice',
  5: 'snow',
  6: 'reserved',
  7: 'not available',
}

const iceTable = {
  0: 'no',
  1: 'yes',
  2: 'reserved',
  3: 'not available',
}

module.exports = function (input, session) {
  const { id, sentence, parts, tags } = input
  const data = new Decoder(sentence, session)
  const values = []

  if (data.valid === false) {
    return null
  }

  if (data.mmsi) {
    values.push({
      path: '',
      value: {
        mmsi: data.mmsi,
      },
    })
  }

  if (data.shipname) {
    values.push({
      path: '',
      value: {
        name: data.shipname,
      },
    })
  }

  if (typeof data.sog != 'undefined' && data.sog != 102.3) {
    values.push({
      path: 'navigation.speedOverGround',
      value: utils.transform(data.sog, 'knots', 'ms'),
    })
  }

  if (typeof data.cog != 'undefined' && data.cog != 360) {
    values.push({
      path: 'navigation.courseOverGroundTrue',
      value: utils.transform(data.cog, 'deg', 'rad'),
    })
  }

  if (typeof data.hdg != 'undefined' && data.hdg != 511) {
    values.push({
      path: 'navigation.headingTrue',
      value: utils.transform(data.hdg, 'deg', 'rad'),
    })
  }

  if (data.length) {
    values.push({
      path: 'design.length',
      value: { overall: data.length },
    })
  }

  if (data.width) {
    values.push({
      path: 'design.beam',
      value: data.width,
    })
  }

  if (data.draught) {
    values.push({
      path: 'design.draft',
      value: { current: data.draught },
    })
  }

  if (data.dimA) {
    values.push({
      path: 'sensors.ais.fromBow',
      value: data.dimA,
    })
  }

  if (data.dimD && data.width) {
    var fromCenter
    if (data.dimD > data.width / 2) {
      fromCenter = (data.dimD - data.width / 2) * -1
    } else {
      fromCenter = data.width / 2 - data.dimD
    }

    values.push({
      path: 'sensors.ais.fromCenter',
      value: fromCenter,
    })
  }

  if (typeof data.navstatus !== 'undefined') {
    var state = stateMapping[data.navstatus]
    if (typeof state !== 'undefined') {
      values.push({
        path: 'navigation.state',
        value: state,
      })
    }
  }

  if (data.destination) {
    values.push({
      path: 'navigation.destination.commonName',
      value: data.destination,
    })
  }

  if (data.callsign) {
    values.push({
      path: '',
      value: { communication: { callsignVhf: data.callsign } },
    })
  }

  if (data.aistype) {
    const aisClass = msgTypeToTransmitterClass[data.aistype]
    if (aisClass) {
      values.push({
        path: 'sensors.ais.class',
        value: aisClass,
      })
    }
  }

  if (data.imo) {
    values.push({
      path: '',
      value: {
        registrations: {
          imo: `IMO ${data.imo}`,
        },
      },
    })
  }

  var contextPrefix = msgTypeToPrefix[data.aistype] || 'vessels.'

  if (data.aidtype) {
    contextPrefix = 'atons.'
    var atonType = schema.getAtonTypeName(data.aidtype)
    if (typeof atonType !== 'undefined') {
      values.push({
        path: 'atonType',
        value: { id: data.aidtype, name: atonType },
      })
    }
    if (typeof data.offpos !== 'undefined') {
      values.push({
        path: 'offPosition',
        value: data.offpos == 1,
      })
    }
    if (typeof data.virtual !== 'undefined') {
      values.push({
        path: 'virtual',
        value: data.virtual == 1,
      })
    }
  }

  if (data.cargo) {
    var typeName = schema.getAISShipTypeName(data.cargo)
    if (typeof typeName !== 'undefined') {
      values.push({
        path: 'design.aisShipType',
        value: { id: data.cargo, name: typeName },
      })
    }
  }

  if (typeof data.smi !== 'undefined') {
    values.push({
      path: 'navigation.specialManeuver',
      value: specialManeuverMapping[data.smi],
    })
  }

  if (typeof data.dac !== 'undefined') {
    values.push({
      path: 'sensors.ais.designatedAreaCode',
      value: data.dac,
    })
  }

  if (typeof data.fid !== 'undefined') {
    values.push({
      path: 'sensors.ais.functionalId',
      value: data.fid,
    })
  }

  if (data.lon && data.lat) {
    values.push({
      path: 'navigation.position',
      value: {
        longitude: data.lon,
        latitude: data.lat,
      },
    })
  }

  [
    ['avgwindspd', 'wind.averageSpeed', knotsToMs],
    ['windgust', 'wind.gust', knotsToMs],
    ['winddir', 'wind.directionTrue', degToRad],
    ['windgustdir', 'wind.gustDirectionTrue', degToRad],
    ['airtemp', 'outside.temperature', cToK],
    ['relhumid', 'outside.relativeHumidity', (v) => v],
    ['dewpoint', 'outside.dewPointTemperature', cToK],
    ['airpress', 'outside.pressure', (v) => v * 100],
    ['airpressten', 'outside.pressureTendency', (v) => v],
    ['airpressten', 'outside.pressureTendencyType', (v) => statusTable[v]],
    ['horvisib', 'outside.horizontalVisibility', nmToM],
    ['waterlevel', 'water.level', (v) => v],
    ['waterlevelten', 'water.levelTendency', (v) => v],
    ['waterlevelten', 'water.levelTendencyType', (v) => statusTable[v]],
    ['signwavewhgt', 'water.waves.significantHeight', (v) => v],
    ['waveperiod', 'water.waves.period', (v) => v],
    ['wavedir', 'water.waves.direction', degToRad],
    ['swellhgt', 'water.swell.height', (v) => v],
    ['swellperiod', 'water.swell.period', (v) => v],
    ['swelldir', 'water.swell.directionTrue', degToRad],
    ['seastate', 'water.seaState', (v) => v],
    ['seastate', 'water.seaState.beaufortScale', (v) => beaufortScale[v]],
    ['watertemp', 'water.temperature', cToK],
    ['precipitation', 'outside.precipitation', (v) => v],
    ['precipitation', 'outside.precipitationType', (v) => precipitationType[precipitation]],
    ['salinity', 'water.salinity', (v) => v],
    ['ice', 'water.ice', (v) => v],
    ['ice', 'water.iceType', (v) => iceTable[data.ice]],
  ].forEach(([propName, path, f]) => {
    if (data[propName] !== undefined) {
      contextPrefix = 'meteo.'
      values.push({
        path,
        value: f(data[`environment.observation.${propName}`]),
      })
    }
  })

  if (data.surfcurrspd !== undefined || data.surfcurrdir !== undefined) {
    contextPrefix = 'meteo.'
    const drift = utils.transform(data.surfcurrspd, 'knots', 'ms')
    const set = utils.transform(data.surfcurrdir, 'deg', 'rad')
    values.push({
      path: 'environment.observations.current',
      value: {
        set,
        drift,
      },
    })
  }

  if (values.length === 0) {
    return null
  }
  
  delta = {
    context: contextPrefix + `urn:mrn:imo:mmsi:${data.mmsikey || data.mmsi}`,
    updates: [
      {
        source: tags.source,
        timestamp: tags.timestamp,
        values: values,
      },
    ],
  }

  return delta
}
