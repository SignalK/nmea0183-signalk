const signalkSchema = require('@signalk/signalk-schema')
const debug = require('debug')('signalk-parser-nmea0183:test')

module.exports = delta => {
  if (!delta.context) {
    delta.context = 'vessels.' + signalkSchema.fakeMmsiId
  }
  delta.updates.forEach(update => {
    if (!update.timestamp) {
      update.timestamp = new Date().toISOString()
    }
  })
  const result = signalkSchema.deltaToFull(delta)
  if (debug.enabled) {
    debug(JSON.stringify(delta, null, 2))
    debug(JSON.stringify(result, null, 2))
  }
  return result
}
