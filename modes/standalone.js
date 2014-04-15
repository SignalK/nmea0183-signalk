/* 
 * Mode: Standalone
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

var standalone;

module.exports = standalone = function(argv, vessel, debug) {
	var NMEA0183Parser = require('../lib');
	var Parser = NMEA0183Parser.Parser;
	var parse = NMEA0183Parser.parse;

	var parser = new Parser({
		// codecs: require('../codecs'),
		debug: debug,
		vessel: vessel
	});

	if(argv.serial !== null && argv.baudrate !== null) {
		var serialport = require('serialport').SerialPort;
		
		if(debug === true) {
			console.log('Listening to', argv.serial, 'at baudrate:', argv.baudrate);
		}

		var stream = new serialport(argv.serial, {
			baudrate: argv.baudrate
		});
		
		//*
		stream.pipe(parser);

		parser.on('sentence', function(data, no, total) {
			if(debug === true) {
				console.log('SENTENCE #' + no + " of #" + total + "\n", JSON.stringify(data, null, 4));
				console.log('');
			} else {
				console.log(JSON.stringify(data));
			}
		});
		//*/

		return;
	}

	if(argv.file !== null) {
		var fs = require('fs');
		var path = require('path');

		if(debug === true) {
			console.log('Reading file', path.normalize(process.cwd() + '/' + argv.file));
		}

		var stream = fs.createReadStream(path.normalize(process.cwd() + '/' + argv.file));
		
		stream.pipe(parser);

		parser.on('sentence', function(data, no, total) {
			if(debug === true) {
				console.log('SENTENCE #' + no + " of #" + total + "\n", JSON.stringify(data, null, 4));
				console.log('');
			} else {
				console.log(JSON.stringify(data));
			}
		});

		return;
	}

	if(argv.line !== null) {
		parse(argv.line, function(data) {
			if(debug === true) {
				console.log('SENTENCE', JSON.stringify(data, null, 4));
				console.log('');
			} else {
				console.log(JSON.stringify(data));
			}
		});
	}
};