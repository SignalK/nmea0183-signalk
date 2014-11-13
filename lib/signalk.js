var _ 			   = require('lodash');
var merge 		 = require('signalk-merge');
var uuid       = require('node-uuid').v4;

module.exports = function(selfIdType, selfId) {
	function createSignalK(selfID, IDtype, version, groups, _resources) {
		var obj, vessels, source;

		source = {
			type: "NMEA0183",
			label: "signalk/signalk-parser-nmea0183"
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

		if(_resources !== null && typeof _resources === 'object') {
			obj.resources = _resources;
		}

		return obj;
	}

	var selfID = selfId || String(uuid().split('-')[0]);
	var IDType = selfIdType || 'uuid';

	signalk = {
		_last: null, 
		_current: null,
		version: 1,

		multiple: function(groups, resources) {
			signalk.version++;

			var next = createSignalK(selfID, IDType, signalk.version, groups, resources);

			if(signalk._current === null) {
				signalk._current = next;
			}

			signalk._last = _.clone(signalk._current, true);

			if(!_.isEqual(signalk._last, next)) {
				signalk._current = merge.full(signalk._last, next);
			}

			return signalk._current;
		}, 

		navigation: function(data) {
			signalk.version++
			var next = createSignalK(selfID, IDType, signalk.version, { navigation: data });
			
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
			var next = createSignalK(selfID, IDType, signalk.version, { environmental: data });
			
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
			var next = createSignalK(selfID, IDType, signalk.version, { communication: data });
			
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

	return signalk;
}