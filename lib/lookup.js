(function() {

  'use strict';

  var jp    = require('JSONPath');
  var xml   = require('pixl-xml');
  var data  = xml.parse(require('path').join(__dirname, '../mappings.xml'));

  module.exports = function(type, sentence) {
    let mappings = jp.eval(data, '$.mapping[?(@.sentence.id=="' +type.toUpperCase()+ '")]');
    let paths = null;

    mappings.forEach((map) => {
      if(paths === null) {
        paths = {};
      }

      paths[map.path] = map.sentence;
    });

    return paths;
  };

})();