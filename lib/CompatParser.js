'use strict'

const Transform = require('stream').Transform
const ParentParser = require('../')

console.log('ParentParser', ParentParser)

const CompatParser = function CompatParser(opts) {
  if (!(this instanceof CompatParser)) {
    return new CompatParser(opts)
  }

  const options = Object.assign({}, opts)

  if (typeof options.stream !== 'object' || options.stream === null) {
    options.stream = {}
  }

  options.stream.objectMode = true
  Transform.call(this, options.stream)

  this.parser = new ParentParser(opts)
  this.stream = this.parser.stream()

  this.stream.on('data', delta => {
    this.emit('delta', delta)
    this.push(delta)
  })

  this.stream.on('nmea0183', sentence => {
    this.emit('nmea0183', sentence)
  })
}

require('util').inherits(CompatParser, Transform)
module.exports = CompatParser

CompatParser.prototype._transform = function(chunk, encoding, done) {
  this.stream.write(chunk)
  done()
}
