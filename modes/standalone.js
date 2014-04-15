/* 
 * Mode: Standalone
 * 
 * @repository 		https://github.com/signalk/nmea-signalk
 * @author 			Fabian Tollenaar <fabian@starting-point.nl>
 *
 * @todo			Add stuff when input is a single line. 
 *					Relates to the todo at the end of lib/index.js
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
	var Parser = require('../lib').Parser;

	var parser = new Parser({
		codecs: require('../codecs'),
		debug: debug,
		vessel: vessel
	});

	if(argv.serial !== null && argv.baudrate !== null) {
		var serialport = require('serialport');
		var stream = new serialport(argv.serial, {
			baudrate: argv.baudrate
		});

		stream.pipe(parser);

		parser.on('sentence', function(data, no) {
			if(debug === true) {
				console.log('SENTENCE #' + no + "\n", JSON.stringify(data, null, 4));
				console.log('');
			} else {
				console.log(JSON.stringify(data));
			}
		});

		return;
	}

	if(argv.file !== null) {
		var fs = require('fs');
		var path = require('path');

		var stream = fs.createReadStream(path.normalize(__dirname + '/' + argv.file));
		
		stream.pipe(parser);

		parser.on('sentence', function(data, no) {
			if(debug === true) {
				console.log('SENTENCE #' + no + "\n", JSON.stringify(data, null, 4));
				console.log('');
			} else {
				console.log(JSON.stringify(data));
			}
		});

		return;
	}

	if(argv.line !== null) {
		// Parse single line
		return;
	}
};