'use strict'

const debug = require('debug')('signalk-parser-nmea0183/SteamParser')
const Transform = require('stream').Transform
const isObject = require('./types').isObject

class StreamParser extends Transform {
  constructor (opts) {
    opts = isObject(opts) ? opts : {}
    opts.objectMode = true
    super(opts)

    this.options = isObject(opts) ? opts : {}
    this.options.objectMode = true
    this.parser = this.options.parser
    this.buffer = ''
  }

  _transform (chunk, encoding, done) {
    if (Buffer.isBuffer(chunk)) {
      chunk = chunk.toString()
    }

    this.buffer += chunk
    this.buffer = this.buffer.replace(/\\r\\n/g, '\n')

    if (this.buffer.indexOf('\n') !== -1 
      || (this.buffer.indexOf('\n') === -1 && this.buffer.indexOf('$') !== -1 && this.buffer.indexOf('*') !== -1) 
      || (this.buffer.indexOf('\n') === -1 && this.buffer.indexOf('!') !== -1 && this.buffer.indexOf('*') !== -1)) {
      
      let split = this.buffer.split('\n')
      let unfinished = ''
      let lines = []

      split.forEach(line => {
        line = line.trim()

        if (line !== '') {
          if (this._isSentenceStart(line)) {
            if (line.charAt(line.length - 3) === '*') {
              lines.push(line)
            } else {
              unfinished = line
            }
          } else {
            unfinished += line
          }
        }

        unfinished = unfinished.trim()
        
        if (unfinished !== '' && this._isSentenceStart(unfinished) && unfinished.charAt(unfinished.length - 3) === '*') {
          lines.push(unfinished)
        }
      })

      const lastLine = split[split.length - 1].trim()

      if (this._isSentenceStart(lastLine) && lastLine.charAt(split[split.length - 1].length - 3) !== '*') {
        this.buffer = lastLine
      } else {
        this.buffer = ''
      }

      if (lines.length === 0) {
        return done()
      }

      lines.forEach(line => {
        this
        .parser
        .parse(line.trim())
        .then(result => {
          this.push(result)
          done()
        })
        .catch(err => {
          debug(`Error parsing line (${line}): ${err.message}`)
          this.parser.emit('warning', `[stream] error parsing line (${line}): ${err.message}`)
          done()
        })
      })
    } else {
      done()
    }
  }

  _flush (done) {
    done()
  }

  _isSentenceStart (line) {
    return (line.charAt(0) === '$' || line.charAt(0) === '!' || line.charAt(0) === '\\')
  }
}

module.exports = StreamParser
