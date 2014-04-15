/* 
 * Mode: Piped
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

var pipe;

module.exports = pipe = function(argv, vessel, debug) {
	var Parser = require('../lib').Parser;

	var parser = new Parser({
		// codecs: require('../codecs'),
		debug: debug,
		vessel: vessel
	});

	process.stdin.pipe(parser);

	parser.on('sentence', function(data, no) {
		if(debug === true) {
			console.log('SENTENCE #' + no + "\n", JSON.stringify(data, null, 4));
			console.log('');
		} else {
			console.log(JSON.stringify(data));
		}
	});
}