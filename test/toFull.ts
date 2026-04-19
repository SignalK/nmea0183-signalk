import * as signalkSchema from '@signalk/signalk-schema'
import Debug from 'debug'

const debug = Debug('signalk-parser-nmea0183:test')

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toFull(delta: any): any {
  if (!delta.context) {
    delta.context = 'vessels.' + signalkSchema.fakeMmsiId
  }
  delta.updates.forEach((update: AnyUpdate) => {
    if (!update.timestamp) {
      update.timestamp = new Date().toISOString()
    }
    if (!update.source.label) {
      update.source.label = 'DUMMY_LABEL'
    }
  })
  const result = signalkSchema.deltaToFull(delta)
  if (debug.enabled) {
    debug(JSON.stringify(delta, null, 2))
    debug(JSON.stringify(result, null, 2))
  }
  return result
}

interface AnyUpdate {
  timestamp?: string
  source: { label?: string }
}

export default toFull
module.exports = toFull
module.exports.default = toFull
