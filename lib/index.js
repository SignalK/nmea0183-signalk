'use strict'

const debug = require('debug')('signalk-parser-nmea0183')
const isObject = require('./types').isObject
const EventEmitter = require('events')
const parseSentence = require('./parse')
const parseStream = require('./stream')

class Parser extends EventEmitter {
  constructor (opts) {
    super()
    this.options = isObject(opts) ? opts : {}
  }

  parse (sentence) {
    return parseSentence(this, sentence)
    .then(result => {
      if (typeof result === 'object' && result !== null) {
        this.emit('signalk', result.full || {})
        this.emit('delta', result.delta || {})
      }

      return result
    })
    .catch(e => {
      this.emit('error', e)
    })
  }
  
  stream (stream) {
    return parseStream(this, stream)
  }
}

module.exports = Parser