'use strict'

const debug = require('debug')('signalk-parser-nmea0183/MWV')
const utils = require('nmea0183-utilities')

function convertToWindAngle(angle) {
  const numAngle = utils.float(angle) % 360;
  if (numAngle > 180 && numAngle <= 360) {
    return numAngle - 360;
  }
  return numAngle;
}

module.exports = function(parser, input) {
  const { id, sentence, parts } = input

  if(!parts[4] || parts[4].toUpperCase() != 'A') {
    return Promise.reject(new Error('Not parsing sentence for it\'s void.'))
  }

  const wsu = parts[3].toUpperCase()

  if(wsu == 'K') {
    wsu = 'kph';
  } else if(wsu == 'N') {
    wsu = 'knots';
  } else { // M
    wsu = 'ms';
  }

  const angle = convertToWindAngle(parts[0])
  const speed = utils.transform(parts[2], wsu, 'ms')
  const valueType = parts[1].toUpperCase() == 'R' ? 'Apparent' : 'True';
  const angleType = parts[1].toUpperCase() == 'R' ? 'Apparent' : 'TrueWater';

  const delta = {
    context: 'vessels.self'
    updates: [
      {
        source: utils.source(id),
        timestamp: utils.timestamp(),
        values: [
          {
            path: 'environment.wind.speed' + valueType,
            value: speed
          }, 
          {
            path: 'environment.wind.angle' + angleType,
            value: utils.transform(angle, 'deg', 'rad')
          }
        ]
      }
    ],
  }

  return Promise.resolve({ delta })
}