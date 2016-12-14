'use strict'

const utils = require('nmea0183-utilities')
const debug = require('debug')('signalk-parser-nmea0183/parse')
const identity = require('./identity')
const parts = require('./parts')
const findHook = require('./findHook')

module.exports = function parseSentence(emitter, sentence) {
  sentence = String(sentence).trim()
  const valid = utils.valid(sentence)
    
  if (valid === false) {
    emitter.emit('warning', { message: `Sentence "${sentence}" is invalid` })
    return Promise.reject(new Error(`Sentence "${sentence}" is invalid`)) 
  }

  const id = identity(sentence)
  const split = parts(sentence)
  const hook = findHook(id)

  if (hook === false) {
    emitter.emit('warning', { message: `No hook found for "${sentence}"` })
    return Promise.reject(new Error(`No hook found for "${sentence}"`)) 
  }

  return hook(emitter, {
    id, 
    sentence,
    parts: split
  })
}
