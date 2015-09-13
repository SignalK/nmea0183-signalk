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
    let check = 0;
    let split = str.split('*');

    for (let i = 1; i < split[0].length; i++) {
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
    let field = parseInt(filter.field);
    let match = filter.value._Data;
    let valid = true;

    if(_.isString(filter.value.transform)) {
      match = this.transformValue(filter.value.transform.toLowerCase(), match);
    }

    switch(filter.type) {
      case 'unless':
        if(values[field] === match) {
          valid = false;
        }
        break;

      // Default is IF
      default:
        if(values[field] !== match) {
          valid = false;
        }
        break;
    }

    return valid;
  };

  Parser.prototype.getValueFromFieldset = function(fieldset, values) {
    let value = null;
    let fields = [];

    switch(fieldset.type) {
      case 'magneticVariation':
        fieldset.field.forEach((index) => {
          index = parseInt(index);
          fields.push(values[index]);
        });

        if(fields[0].trim() !== "") {
          value = utils.magneticVariaton.apply(utils, fields);
        }
        break;

      case 'datetime':
        let time = null;
        let date = null;

        fieldset.field.forEach((field) => {
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
        fieldset.field.forEach((index) => {
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

    let value = null;
    let transform = null;
    let index = parseInt(config.field._Data);
    let type = config.field.type.toLowerCase();

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
    let result = {
      context: 'vessels.self',
      updates: []
    };

    let paths = {};

    // Build an intermediate SK tree
    _.forEach(updates, (value, path) => {
      let components = path.split('/');
      components.shift();
      let last = components.pop();

      path = components.join('/');

      if(typeof paths[path] === 'undefined') {
        paths[path] = {};
      }

      paths[path][last] = value;
    });

    _.forEach(paths, (data, path) => {
      let keys = Object.keys(data).length;

      if(keys === 0) {
        return;
      }

      if(keys === 1 && Object.keys(data)[0] === 'timestamp') {
        return;
      }

      let update = {
        source: source,
        values: []
      };

      if(typeof data.timestamp !== 'undefined') {
        update.timestamp = data.timestamp;
      }

      _.forEach(data, (val, key) => {
        if(key !== 'timestamp') {
          update.values.push({
            path: path.replace('/', '.') + '.' + key,
            value: val
          });
        }
      });

      result.updates.push(update);
    });

    return result;
  };

  Parser.prototype.parse = function(sentence) {
    // No need to check if we can slice and split the sentence, we already validated it.
    let type = sentence.substring(3, 6);
    let values = sentence.substring(7).split('*')[0].split(','); 
    let paths = lookup(type);
    let updates = {};
    let source = utils.source(type.toUpperCase());

    if(paths === null) {
      return null;
    }

    _.forEach(paths, (config, path) => {
      if(_.isObject(config.filter)) {
        if(!this.sentencePassesFilter(config.filter, values)) {
          return;
        }

        delete config.filter;
      }

      let value = this.getValue(config, values);

      if(value !== null) {
        updates[path] = value;
      }
    });

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