'use strict'

const client = new require('net').Socket()
const debug = require('debug')('signalk-parser-nmea0183/test')
const Parser = require('./lib')
const parser = new Parser()

client.connect(2947, '127.0.0.1', () => {
  debug('Connected to NMEA talker')
})

client.on('error', err => {
  debug(`Client error: ${err.message}`)
})

client.on('data', chunk => {
  if (Buffer.isBuffer(chunk)) {
    chunk = chunk.toString('utf-8')
  }

  parser.parse(chunk)
})

client.on('end', () => {
  debug('Disconnected from NMEA talker')
})

/*
parser.on('warning', warning => {
  debug(`[warning] ${warning.message}`)
})
// */

parser.on('error', error => {
  debug(`[error] ${error.message}`)
})

parser.on('signalk:delta', delta => {
  debug(`[delta] ${JSON.stringify(delta)}`)
})
