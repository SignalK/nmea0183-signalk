'use strict'

module.exports = function identity(sentence) {
  return sentence.split(',')[0].substr(3, 3).toUpperCase()
}
