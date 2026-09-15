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

import * as utils from '@signalk/nmea0183-utilities'
import * as schema from '@signalk/signalk-schema'
import { AisDecode } from 'ggencoder'
import type {
  Delta,
  DeltaValue,
  HookFn,
  ParserInput,
  ParserSession
} from '../types'

type NumericInput = number | string
const knotsToMs = (v: NumericInput): number =>
  parseFloat(utils.transform(v, 'knots', 'ms').toFixed(2))
const degToRad = (v: NumericInput): number => utils.transform(v, 'deg', 'rad')
const cToK = (v: NumericInput): number =>
  parseFloat(utils.transform(v, 'c', 'k').toFixed(2))
const percentToRatio = (v: number): number => v / 100

const stateMapping: Record<number, string> = {
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
  15: 'default'
}

const msgTypeToTransmitterClass: Record<number, string> = {
  1: 'A',
  2: 'A',
  3: 'A',
  4: 'BASE',
  5: 'A',
  18: 'B',
  19: 'B',
  21: 'ATON'
}

// AIS Base Stations (type 4) aren't vessels — they are fixed shore-based
// stations that broadcast position + UTC time. Route them to `atons.` so
// clients don't display them as vessels. There isn't a dedicated context in
// the Signal K spec for base stations, and atons is consistent with how other
// non-vessel AIS targets are handled.
const msgTypeToPrefix: Record<number, string> = {
  1: 'vessels.',
  2: 'vessels.',
  3: 'vessels.',
  4: 'atons.',
  5: 'vessels.',
  9: 'aircraft.',
  18: 'vessels.',
  19: 'vessels.',
  21: 'atons.',
  24: 'vessels.'
}

const specialManeuverMapping: Record<number, string> = {
  0: 'not available',
  1: 'not engaged',
  2: 'engaged',
  3: 'reserved'
}

const beaufortScale: Record<number, string> = {
  0: 'calm, 0-0.2 m/s',
  1: 'light air, 0.3-1.5 m/s',
  2: 'light breeze, 1.6-3.3 m/s',
  3: 'gentle breeze, 3.4-5.4 m/s',
  4: 'moderate breeze, 5.5-7.9 m/s',
  5: 'fresh breeze, 8-10.7 m/s',
  6: 'strong breeze, 10.8-13.8 m/s',
  7: 'high wind, 13.9-17.1 m/s',
  8: 'gale, 17.2-20.7 m/s',
  9: 'strong gale, 20.8-24.4 m/s',
  10: 'storm, 24.5-28.4 m/s',
  11: 'violent storm, 28.5-32.6 m/s',
  12: 'hurricane-force, ≥ 32.7 m/s',
  13: 'not available',
  14: 'reserved',
  15: 'reserved'
}

const statusTable: Record<number, string> = {
  0: 'steady',
  1: 'decreasing',
  2: 'increasing',
  3: 'not available'
}

const precipitationType: Record<number, string> = {
  0: 'reserved',
  1: 'rain',
  2: 'thunderstorm',
  3: 'freezing rain',
  4: 'mixed/ice',
  5: 'snow',
  6: 'reserved',
  7: 'not available'
}

const iceTable: Record<number, string> = {
  0: 'no',
  1: 'yes',
  2: 'reserved',
  3: 'not available'
}

// AIS type 5 ETA has only month/day/hour/minute (no year). Returns an ISO string
// using the current UTC year, rolling to next year when the date has already
// passed. Returns undefined when any field is missing (non-type-5 messages) or
// set to the AIS "not available" sentinel (month=0, day=0, hour=24, minute=60).
function toDestinationEtaIso(
  etaMo: unknown,
  etaDay: unknown,
  etaHr: unknown,
  etaMin: unknown
): string | undefined {
  const month = Number(etaMo)
  const day = Number(etaDay)
  const hour = Number(etaHr)
  const minute = Number(etaMin)

  if (
    !Number.isInteger(month) ||
    !Number.isInteger(day) ||
    !Number.isInteger(hour) ||
    !Number.isInteger(minute)
  ) {
    return undefined
  }

  if (
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31 ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return undefined
  }

  const now = new Date()
  const year = now.getUTCFullYear()
  const currentYearEta = new Date(
    Date.UTC(year, month - 1, day, hour, minute, 0, 0)
  )
  if (currentYearEta.getTime() < now.getTime()) {
    return new Date(
      Date.UTC(year + 1, month - 1, day, hour, minute, 0, 0)
    ).toISOString()
  }
  return currentYearEta.toISOString()
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AisDecodeData = { valid: boolean } & Record<string, any>

// AIS area notices: IMO SN.1/Circ.289 area notice (8/1.22) and USCG
// Geographic Notice (8/367.22). A notice is not a vessel, so it is published
// under its own `areas.` context keyed on the source MMSI and message
// linkage ID, with its geometry as a GeoJSON FeatureCollection in which all
// relative positions are resolved to longitude/latitude.
type LonLat = [number, number]

interface NoticeFeature {
  type: 'Feature'
  geometry: { type: string; coordinates: LonLat | LonLat[] | LonLat[][] }
  properties: Record<string, unknown>
}

const EARTH_RADIUS = 6371008.8
const ARC_STEP = 5 // degrees between vertices when approximating arcs
const toRad = (deg: number): number => (deg * Math.PI) / 180
const toDeg = (rad: number): number => (rad * 180) / Math.PI

// Distances and bearings between notice points are rhumb lines
// (USCG Geographic Notice usage note 14)
function rhumbDestination(
  start: LonLat,
  bearing: number,
  distance: number
): LonLat {
  const delta = distance / EARTH_RADIUS
  const theta = toRad(bearing)
  const phi1 = toRad(start[1])
  const deltaPhi = delta * Math.cos(theta)
  let phi2 = phi1 + deltaPhi
  if (Math.abs(phi2) > Math.PI / 2) {
    phi2 = phi2 > 0 ? Math.PI - phi2 : -Math.PI - phi2
  }
  const deltaPsi = Math.log(
    Math.tan(phi2 / 2 + Math.PI / 4) / Math.tan(phi1 / 2 + Math.PI / 4)
  )
  const q = Math.abs(deltaPsi) > 10e-12 ? deltaPhi / deltaPsi : Math.cos(phi1)
  const lambda2 = toRad(start[0]) + (delta * Math.sin(theta)) / q
  return [((toDeg(lambda2) + 540) % 360) - 180, toDeg(phi2)]
}

// Points on an arc from `from` clockwise to `to` (degrees true)
function arc(center: LonLat, radius: number, from: number, to: number) {
  const sweep = (((to - from) % 360) + 360) % 360 || 360
  const steps = Math.max(1, Math.ceil(sweep / ARC_STEP))
  const points: LonLat[] = []
  for (let i = 0; i <= steps; i++) {
    points.push(rhumbDestination(center, from + (sweep * i) / steps, radius))
  }
  return points
}

const pointFeature = (
  shape: string,
  position: LonLat,
  properties: Record<string, unknown> = {}
): NoticeFeature => ({
  type: 'Feature',
  geometry: { type: 'Point', coordinates: position },
  properties: { shape, ...properties }
})

const shapeFeature = (
  shape: string,
  type: 'LineString' | 'Polygon',
  points: LonLat[],
  properties: Record<string, unknown> = {}
): NoticeFeature => ({
  type: 'Feature',
  geometry: { type, coordinates: type === 'Polygon' ? [points] : points },
  properties: { shape, ...properties }
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function areaNoticeGeometry(subareas: any[]) {
  const features: NoticeFeature[] = []
  const openRings: LonLat[][] = []
  let anchor: LonLat | undefined // start point for a polyline or polygon
  let anchorFeature: NoticeFeature | undefined
  let open: { shape: string; points: LonLat[] } | undefined

  for (const area of subareas) {
    const position: LonLat | undefined =
      typeof area.lon === 'number' && typeof area.lat === 'number'
        ? [area.lon, area.lat]
        : undefined
    const continues = open !== undefined && open.shape === area.shape
    if (!continues) {
      open = undefined
    }

    switch (area.shape) {
      case 'circle':
        if (!position) break
        if (area.radius > 0) {
          const ring = arc(position, area.radius, 0, 360)
          ring[ring.length - 1] = ring[0]!
          features.push(
            shapeFeature('circle', 'Polygon', ring, {
              center: position,
              radius: area.radius
            })
          )
          anchorFeature = undefined
        } else {
          anchorFeature = pointFeature('point', position)
          features.push(anchorFeature)
        }
        anchor = position
        break
      case 'rectangle': {
        if (!position) break
        const southEast = rhumbDestination(
          position,
          90 + area.orientation,
          area.east
        )
        const northWest = rhumbDestination(
          position,
          area.orientation,
          area.north
        )
        const properties = {
          east: area.east,
          north: area.north,
          orientation: area.orientation
        }
        if (area.east === 0 && area.north === 0) {
          anchorFeature = pointFeature('point', position)
          features.push(anchorFeature)
        } else {
          anchorFeature = undefined
          if (area.east === 0 || area.north === 0) {
            features.push(
              shapeFeature(
                'rectangle',
                'LineString',
                [position, area.east === 0 ? northWest : southEast],
                properties
              )
            )
          } else {
            const northEast = rhumbDestination(
              southEast,
              area.orientation,
              area.north
            )
            features.push(
              shapeFeature(
                'rectangle',
                'Polygon',
                [position, southEast, northEast, northWest, position],
                properties
              )
            )
          }
        }
        anchor = position
        break
      }
      case 'sector':
        if (!position) break
        anchorFeature = undefined
        if (area.radius > 0) {
          features.push(
            shapeFeature(
              'sector',
              'Polygon',
              [
                position,
                ...arc(position, area.radius, area.left, area.right),
                position
              ],
              { radius: area.radius, left: area.left, right: area.right }
            )
          )
        } else {
          features.push(pointFeature('sector', position))
        }
        anchor = position
        break
      case 'polyline':
      case 'polygon': {
        // consecutive sub-areas of the same shape continue the same line
        if (!open) {
          if (!anchor) break
          if (anchorFeature) {
            features.splice(features.indexOf(anchorFeature), 1)
            anchorFeature = undefined
          }
          open = { shape: area.shape, points: [anchor] }
          if (area.shape === 'polygon') {
            openRings.push(open.points)
            features.push(shapeFeature('polygon', 'Polygon', open.points))
          } else {
            features.push(shapeFeature('polyline', 'LineString', open.points))
          }
        }
        for (const point of area.points) {
          anchor = rhumbDestination(anchor!, point.bearing, point.distance)
          open.points.push(anchor)
        }
        break
      }
    }
  }
  // a polygon closes from its last point back to point 0
  openRings.forEach((ring) => ring.push(ring[0]!))

  return { type: 'FeatureCollection', features }
}

// The notice carries month/day/hour/minute only. USCG Geographic Notice usage
// note 2: the start year is next year when it is December now and the notice
// starts in January, otherwise the current year.
function noticeStartIso(data: AisDecodeData): string | undefined {
  const { month, day, hour, minute } = data
  if ([month, day, hour, minute].some((v) => typeof v !== 'number')) {
    return undefined
  }
  const now = new Date()
  const year =
    now.getUTCMonth() === 11 && month === 1
      ? now.getUTCFullYear() + 1
      : now.getUTCFullYear()
  return new Date(Date.UTC(year, month - 1, day, hour, minute)).toISOString()
}

function areaNoticeDelta(
  data: AisDecodeData,
  tags: ParserInput['tags']
): Delta {
  const notice: Record<string, unknown> = {
    linkId: data.linkid,
    type: data.noticetype
  }
  const description =
    typeof data.GetNoticeDescription === 'function'
      ? data.GetNoticeDescription()
      : undefined
  if (description) {
    notice.description = description
  }
  const start = noticeStartIso(data)
  if (start) {
    notice.start = start
    if (typeof data.duration === 'number' && data.duration > 0) {
      notice.end = new Date(
        Date.parse(start) + data.duration * 60000
      ).toISOString()
    }
  }
  if (data.duration === 0 || data.noticetype === 126) {
    notice.cancelled = true
  }
  if (typeof data.version === 'number') {
    notice.version = data.version
  }
  if (typeof data.action === 'number') {
    notice.action = data.action === 1 ? 'directive' : 'advisement'
  }
  if (data.txt) {
    notice.text = data.txt
  }
  notice.geometry = areaNoticeGeometry(data.subareas)

  return {
    context: `areas.urn:mrn:imo:mmsi:${data.mmsikey}`,
    updates: [
      {
        source: tags.source,
        timestamp: tags.timestamp,
        values: [
          { path: '', value: { mmsi: data.mmsi } },
          { path: 'sensors.ais.designatedAreaCode', value: data.dac },
          { path: 'sensors.ais.functionalId', value: data.fid },
          { path: 'notice', value: notice }
        ]
      }
    ]
  }
}

const VDM: HookFn = function (
  input: ParserInput,
  session: ParserSession
): Delta | null {
  const { sentence, tags } = input
  // AisDecode exposes a large number of optional fields whose types vary per
  // AIS message type; cast to a looser bag so downstream bit-math reads as
  // naturally as it did in JS. Runtime behaviour is identical.
  const data = new AisDecode(sentence, session) as unknown as AisDecodeData
  const values: DeltaValue[] = []

  if (data.valid === false) {
    return null
  }

  if (data.aistype === 8 && data.fid === 22 && Array.isArray(data.subareas)) {
    return areaNoticeDelta(data, tags)
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

  if (typeof data.sog != 'undefined' && data.sog != 102.3) {
    values.push({
      path: 'navigation.speedOverGround',
      value: utils.transform(data.sog, 'knots', 'ms')
    })
  }

  if (typeof data.cog != 'undefined' && data.cog != 360) {
    values.push({
      path: 'navigation.courseOverGroundTrue',
      value: utils.transform(data.cog, 'deg', 'rad')
    })
  }

  if (typeof data.hdg != 'undefined' && data.hdg != 511) {
    values.push({
      path: 'navigation.headingTrue',
      value: utils.transform(data.hdg, 'deg', 'rad')
    })
  }

  // AIS rate-of-turn (ITU-R M.1371-5, msg types 1/2/3):
  //     0 : not turning
  //     1..126 / -1..-126 : turning right/left, ROT_deg_per_min = sign(rot) * (|rot|/4.733)^2
  //     127 / -127 : turning right/left at >5 deg/30s, no rate available
  //     -128 (0x80) : no turn information
  // ggencoder exposes the raw signed byte in `data.rot`; skip it when the value
  // doesn't carry a usable rate.
  if (
    typeof data.rot !== 'undefined' &&
    data.rot !== -128 &&
    data.rot !== 127 &&
    data.rot !== -127
  ) {
    const rotDegPerMin =
      Math.sign(data.rot) * Math.pow(Math.abs(data.rot) / 4.733, 2)
    values.push({
      path: 'navigation.rateOfTurn',
      value: utils.transform(rotDegPerMin, 'deg', 'rad') / 60
    })
  }

  if (data.length) {
    values.push({
      path: 'design.length',
      value: { overall: data.length }
    })
  }

  if (data.width) {
    values.push({
      path: 'design.beam',
      value: data.width
    })
  }

  if (data.draught) {
    values.push({
      path: 'design.draft',
      value: { current: data.draught }
    })
  }

  if (data.dimA) {
    values.push({
      path: 'sensors.ais.fromBow',
      value: data.dimA
    })
  }

  if (data.dimD && data.width) {
    let fromCenter: number
    if (data.dimD > data.width / 2) {
      fromCenter = (data.dimD - data.width / 2) * -1
    } else {
      fromCenter = data.width / 2 - data.dimD
    }

    values.push({
      path: 'sensors.ais.fromCenter',
      value: fromCenter
    })
  }

  if (typeof data.navstatus !== 'undefined') {
    const state = stateMapping[data.navstatus]
    if (typeof state !== 'undefined') {
      values.push({
        path: 'navigation.state',
        value: state
      })
    }
  }

  if (data.destination) {
    values.push({
      path: 'navigation.destination.commonName',
      value: data.destination
    })
  }

  const etaIso = toDestinationEtaIso(
    data.etaMo,
    data.etaDay,
    data.etaHr,
    data.etaMin
  )
  if (etaIso) {
    values.push({
      path: 'navigation.destination.eta',
      value: etaIso
    })
  }

  if (data.callsign) {
    values.push({
      path: '',
      value: { communication: { callsignVhf: data.callsign } }
    })
  }

  if (data.aistype) {
    const aisClass = msgTypeToTransmitterClass[data.aistype]
    if (aisClass) {
      values.push({
        path: 'sensors.ais.class',
        value: aisClass
      })
    }
  }

  if (data.imo) {
    values.push({
      path: '',
      value: {
        registrations: {
          imo: `IMO ${data.imo}`
        }
      }
    })
  }

  let contextPrefix = msgTypeToPrefix[data.aistype] || 'vessels.'

  if (data.aidtype) {
    contextPrefix = 'atons.'
    const atonType = schema.getAtonTypeName(data.aidtype)
    if (typeof atonType !== 'undefined') {
      values.push({
        path: 'atonType',
        value: { id: data.aidtype, name: atonType }
      })
    }
    if (typeof data.offpos !== 'undefined') {
      values.push({
        path: 'offPosition',
        value: data.offpos == 1
      })
    }
    if (typeof data.virtual !== 'undefined') {
      values.push({
        path: 'virtual',
        value: data.virtual == 1
      })
    }
  }

  if (data.cargo) {
    const typeName = schema.getAISShipTypeName(data.cargo)
    if (typeof typeName !== 'undefined') {
      values.push({
        path: 'design.aisShipType',
        value: { id: data.cargo, name: typeName }
      })
    }
  }

  if (typeof data.smi !== 'undefined') {
    values.push({
      path: 'navigation.specialManeuver',
      value: specialManeuverMapping[data.smi] ?? null
    })
  }

  if (typeof data.dac !== 'undefined') {
    values.push({
      path: 'sensors.ais.designatedAreaCode',
      value: data.dac
    })
  }

  if (typeof data.fid !== 'undefined') {
    if (data.fid == 31 || data.fid == 11 || data.fid == 33) {
      contextPrefix = 'meteo.'
    }
    values.push({
      path: 'sensors.ais.functionalId',
      value: data.fid
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

  ;[
    ['avgwindspd', 'wind.averageSpeed', knotsToMs],
    ['windgust', 'wind.gust', knotsToMs],
    ['winddir', 'wind.directionTrue', degToRad],
    ['windgustdir', 'wind.gustDirectionTrue', degToRad],
    ['airtemp', 'outside.temperature', cToK],
    ['relhumid', 'outside.relativeHumidity', percentToRatio],
    ['dewpoint', 'outside.dewPointTemperature', cToK],
    ['airpress', 'outside.pressure', (v: number) => v * 100],
    ['waterlevel', 'water.level', (v: number) => v],
    ['signwavewhgt', 'water.waves.significantHeight', (v: number) => v],
    ['waveperiod', 'water.waves.period', (v: number) => v],
    ['wavedir', 'water.waves.directionTrue', degToRad],
    ['swellhgt', 'water.swell.height', (v: number) => v],
    ['swellperiod', 'water.swell.period', (v: number) => v],
    ['swelldir', 'water.swell.directionTrue', degToRad],
    ['watertemp', 'water.temperature', cToK],
    ['salinity', 'water.salinity', percentToRatio],
    ['surfcurrspd', 'water.current.drift', knotsToMs],
    ['surfcurrdir', 'water.current.set', degToRad]
  ].forEach(
    // `as const`-free tuples - widen the tuple entry to a cast triple so the
    // destructure is safe under noUncheckedIndexedAccess.
    (entry) => {
      const [propName, path, f] = entry as [
        string,
        string,
        (v: number) => number
      ]
      if (data[propName] !== undefined) {
        contextPrefix = 'meteo.'
        values.push({
          path: `environment.` + path,
          value: f(data[propName])
        })
      }
    }
  )
  ;[
    ['ice', 'water.ice', iceTable],
    ['precipitation', 'outside.precipitation', precipitationType],
    ['seastate', 'water.seaState', beaufortScale],
    ['waterlevelten', 'water.levelTendency', statusTable],
    ['airpressten', 'outside.pressureTendency', statusTable]
  ].forEach((entry) => {
    const [propName, path, f] = entry as [
      string,
      string,
      Record<number, string>
    ]
    if (data[propName] !== undefined) {
      contextPrefix = 'meteo.'
      values.push(
        {
          path: `environment.` + path,
          value: f[data[propName]] ?? null
        },
        {
          path: `environment.` + path + `Value`,
          value: data[propName]
        }
      )
    }
  })

  if (data.horvisib !== undefined && data.horvisibrange !== undefined) {
    contextPrefix = 'meteo.'
    values.push(
      {
        path: 'environment.outside.horizontalVisibility',
        value: utils.transform(data.horvisib, 'nm', 'm')
      },
      {
        path: 'environment.outside.horizontalVisibility.overRange',
        value: data.horvisibrange
      }
    )
  }

  if (
    data.utcday !== undefined &&
    data.utchour !== undefined &&
    data.utcminute !== undefined
  ) {
    contextPrefix = 'meteo.'
    const y = new Date().getUTCFullYear()
    const m = new Date().getUTCMonth() + 1
    const d = data.utcday
    const h = data.utchour
    const min = data.utcminute
    const date = `${y}-${m.toString().padStart(2, '0')}-${d
      .toString()
      .padStart(2, '0')}T${h.toString().padStart(2, '0')}:${min
      .toString()
      .padStart(2, '0')}:00.000Z`
    values.push({
      path: 'environment.date',
      value: date
    })
  }

  if (values.length === 0) {
    return null
  }

  const delta = {
    context: contextPrefix + `urn:mrn:imo:mmsi:${data.mmsikey || data.mmsi}`,
    updates: [
      {
        source: tags.source,
        timestamp: tags.timestamp,
        values: values
      }
    ]
  }

  return delta
}

export default VDM
