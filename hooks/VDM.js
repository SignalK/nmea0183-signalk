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
let delta
let meteoLocation

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
  0: 'Flat',
  1: 'Ripples without crests',
  2: 'Small wavelets. Crests of glassy appearance, not breaking',
  3: 'Large wavelets. Crests begin to break; scattered whitecaps',
  4: 'Small waves',
  5: 'Moderate (1.2 m) longer waves. Some foam and spray',
  6: 'Large waves with foam crests and some spray',
  7: 'Sea heaps up and foam begins to streak',
  8: 'Moderately high waves with breaking crests forming spindrift. Streaks of foam',
  9: 'High waves (6-7 m) with dense foam. Wave crests start to roll over. Considerable spray',
  10: 'Very high waves. The sea surface is white and there is considerable tumbling. Visibility is reduced',
  11: 'Exceptionally high waves',
  12: 'Huge waves. Air filled with foam and spray. Sea completely white with driving spray. Visibility greatly reduced',
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

  if (data.avgwindspd) {
    contextPrefix = 'meteo.'
    values.push({
      path: `environment.air.windAverageSpeed`,
      value: utils.transform(data.avgwindspd, 'knots', 'ms'),
    })
  }

  if (data.windgust) {
    contextPrefix = 'meteo.'
    values.push({
      path: `environment.air.windGust`,
      value: utils.transform(data.windgust, 'knots', 'ms'),
    })
  }

  if (data.winddir) {
    contextPrefix = 'meteo.'
    values.push({
      path: `environment.air.windDirection`,
      value: utils.transform(data.winddir, 'deg', 'rad'),
    })
  }

  if (data.windgustdir) {
    contextPrefix = 'meteo.'
    values.push({
      path: `environment.air.windGustDirection`,
      value: utils.transform(data.windgustdir, 'deg', 'rad'),
    })
  }

  if (data.airtemp) {
    contextPrefix = 'meteo.'
    values.push({
      path: `environment.air.temperature`,
      value: utils.transform(data.airtemp, 'c', 'k'),
    })
  }

  if (data.relhumid) {
    contextPrefix = 'meteo.'
    values.push({
      path: `environment.air.relativeHumidity`,
      value: data.relhumid,
    })
  }

  if (data.dewpoint) {
    contextPrefix = 'meteo.'
    values.push({
      path: `environment.air.dewPoint`,
      value: utils.transform(data.dewpoint, 'c', 'k'),
    })
  }

  if (data.airpress) {
    contextPrefix = 'meteo.'
    values.push({
      path: `environment.air.pressure`,
      value: data.airpress * 100,
    })

  }

  if (data.airpressten) {
    contextPrefix = 'meteo.'
    values.push({
      path: `environment.air.pressureTendency`,
      value: statusTable[data.airpressten],
    })
  }

  if (data.horvisib) {
    contextPrefix = 'meteo.'
    values.push({
      path: `environment.air.horizontalVisibility`,
      value: utils.transform(data.horvisib, 'nm', 'm'),
    })
  }

  if (data.waterlevel) {
    contextPrefix = 'meteo.'
    values.push({
      path: `environment.water.level`,
      value: data.waterlevel,
    })
  }

  if (data.waterlevelten) {
    contextPrefix = 'meteo.'
    values.push({
      path: `environment.water.levelTrend`,
      value: statusTable[data.waterlevelten],
    })
  }

  if (data.surfcurrspd) {
    contextPrefix = 'meteo.'
    values.push({
      path: `environment.water.surfaceCurrentSpeed`,
      value: utils.transform(data.surfcurrspd, 'knots', 'ms'),
    })
  }

  if (data.surfcurrdir) {
    contextPrefix = 'meteo.'
    values.push({
      path: `environment.water.surfaceCurrentDirection`,
      value: utils.transform(data.surfcurrdir, 'deg', 'rad'),
    })
  }

  if (data.signwavewhgt) {
    contextPrefix = 'meteo.'
    values.push({
      path: `environment.water.waveSignificantHeight`,
      value: data.signwavewhgt,
    })
  }

  if (data.waveperiod) {
    contextPrefix = 'meteo.'
    values.push({
      path: `environment.water.wavePeriod`,
      value: data.waveperiod,
    })
  }

  if (data.wavedir) {
    contextPrefix = 'meteo.'
    values.push({
      path: `environment.water.waveDirection`,
      value: utils.transform(data.wavedir, 'deg', 'rad'),
    })
  }

  if (data.swellhgt) {
    contextPrefix = 'meteo.'
    values.push({
      path: `environment.water.swellHeight`,
      value: data.swellhgt,
    })
  }

  if (data.swellperiod) {
    contextPrefix = 'meteo.'
    values.push({
      path: `environment.water.swellPeriod`,
      value: data.swellperiod,
    })
  }

  if (data.swelldir) {
    contextPrefix = 'meteo.'
    values.push({
      path: `environment.water.swellDirection`,
      value: utils.transform(data.swelldir, 'deg', 'rad'),
    })
  }

  if (data.seastate) {
    contextPrefix = 'meteo.'
    values.push({
      path: `environment.water.seaState`,
      value: beaufortScale[data.seastate],
    })
  }

  if (data.watertemp) {
    contextPrefix = 'meteo.'
    values.push({
      path: `environment.water.temperature`,
      value: utils.transform(data.watertemp, 'c', 'k'),
    })
  }

  if (data.precipitation) {
    contextPrefix = 'meteo.'
    values.push({
      path: `environment.air.precipitation`,
      value: precipitationType[data.precipitation],
    })
  }

  if (data.salinity) {
    contextPrefix = 'meteo.'
    values.push({
      path: `environment.water.salinity`,
      value: data.salinity,
    })
  }

  if (data.ice) {
    contextPrefix = 'meteo.'
    values.push({
      path: `environment.water.ice`,
      value: iceTable[data.ice],
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
