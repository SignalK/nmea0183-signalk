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

	this._codecs 		= options.codecs || require('../codecs');
	this._linesParsed 	= 0;
	this._options 		= options;
}

util.inherits(Parser, Transform);

Parser.prototype._validSentence = function(sentence) {
	sentence = sentence.trim();
	if(sentence === "") return false;

	var check = 0;
    var split = sentence.split('*');

    for (var i = 1; i < split[0].length; i++) {
        check = check ^ split[0].charCodeAt(i);
    };

    return (parseInt(split[1], 16) == check);
}

Parser.prototype._lineData = function(sentence) {
	var split 	= sentence.split('*');
	var raw 	= split[0].replace('$', '');
	var values 	= raw.split(',');
	var data 	= { instrument: values[0].slice(0, 2), type: values[0].slice(-3), values: [] };

	for(var i = 1; i < values.length; i++) {
		data.values.push(values[i]);
	}

	return data;
}

Parser.prototype._encode = function(data) {
	if(typeof codecs[data.type.toUpperCase()] !== 'undefined') {
		var codec = codecs[data.type.toUpperCase()];
		return codec.decode(data.values, this._options.vessel);
	};
}

Parser.prototype._transform = function(chunk, encoding, done) {
	if(Buffer.isBuffer(chunk)) chunk = chunk.toString();
	
	var self = this;
	var lines = chunk.split("\r\n");

	_.each(lines, function(sentence) {
		if(self._validSentence(sentence)) {
			++self._linesParsed;
			
			var data 	= self._lineData(sentence);
			var signal  = self._encode(data);

			if(signal) {
				self.emit.apply(self, [ 'sentence', signal, self._linesParsed ]);
				self.push.call(self, signal);
			}
		}
	});

	return done();
}

Parser.prototype._flush = function(done) {
	return done();
}

module.exports = {
	Parser: Parser,
	//parse: @TODO: utility function that parses given input and returns parsed object.
};