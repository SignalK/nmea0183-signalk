/* 
 * Mode: Fork
 * 
 * @repository 		https://github.com/signalk/nmea-signalk
 * @author 			Fabian Tollenaar <fabian@starting-point.nl>
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

"use strict";

var error = require('./errors');
var fork;

module.exports = fork = function(argv, vessel, debug) {
	var NMEA0183Parser = require('../lib');
	var Parser 	= NMEA0183Parser.Parser;
	var parse 	= NMEA0183Parser.parse;

	var parser = new Parser({
		debug: debug,
		vessel: vessel
	});

	if(argv.serial !== null && argv.baudrate !== null) {
		var serialport = require('serialport').SerialPort;
		
		var stream = new serialport(argv.serial, {
			baudrate: argv.baudrate
		}, false);

		stream.on('error', function(err) {
			if(debug === true) {
				console.log("SERIALPORT ERROR", err);
				console.log('');
			}
		});

		return stream.open(function(err) {
			if(err) {
				if(debug === true) {
					console.log("SERIALPORT ERROR", err);
					console.log('');
				}

				return;
			}

			if(debug === true) {
				console.log('Listening to', argv.serial, 'at baudrate:', argv.baudrate);
			}

			parser.on('error', function(err) {
				if(debug === true) {
					console.log("PARSER ERROR", err);
					console.log('');
				}
			});

			parser.on('sentence', function(data, no, total) {
				if(debug === true) {
					console.log('SENTENCE #' + no + " of " + total + "\n", JSON.stringify(data, null, 4));
					console.log('');
				}

				if(typeof process.send === 'function') {
					process.send(data);
				}
			});

			stream.pipe(parser);
		});
	}

	if(argv.file !== null) {
		var fs = require('fs');
		var path = require('path');

		if(debug === true) {
			console.log('Reading file', path.normalize(process.cwd() + '/' + argv.file));
		}

		var stream = fs.createReadStream(path.normalize(process.cwd() + '/' + argv.file));

		stream.on('error', function(err) {
			if(debug === true) {
				console.log("FILE READ ERROR", err);
				console.log('');
			}

			return;
		});

		parser.on('sentence', function(data, no, total) {
			if(debug === true) {
				console.log('SENTENCE #' + no + " of " + total + "\n", JSON.stringify(data, null, 4));
				console.log('');
			}

			if(typeof process.send === 'function') {
				process.send(data);
			}
		});

		return stream.pipe(parser);
	}

	if(argv.line !== null) {
		return parse(argv.line, function(data) {
			if(debug === true) {
				console.log('SENTENCE #' + no + " of #" + total + "\n", JSON.stringify(data, null, 4));
				console.log('');
			} else {
				console.log(JSON.stringify(data));
			}
		});
	}
}