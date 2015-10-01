/*
 * Copyright 2015 Fabian Tollenaar <fabian@starting-point.nl>
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
*/

(function() {
  
  'use strict';

  var util        = require('util')
    , utils       = require('nmea0183-utilities')
    , debug       = require('debug')('signalk-parser-nmea0183')
    , Transform   = require('stream').Transform
    , _           = require('lodash')
    , lookup      = require('./lookup')
  ;

  function parseLine(line, cb, opts) {
    var parser  = new Parser(opts);

    parser.on('data', function(data) { 
      cb(null, data); 
      parser.end();
      parser = null;
    });

    parser.write(line);
  }

  function Parser(opts) {
    if(!(this instanceof Parser)) {
      return new Parser(opts);
    }

    this.options = (typeof opts === 'object' && opts !== null) ? opts : {};

    if(!this.options.stream) {
      this.options.stream = {};
    }

    this.options.stream.objectMode = true;

    Transform.call(this, this.options.stream);
  }

  util.inherits(Parser, Transform);

  Parser.prototype.hasValidChecksum = function(str) {
    var check = 0;
    var split = str.split('*');

    for (var i = 1; i < split[0].length; i++) {
      check = check ^ split[0].charCodeAt(i);
    };

    return (parseInt(split[1], 16) === check);
  };

  Parser.prototype.isValidSentence = function(str) {
    /**
     * 1. If not string: return false
     * 2. Trim string
     * 3. If empty: return false
     * 4. Check if first character of string is $ or !. If not; return false.
     * 5. Check if length-3 of string is *. If not; return false.
     * 5. Check checksum unless ignored, if checksum doesn't compute: return false.
     * 6. Return true
    **/

    if(!_.isString(str)) {
      return false;
    }

    str = str.trim();

    if(str === '') {
      return false;
    }

    if(str.charAt(0) !== '$' && str.charAt(0) !== '!') {
      return false; 
    }

    if(str.charAt(str.length - 3) !== '*') {
      return false; 
    }

    if(this.options.ignoreChecksum !== true && this.hasValidChecksum(str) === false) {
      return false;
    }

    return true;
  };

  Parser.prototype.transformValue = function(transform, value) {
    switch(transform) {
      case 'uppercase':
        return value.toUpperCase();
        break;

      case 'lowercase': 
        return value.toLowerCase();
        break;

      default:
        return value; 
        break;
    }
  }; 

  Parser.prototype.sentencePassesFilter = function(filter, values) {
    // Example filter:
    // uppercase:1 === A
    // where:
    // transformer:field operator match 

    var split, field, match, transform, type = -1;

    if(filter.indexOf(':') !== -1) {
      // store transformer in variable and remove from filter
      transform = filter.split(':')[0];
      filter = filter.replace(transform + ':', '');
    }

    if(filter.indexOf('==')) {
      // Equals filter
      split = filter.split('==');
      type = 0;
    }

    if(filter.indexOf('!=')) {
      // Doesn't equal filter
      split = filter.split('!=');
      type = 1;
    }

    if(filter.indexOf('>=')) {
      // Greater than or equal filter
      split = filter.split('>=');
      type = 2;
    }

    if(filter.indexOf('>')) {
      // Greater than filter
      split = filter.split('>');
      type = 3;
    }

    if(filter.indexOf('<=')) {
      // Smaller than or equal filter
      split = filter.split('<=');
      type = 4;
    }

    if(filter.indexOf('<')) {
      // Smaller than filter
      split = filter.split('<');
      type = 5;
    }

    field = split[0].trim();
    match = split[1].trim();

    if(field === '') {
      return true;
    }

    field = parseInt(field, 10);

    if(Number.isNaN(field)) {
      return true;
    }

    if(_.isString(transform) && transform.length > 0) {
      match = this.transformValue(transform.toLowerCase(), match);
    }

    switch(type) {
      case 0:
        if(values[field] !== match) {
          valid = false;
        }
        break;

      case 1:
        if(values[field] === match) {
          valid = false;
        }
        break;
        
      case 2:
        if(values[field] < match) {
          valid = false;
        }
        break;
        
      case 3: 
        if(values[field] <= match) {
          valid = false;
        }
        break;
        
      case 4: 
        if(values[field] > match) {
          valid = false;
        }
        break;
        
      case 5:
        if(values[field] >= match) {
          valid = false;
        }
        break;
    }

    return valid;
  };

  Parser.prototype.getValueFromFieldset = function(fieldset, values) {
    var value = null;
    var fields = [];

    switch(fieldset.type) {
      case 'magneticVariation':
        fieldset.field.forEach(function(index) {
          index = parseInt(index);
          fields.push(values[index]);
        });

        if(fields[0].trim() !== "") {
          value = utils.magneticVariaton.apply(utils, fields);
        }
        break;

      case 'datetime':
        var time = null;
        var date = null;

        fieldset.field.forEach(function(field) {
          if(field.type === 'time') {
            time = values[parseInt(field._Data)];
          }

          if(field.type === 'date') {
            date = values[parseInt(field._Data)];
          }
        });

        value = utils.timestamp(time, date);
        break;

      case 'coordinate':
        fieldset.field.forEach(function(index) {
          index = parseInt(index);
          fields.push(values[index]);
        });

        if(fields[0].trim() !== "") {
          value = utils.coordinate.apply(utils, fields);
        }
        break;
    }

    return value;
  };

  Parser.prototype.getValue = function(config, values) {
    if(_.isObject(config.fieldset)) {
      return this.getValueFromFieldset(config.fieldset, values);
    }

    var value = null;
    var transform = null;
    var index = parseInt(config.field._Data);
    var type = config.field.type.toLowerCase();

    if(config.field.transform) {
      transform = config.field.transform;
    }

    if(typeof utils[type] === 'function') {
      value = utils[type](values[index]);
    } else {
      value = values[index];
    }

    if(transform) {
      transform = transform.split('-');
      value = utils.transform(value, transform[0], transform[1]);
    }

    return value;
  };

  Parser.prototype.generateDelta = function(source, updates) {
    var result = {
      context: 'vessels.self',
      updates: []
    };

    var paths = {};

    // Build an intermediate data tree
    _.forEach(updates, function(value, path) {
      var components = path.split('/');
      components.shift();
      var last = components.pop();

      path = components.join('/');

      if(typeof paths[path] === 'undefined') {
        paths[path] = {};
      }

      paths[path][last] = value;
    });

    var update = {
      source: source,
      values: []
    };

    _.forEach(paths, function(data, path) {
      var keys = Object.keys(data).length;

      if(keys === 0) {
        // Path doesn't contain any data (no value or timestamp), so we can safely ignore it.
        return;
      }

      if(keys === 1 && Object.keys(data)[0] === 'timestamp') {
        // Path only contains a timestamp, but no value. Ignore as well.
        return;
      }

      if(typeof data.timestamp !== 'undefined') {
        update.timestamp = data.timestamp;
      }

      var value = "";

      if(typeof data.value !== 'undefined') {
        // Data contains a ".value" key. We don't loop over they keys as it'll only have one value.
        value = data.value;
      } else {
        // Data doesn't contain a ".value" key so we loop over the various keys.
        value = {};
        _.forEach(data, function(val, key) {
          if(key !== 'timestamp') {
            value[key] = val;
          }
        });
      }

      update.values.push({
        path: path.replace('/', '.'),
        value: value
      });
    });

    result.updates.push(update);
    return result;
  };

  Parser.prototype.parse = function(sentence) {
    // No need to check if we can slice and split the sentence, we already validated it.
    var type = sentence.substring(3, 6);
    var values = sentence.substring(7).split('*')[0].split(','); 
    var paths = lookup(type);
    var updates = {};
    var source = utils.source(type.toUpperCase());

    if(paths === null) {
      return null;
    }

    _.forEach(paths, function(config, path) {
      if(_.isObject(config.filter)) {
        if(!this.sentencePassesFilter(config.filter, values)) {
          return;
        }

        delete config.filter;
      }

      var value = this.getValue(config, values);

      if(value !== null) {
        updates[path] = value;
      }
    }.bind(this));

    return this.generateDelta(source, updates);
  };

  Parser.prototype._transform = function(chunk, encoding, next) {
    if(Buffer.isBuffer(chunk)) {
      chunk = chunk.toString();
    }

    if(this.isValidSentence(chunk)) {
      chunk = this.parse(chunk);

      if(chunk !== null) {
        this.push(chunk);
      }

      return next();
    }

    next();
  };

  module.exports = {
    Parser: Parser,
    parse: parseLine
  };

})();