'use strict'

const debug = require('debug')('signalk-parser-nmea0183')
const EventEmitter = require('events')
const isObject = require('./types').isObject
const parseSentence = require('./parse')
const StreamParser = require('./StreamParser')

class Parser extends EventEmitter {
  constructor (opts) {
    super()
    this.options = isObject(opts) ? opts : {}
    this.streamParser = null
  }

  parse (sentence) {
    return parseSentence(this, sentence)
    .then(result => {
      if (typeof result === 'object' && result !== null) {
        this.emit('signalk:full', result.full || {})
        this.emit('signalk:delta', result.delta || {})
      }

      return result
    })
    .catch(e => {
      this.emit('error', e)
    })
  }
  
  stream () {
    if (this.streamParser === null) {
      const opts = isObject(this.options.stream) ? this.options.stream : {}
      opts.parser = this
      this.streamParser = new StreamParser(opts)
    }
    
    return this.streamParser
  }
}

module.exports = Parser
