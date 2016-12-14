'use strict'

const utils = require('nmea0183-utilities')
const debug = require('debug')('signalk-parser-nmea0183/parse')
const identity = require('./identity')
const getTagBlock = require('./getTagBlock')
const parts = require('./parts')
const findHook = require('./findHook')

module.exports = function parseSentence(emitter, sentence) {
  let tags = getTagBlock(sentence)

  if (tags !== false) {
    sentence = tags.sentence
    tags = tags.tags
  } else {
    tags = {}
  }

  if (typeof tags.timestamp === 'undefined') {
    tags.timestamp = new Date().toISOString()
  }

  const valid = utils.valid(sentence)
    
  if (valid === false) {
    emitter.emit('warning', { message: `Sentence "${sentence.trim()}" is invalid` })
    return Promise.reject(new Error(`Sentence "${sentence.trim()}" is invalid`)) 
  }

  const id = identity(sentence)
  const split = parts(sentence)
  const hook = findHook(id)

  if (typeof tags.source === 'undefined') {
    tags.source = `nmea0183:${id}`
  }

  if (hook === false) {
    emitter.emit('warning', { message: `No hook found for "${sentence}"` })
    return Promise.reject(new Error(`No hook found for "${sentence}"`)) 
  }

  return hook(emitter, {
    id, 
    sentence,
    parts: split,
    tags
  })
}
