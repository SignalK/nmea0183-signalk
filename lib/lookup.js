(function() {

  'use strict';

  var jp    = require('JSONPath');
  var xml   = require('pixl-xml');
  var data  = xml.parse(require('path').join(__dirname, '../mappings.xml'));

  module.exports = function(type, sentence) {
    var mappings = jp.eval(data, '$.mapping[?(@.sentence.id=="' +type.toUpperCase()+ '")]');
    var paths = null;

    // @TODO implement behaviour when "sentence" is not a single model but an array of sentences.

    mappings.forEach(function(map) {
      if(paths === null) {
        paths = {};
      }

      paths[map.path] = map.sentence;
    });

    return paths;
  };

})();