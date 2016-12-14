'use strict'

module.exports = function identity(sentence) {
  const split = sentence.split(',')
  return split.slice(1, (split.length - 1))
}
