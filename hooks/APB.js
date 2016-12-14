'use strict'

const debug = require('debug')('signalk-parser-nmea0183/APB')
const utils = require('nmea0183-utilities')

/*

       0 1    2 3 4 5 6   7 8    9  10  11 12
       | |    | | | | |   | |    |   |  |  |
$GPAPB,A,A,0.10,R,N,V,V,011,M,DEST,011,M,011,M*3C 
where:
        APB       Autopilot format B
0       A         Loran-C blink/SNR warning, general warning 
1       A         Loran-C cycle warning 
2       0.10      cross-track error distance 
3       R         steer Right to correct (or L for Left) 
4       N         cross-track error units - nautical miles (K for kilometers) 
5       V         arrival alarm - circle 
6       V         arrival alarm - perpendicular 
7,8     011,M     magnetic bearing, origin to destination 
9       DEST      destination waypoint ID 
10,11   011,M     magnetic bearing, present position to destination 
12,13   011,M     magnetic heading to steer (bearings could True as 033,T) 
*3C     Checksum

*/

module.exports = function (parser, input) {
  const { id, sentence, parts } = input
  
  if(parts[0].toUpperCase() == 'V') {
    // Don't parse this sentence as it's void.
    return Promise.reject(new Error('Not parsing sentence for it\'s void (LORAN-C blink/SNR warning)'))
  }

  if(parts[1].toUpperCase() == 'V') {
    return Promise.reject(new Error('Not parsing sentence for it\'s void (LORAN-C cycle warning)'))
  }

  const xte = utils.transform(parts[2], (parts[4].toUpperCase() === 'N' ? 'nm' : 'km'), 'm')

  const currentRoute = {
    source: utils.source(id),
    timestamp: utils.timestamp(),
    steer: (parts[3].toUpperCase() == 'R' ? 'right' : 'left'),
    bearingActual: utils.transform(utils.float(parts[10]), 'deg', 'rad'),
    bearingDirect: utils.transform(utils.float(parts[7]), 'deg', 'rad'),
    courseRequired: utils.transform(utils.float(parts[12]), 'deg', 'rad'),
    waypoint: {
      next: parts[9],
      xte: xte
    }
  }
  
  return Promise.reject(new Error('@FIXME: APB hook needs to be rewritten to fit latest version of SK'))
}