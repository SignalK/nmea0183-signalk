'use strict'

const debug = require('debug')('signalk-parser-nmea0183/getTagBlock')
const moment = require('moment-timezone')
const tags = ['s:', 'c:']

module.exports = function getTagBlock(sentence) {
  let split = []
  let block = []
  let tags = {}

  // There could be a tag block...
  if (sentence.charAt(0) === '\\') {
    split = sentence.split('\\')
    split = split.filter(part => {
      if (part.trim() === '') {
        return false
      }
      return true
    })
  }

  if (split.length < 2) {
    return false
  }

  if (split[1].trim().charAt(0) === '$' || split[1].trim().charAt(0) === '!') {
    sentence = split[1].trim()
    block = split[0].trim().split(',')
  }

  block.forEach(t => {
    if (t.indexOf('c:') !== -1) {
      tags.timestamp = parseInt(t.replace('c:', '').split('*')[0], 10)
    }

    if (t.indexOf('s:') !== -1) {
      tags.source = t.replace('s:', '')
    }
  })

  if (typeof tags.timestamp === 'number') {
    let len = String(tags.timestamp).length

    if (len <= 12) {
      tags.timestamp *= 1000 
    }

    tags.timestamp = moment.tz(tags.timestamp, 'UTC').toISOString()
  }

  return {
    sentence,
    tags
  }
}
