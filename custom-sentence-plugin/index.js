/**
 * To test the plugin
 * - install the plugin (for example with npm link)
 * - activate the plugin
 * - add an UDP NMEA0183 connection to the server
 * - send data via udp
 *     echo '$IIXXX,1,2,3,foobar,D*17' | nc -u -w 0 127.0.0.1 7777
 */

module.exports = function (app) {
  const plugin = {}
  plugin.id = plugin.name = plugin.description = 'signalk-nmea0183-custom-sentence-plugin'

  plugin.start = function () {
    app.emitPropertyValue('nmea0183sentenceParser', {
      sentence: 'XXX',
      parser: ({ id, sentence, parts, tags }, session) => {
        return {
          updates: [
            {
              values: [
                { path: 'navigation.speedOverGround', value: Number(parts[0]) }
              ]
            }
          ]
        }
      }
    })
  }

  plugin.stop = function () { }
  plugin.schema = {}
  return plugin
}