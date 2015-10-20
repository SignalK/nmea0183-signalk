(function() {

  'use strict';

  var xml   = require('pixl-xml');
  var data  = xml.parse(require('path').join(__dirname, '../mappings.xml'));

  // console.log(JSON.stringify(data, null, 2));

  module.exports = function(type) {
    var paths = null;
    var mappings = [];

    mappings = data.mapping.filter(function(mapping) {
      if(mapping === null || typeof mapping !== 'object') {
        return false;
      }

      if(mapping.nmea0183 === null || typeof mapping.nmea0183 === 'undefined' || mapping.path === null || typeof mapping.path === 'undefined') {
        return false; 
      }

      if(Array.isArray(mapping.nmea0183)) {
        return mapping.nmea0183.some(function(item) {
          if(typeof item.id === 'string' && item.id.toUpperCase() === type.toUpperCase()) {
            return true;
          }

          return false;
        });
      }

      if(mapping.nmea0183 instanceof Object && typeof mapping.nmea0183.id === 'string' && mapping.nmea0183.id.toUpperCase() === type.toUpperCase()) {
        return true;
      }

      return false;
    });

    mappings.forEach(function(mapping) {
      if(paths === null) {
        paths = {};
      }

      if(Array.isArray(mapping.nmea0183)) {
        mapping.nmea0183.forEach(function(sentence) {
          if(typeof sentence.id === 'string' && sentence.id.toUpperCase() === type.toUpperCase()) {
            paths[mapping.path] = sentence;  
          }
        });
      } else {
        paths[mapping.path] = mapping.nmea0183;
      }
    });

    return paths;
  };

})();