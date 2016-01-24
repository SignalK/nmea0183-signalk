(function() {
  'use strict'

  var data = require('../mappings.json')

  module.exports = function(type) {
    if(typeof type !== 'string' || (typeof type === 'string' && type.trim() === '')) {
      return false
    }

    type = type.toLowerCase()
    var mapping = false 

    Object.keys(data).forEach(function(path) {
      var mappings = data[path]
      
      if(mappings === null || typeof mappings !== 'object') {
        return
      }

      if(mappings.nmea0183 === null || typeof mappings.nmea0183 !== 'object') {
        return 
      }

      Object.keys(mappings.nmea0183).forEach(function(sentenceId) {
        if(typeof sentenceId === "string" && sentenceId.toLowerCase() === type) {
          mapping = mappings.nmea0183[sentenceId]
        }
      })
    })

    return mapping
  }
})()