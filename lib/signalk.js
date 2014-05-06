/* 
 * Signal K
 * 
 * @description		This file contains an object with functions for every group of the specificiation. When ever an object 
 * 					is added to a group using the functions, the function should:
 * 					- check the existing objects in the group
 * 					- overwrite conflicts if timestamp is newer
 * 					- mix different values. 
 * 					- return a full object - including other groups.
 *
 * @repository 		https://github.com/signalk/nmea-signalk
 * @author 			Fabian Tollenaar <fabian@starting-point.nl>
 * 
 * @todo 			Add a function to compare objects and their timestamps, return the newer object
 * @todo 			function to easily merge the different groups into a signal K object
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

var error = require('./errors');
var _ = require('lodash');
var merge = require('signalk-merge');

function createSignalK(selfID, IDtype, version, groups) {
	var obj, vessels, source;

	source = {
		type: "NMEA0183",
		label: "signalk/nmea-signalk"
	};

	vessels = {};
	vessels[selfID] = {
		source: source,
		timestamp: (new Date().toISOString())
	};

	if(IDtype === 'mmsi') {
		vessels[selfID].mmsi = selfID;
	} else {
		vessels[selfID].uuid = selfID;
	}

	_.each(groups, function(val, key) {
		vessels[selfID][key] = val;
	});

	obj = {
		self: selfID,
		vessels: vessels,
		version: version + ".0",
		timestamp: (new Date().toISOString()),
		source: source
	};

	return obj;
}

var selfID = 'a34af45a';

module.exports = signalk = {
	_last: null, 
	_current: null,
	version: 1,

	navigation: function(data) {
		signalk.version++
		var next = createSignalK(selfID, 'uuid', signalk.version, { navigation: data });
		
		if(signalk._current === null) {
			signalk._current = next;
		}

		signalk._last = _.clone(signalk._current, true);

		if(!_.isEqual(signalk._last, next)) {
			signalk._current = merge.full(signalk._last, next);
		}

		return signalk._current;
	},

	environmental: function(data) {
		signalk.version++
		var next = createSignalK(selfID, 'uuid', signalk.version, { environmental: data });
		
		if(signalk._current === null) {
			signalk._current = next;
		}

		signalk._last = _.clone(signalk._current, true);

		if(!_.isEqual(signalk._last, next)) {
			signalk._current = merge.full(signalk._last, next);
		}
		
		return signalk._current;	
	},

	communication: function(data) {
		signalk.version++
		var next = createSignalK(selfID, 'uuid', signalk.version, { communication: data });
		
		if(signalk._current === null) {
			signalk._current = next;
		}

		signalk._last = _.clone(signalk._current, true);

		if(!_.isEqual(signalk._last, next)) {
			signalk._current = merge.full(signalk._last, next);
		}
		
		return signalk._current;
	}
};