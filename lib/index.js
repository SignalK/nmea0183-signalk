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

var Transform = require('stream').Transform;
var util = require('util');
var _ = require('lodash');
var codecs = require('../codecs');
var debug = require('debug')('signalk-parser-nmea0183');
var uuid = require('uuid').v4;
var Multiplexer = require('signalk-multiplexer');

function Parser(opts) {
  if (!(this instanceof Parser)) {
    return new Parser(opts);
  }

  var self = this;
  var options = opts || {};

  if (!options.stream) {
    options.stream = {};
  }

  options.stream.objectMode = true;
  Transform.call(this, options.stream);

  this._linesParsed = 0;
  this._linesProcessed = 0;
  this._options = options;
  this._lineBuffer = "";
  this.self = {};
  this.self.id = this._options.selfId || String(uuid().split('-')[0]).toUpperCase();
  this.self.type = this._options.selfType || 'uuid';

  this._multiplexer = new Multiplexer(this.self.id, this.self.type);
  this._multiplexer.aisSession = {};
  this._codecs = require('../codecs');

  this._multiplexer.on('change', function() {
    if (self.listeners('sentence').length > 0 ||
      self.listeners('signalk').length > 0 ||
      self.listeners('data').length > 0) {
      var data = self._multiplexer.retrieve();

      self.emit('sentence', data, self._linesParsed, self._linesProcessed);
      self.emit('signalk', data, self._linesParsed, self._linesProcessed);
      self.push(data);
    }
  });

  this._multiplexer.on('change:delta', function(delta) {
    self.emit('delta', delta, self._linesParsed, self._linesProcessed);
  });
}

util.inherits(Parser, Transform);

Parser.prototype._validSentence = function(sentence) {
  sentence = String(sentence).trim();

  if (sentence === "") {
    return false;
  }

  if ((sentence.charAt(0) == '$' || sentence.charAt(0) == '!') && sentence.charAt(sentence.length - 3) == '*') {
    var check = 0;
    var split = sentence.split('*');

    for (var i = 1; i < split[0].length; i++) {
      check = check ^ split[0].charCodeAt(i);
    };

    return (parseInt(split[1], 16) == check);
  } else {
    return false;
  }
}

Parser.prototype._lineData = function(sentence) {
  this.emit('nmea0183', sentence);
  var split = sentence.split('*');
  var raw = split[0].slice(1);
  var values = raw.split(',');

  if (values[0][0] == "P") {
    var data = {
      instrument: values[0].slice(0, 4),
      type: values[0].slice(-3),
      values: []
    };
  } else if (values[0] == "STALK") {
    var data = {
      instrument: "seatalk",
      type: values[0],
      values: []
    };
  } else {
    var data = {
      instrument: values[0].slice(0, 2),
      type: values[0].slice(-3),
      values: []
    };
  }


  for (var i = 1; i < values.length; i++) {
    data.values.push(values[i]);
  }

  return data;
}

Parser.prototype._decode = function(data, line) {
  if (typeof codecs[data.type.toUpperCase()] !== 'undefined') {
    try {
      return codecs[data.type.toUpperCase()].decode(this._multiplexer, data, line);
    } catch (error) {
      debug("Error parsing " + line);
    }
  }
}

Parser.prototype._transform = function(chunk, encoding, done) {
  if (Buffer.isBuffer(chunk)) {
    chunk = chunk.toString();
  }

  var self = this;

  this._lineBuffer += chunk;
  this._lineBuffer = this._lineBuffer.replace(/\\r\\n/g, "\n");

  if (this._lineBuffer.indexOf('\n') !== -1 || (this._lineBuffer.indexOf('\n') === -1 && this._lineBuffer.indexOf('$') !== -1 && this._lineBuffer.indexOf('*') !== -1)) {
    var split = this._lineBuffer.split('\n');
    var unfinished = "";
    var lines = [];

    _.each(split, function(line) {
      line = line.trim();

      if (line !== '') {
        if (line.charAt(0) == '$' || line.charAt(0) == '!') {
          if (line.charAt(line.length - 3) == '*') {
            // we have a full line
            lines.push(line);
          } else {
            unfinished = line;
          }
        } else {
          unfinished += line;
        }
      }

      if (unfinished.trim() != '' && (unfinished.charAt(0) == '$' || unfinished.charAt(0) == '!') && unfinished.charAt(unfinished.length - 3) == '*') {
        // Unfinished is a full line
        lines.push(unfinished);
      }
    });

    _.each(lines, function(line) {
      if (self._validSentence(line)) {
        var data = self._lineData(line);
        var valid = self._decode(data, line);

        // Internal counter counting lines that were processed
        self._linesProcessed++;

        if (valid) {
          // Internal counter counting lines that were actually parsed.
          // Lines that weren't parsed are either of an unsupported type (see codecs) or VOID.
          self._linesParsed++;
        }
      }
    });

    if (split[split.length - 1].charAt(0) == '$' && split[split.length - 1].charAt(split[split.length - 1].length - 3) !== '*') {
      this._lineBuffer = split[split.length - 1];
    } else {
      this._lineBuffer = "";
    }
  }

  return done();
}

Parser.prototype._flush = function(done) {
  return done();
}

function parseLine(line, cb, opts) {
  var parser = new Parser(opts);

  parser.on('sentence', function(signal) {
    cb(null, signal);
    parser.end();
    parser = undefined;
  });

  parser.write(line);
};

module.exports = {
  Parser: Parser,
  parse: parseLine
};
