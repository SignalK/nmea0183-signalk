(function() {
  'use strict';
  var lookup = require('../lib/lookup');

  console.log(JSON.stringify(lookup('GLL'), null, 2));
})();