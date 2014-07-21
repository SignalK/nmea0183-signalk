/* 
 * index.js - Transform Stream
 * 
 * @description 	This file contains the Transform Stream that acts upon incoming data. It serves as the central 
 * 					controller of the parser. ATM it still makes a line out of a sentence, validates it, and decodes it. 
 * 					That functionality should however be abstracted away and moved to NMEA0183.js. 
 * 
 * @repository 		https://github.com/signalk/nmea-signalk
 * @author 			Fabian Tollenaar <fabian@starting-point.nl>
 *
 * @todo			Move _validSentence, _lineData etc methods to NMEA0183.js
 * @todo			Make this Transform stream more abstract, so it can easily be used in different parsers.
 * 
 * 
 *
 * Copyright 2014, Fabian Tollenaar
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
 *
 */

var Transform 	= require('stream').Transform;
var util 		= require('util');
var _ 			= require('lodash');
var codecs 		= require('../codecs');
var error 		= require('./errors');

function Parser(opts) {
	// Allow the parser to be used as a function.
	if(!(this instanceof Parser)) return new Parser(opts);

	var options = opts || {};

	if(!options.stream) {
		options.stream = {};
	}

	if(!options.vessel) {
		options.vessel = {};
	}

	if(!options.debug) {
		options.debug = false;
	}

	options.stream.objectMode = true;

	Transform.call(this, options.stream);

	this._codecs 			= options.codecs || require('../codecs');
	this._linesParsed 		= 0;
	this._linesProcessed 	= 0;
	this._options 			= options;
	this._lineBuffer	 	= "";
}

util.inherits(Parser, Transform);

Parser.prototype._validSentence = function(sentence) {
	sentence = sentence.trim();
	if(sentence === "") return false;

	if((sentence.charAt(0) == '$' || sentence.charAt(0) == '!') && sentence.charAt(sentence.length - 3) == '*') {
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
	var split 	= sentence.split('*');
	var raw 	= split[0].slice(1, (split[0].length - 1));
	var values 	= raw.split(',');
	var data 	= { instrument: values[0].slice(0, 2), type: values[0].slice(-3), values: [] };

	for(var i = 1; i < values.length; i++) {
		data.values.push(values[i]);
	}

	return data;
}

Parser.prototype._decode = function(data, line) {
	if(typeof codecs[data.type.toUpperCase()] !== 'undefined') {
		var codec = codecs[data.type.toUpperCase()];
		return codec.decode(data.values, this._options.vessel, line);
	}
}

Parser.prototype._transform = function(chunk, encoding, done) {
	if(Buffer.isBuffer(chunk)) chunk = chunk.toString();

	var self = this;

	this._lineBuffer += chunk;

	if(this._lineBuffer.indexOf('\r\n') !== -1 || (this._lineBuffer.indexOf('\r\n') === -1 && this._lineBuffer.indexOf('$') !== -1 && this._lineBuffer.indexOf('*') !== -1)) {
		var split 		= this._lineBuffer.split('\r\n');
		var unfinished 	= "";
		var lines 		= [];

		_.each(split, function(line) {
			line = line.trim();

			if(line !== '') {
				if(line.charAt(0) == '$' || line.charAt(0) == '!') {
					if(line.charAt(line.length - 3) == '*') {
						// we have a full line
						lines.push(line);
					} else {
						unfinished = line;
					}
				} else {
					unfinished += line;
				}
			}

			if(unfinished.trim() != '' && (unfinished.charAt(0) == '$' || unfinished.charAt(0) == '!') && unfinished.charAt(unfinished.length - 3) == '*') {
				// Unfinished is a full line
				lines.push(unfinished);
			}
		});

		_.each(lines, function(line) {
			if(self._validSentence(line)) {
				var data = self._lineData(line);
				var signal = self._decode(data, line);

				// Internal counter counting lines that were processed
				self._linesProcessed++;

				if(signal) {
					// Internal counter counting lines that were actually parsed. 
					// Lines that weren't parsed are either of an unsupported type (see codecs) or VOID.
					self._linesParsed++;
					self.emit.call(self, 'sentence', signal, self._linesParsed, self._linesProcessed);
					self.push.call(self, signal);
				}
			}
		});

		if(split[split.length - 1].charAt(0) == '$' && split[split.length - 1].charAt(split[split.length - 1].length - 3) !== '*') {
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

function parseLine(line, cb, _vessel, _debug) {
	var parser 	= new Parser({
		vessel: _vessel || {},
		debug: _debug || false
	});

	parser.on('sentence', function(signal) { 
		cb(signal); 
		return parser.end();
	});

	parser.write(line);
};

module.exports = {
	Parser: Parser,
	parse: parseLine
};