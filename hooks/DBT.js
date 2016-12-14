'use strict'

const debug = require('debug')('signalk-parser-nmea0183/DBT')
const utils = require('nmea0183-utilities')

/*
=== DBT - Depth below transducer ===
------------------------------------------------------------------------------
*******0   1 2   3 4   5 6
*******|   | |   | |   | |
$--DBT,x.x,f,x.x,M,x.x,F*hh<CR><LF>
------------------------------------------------------------------------------
Field Number:
0. Depth, feet
1. f = feet
2. Depth, meters
3. M = meters
4. Depth, Fathoms
5. F = Fathoms
6. Checksum
*/

module.exports = function (parser, input) {
  const { id, sentence, parts } = input
  const delta = {
    context: 'vessels.self',
    updates: [
      {
        source: utils.source(id),
        timestamp: utils.timestamp(),
        values: [
          {
            path: 'environment.depth.belowTransducer',
            value: utils.float(parts[2])
          }
        ]
      }
    ],
  }
  
  return Promise.resolve({ delta })
}