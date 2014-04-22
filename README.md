nmea0183-signalk
================

NMEA0183 to Signal K (signalk.github.io) Parser.


USAGE EXAMPLE
-------------

*(Only here for the time being, until proper documentation has been written)*


**Single line mode**

```
$ nmea-signalk --line '$GPRMC,085411.000,A,5222.3215,N,00454.5778,E,0.58,251.34,030414,,,A*63'
$
// OUTPUT EXAMPLE:
// {"courseOverGroundTrue":{"source":{"type":"NMEA0183","sentence":"RMC","device":"nmea-signalk"},"timestamp":"2014-05-03T08:54:11.000Z","value":251.34},"location":{"latitude":52.372025,"longitude":4.90963,"source":{"type":"NMEA0183","sentence":"RMC","device":"nmea-signalk"},"timestamp":"2014-05-03T08:54:11.000Z"},"magneticVariaton":{"source":{"type":"NMEA0183","sentence":"RMC","device":"nmea-signalk"},"timestamp":"2014-05-03T08:54:11.000Z","value":0},"speedOverGround":{"source":{"type":"NMEA0183","sentence":"RMC","device":"nmea-signalk"},"timestamp":"2014-05-03T08:54:11.000Z","value":0.58}}
```


**Usage in piped mode**

```
$ tail -n 1000 gps.log | nmea-signalk
$
// OUTPUT EXAMPLE:
// {"gnss":{"source":{"type":"NMEA0183","sentence":"GGA","device":"nmea-signalk"},"timestamp":"2014-05-15T09:14:00.000Z","quality":1,"satellites":8,"antennaAltitude":1,"horizontalDilution":0,"geoidalSeparation":47,"differentialAge":0,"differentialReference":0},"position":{"source":{"type":"NMEA0183","sentence":"GGA","device":"nmea-signalk"},"timestamp":"2014-05-15T09:14:00.000Z","longitude":52.3719,"latitude":4.909741666666667}}
// [...]
```


**Usage with file input**

```
$ nmea-signalk -f gps.log
$
// OUTPUT EXAMPLE:
// {"gnss":{"source":{"type":"NMEA0183","sentence":"GGA","device":"nmea-signalk"},"timestamp":"2014-05-15T09:14:00.000Z","quality":1,"satellites":8,"antennaAltitude":1,"horizontalDilution":0,"geoidalSeparation":47,"differentialAge":0,"differentialReference":0},"position":{"source":{"type":"NMEA0183","sentence":"GGA","device":"nmea-signalk"},"timestamp":"2014-05-15T09:14:00.000Z","longitude":52.3719,"latitude":4.909741666666667}}
// [...]
```


**Usage with serial input**

```
$ nmea-signalk --serial /dev/USB0
$
// OUTPUT EXAMPLE:
// {"gnss":{"source":{"type":"NMEA0183","sentence":"GGA","device":"nmea-signalk"},"timestamp":"2014-05-15T09:14:00.000Z","quality":1,"satellites":8,"antennaAltitude":1,"horizontalDilution":0,"geoidalSeparation":47,"differentialAge":0,"differentialReference":0},"position":{"source":{"type":"NMEA0183","sentence":"GGA","device":"nmea-signalk"},"timestamp":"2014-05-15T09:14:00.000Z","longitude":52.3719,"latitude":4.909741666666667}}
// [...]
```


**Usage as module**

```javascript
var Parser = require('nmea0183-signalk').Parser;
var parser = new Parser({ 
	debug: false, 
	vessel: require('./vessel.json') 
});

someinputstream.pipe(parser);

parser.on('sentence', function(signalk, lineno) {
	// do something with signalK object
}); 
```


**Usage with --debug specified**

```
$ tail -n 10000 gps.log | nmea-signalk --debug
$
/*
 SENTENCE #5741
 {
    "courseOverGroundTrue": {
        "source": {
            "type": "NMEA0183",
            "sentence": "RMC",
            "device": "nmea-signalk"
        },
        "timestamp": "2014-05-03T09:14:11.000Z",
        "value": 28.17
    },
    "location": {
        "latitude": 52.371901666666666,
        "longitude": 4.90974,
        "source": {
            "type": "NMEA0183",
            "sentence": "RMC",
            "device": "nmea-signalk"
        },
        "timestamp": "2014-05-03T09:14:11.000Z"
    },
    "magneticVariaton": {
        "source": {
            "type": "NMEA0183",
            "sentence": "RMC",
            "device": "nmea-signalk"
        },
        "timestamp": "2014-05-03T09:14:11.000Z",
        "value": 0
    },
    "speedOverGround": {
        "source": {
            "type": "NMEA0183",
            "sentence": "RMC",
            "device": "nmea-signalk"
        },
        "timestamp": "2014-05-03T09:14:11.000Z",
        "value": 0.18
    }
}
*/
```

Capabilities
------------

1. Usage from CLI:
	a. Supports data piped in from another process (e.g. `tail -n 100 | nmea-signalk`)
	b. Supports file input (with an NMEA0183 sentence on each line)
	c. Supports serial input
	d. Supports single line input

	When using the parser as a CLI program, it will output a JSON encoded Signal K object on each line on `stdout`.

2. Used as `node.js` module
	a. Forked mode: fork a parser in another process, and the parser will send parsed Signal K objects using `process.send()` (available in the parent process using `fork.on('message', function(data) {})`).
	b. `require`'ed mode: parser is available as a Transform Stream, ready to accept any streamed input. 

3. Notes
	a. Parser output (via whatever method) is always a full spec-compatible Signal K JSON object
	b. If the parser receives conflicting input (e.g. a new version of a GLL sentence) the conflict is automatically resolved using the timestamps.


TODO
----
- [ ] Add more codecs.
- [ ] Fix various TODO's and FIXME's in the source files
- [ ] ADD BETTER ERROR HANDLING (!!)
- [ ] Write tests using Tape (!!)
- [ ] Write documentation
- [ ] Publish to NPM

Acknowledgements 
---------------

Special thanks to [@jamesp](https://github.com/jamesp) for his hard work on node-nmea, as his work somewhat inspired the codecs in this parser. Even if the codecs look quite different, we wouldn't have gotten to this point without him!