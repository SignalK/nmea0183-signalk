'use strict'

const debug = require('debug')('signalk-parser-nmea0183/findHook')
const fs = require('fs')
const path = require('path').join(__dirname, '../hooks')

module.exports = function findHook(id) {
  let found = false

  try {
    found = (typeof fs.statSync(`${path}/${id}.js`) === 'object')
  } catch (e) {}

  if (found === true) {
    return require(`${path}/${id}.js`)
  }

  return false
}
