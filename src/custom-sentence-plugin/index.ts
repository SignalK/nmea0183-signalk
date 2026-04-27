/**
 * To test the plugin
 * - install the plugin (for example with npm link)
 * - activate the plugin
 * - add an UDP NMEA0183 connection to the server
 * - send data via udp
 *     echo '$IIXXX,1,2,3,foobar,D*17' | nc -u -w 0 127.0.0.1 7777
 */

import type { Plugin, ServerAPI } from '@signalk/server-api'
import type { ParserInput, ParserSession } from '../types'

function makePlugin(app: ServerAPI): Plugin {
  const id = 'signalk-nmea0183-custom-sentence-plugin'
  const plugin: Plugin = {
    id,
    name: id,
    description: id,
    start() {
      app.emitPropertyValue('nmea0183sentenceParser', {
        sentence: 'XXX',
        parser: (input: ParserInput, _session: ParserSession) => {
          const { parts } = input
          return {
            updates: [
              {
                values: [
                  {
                    path: 'navigation.speedOverGround',
                    value: Number(parts[0])
                  }
                ]
              }
            ]
          }
        }
      })
    },
    stop() {},
    schema: {}
  }
  return plugin
}

export default makePlugin
module.exports = makePlugin
module.exports.default = makePlugin
