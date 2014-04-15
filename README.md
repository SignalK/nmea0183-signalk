nmea0183-signalk
================

NMEA0183 to Signal K (signalk.github.io) Parser. Vaguely inspired by jamesp/node-nmea.


Capabilities
------------

1. Usage from CLI:
	a. Supports data piped in from another process (e.g. `tail -n 100 | nmea-signalk`)
	b. Supports file input (with an NMEA0183 sentence on each line)
	c. Supports serial input
	d. Supports single line input (TODO)

	When using the parser as a CLI program, it will output a JSON encoded Signal K object on each line on `stdout`.

2. Used as `node.js` module
	a. Forked mode: fork a parser in another process, and the parser will send parsed Signal K objects using `process.send()` (available in the parent process using `fork.on('message', function(data) {})`).
	b. `require`'ed mode: parser is available as a Transform Stream, ready to accept any streamed input. 

3. Notes
	a. Parser output (via whatever method) is always a full spec-compatible Signal K JSON object
	b. If the parser receives conflicting input (e.g. a new version of a GLL sentence) the conflict is automatically resolved using the timestamps.


TODO
----
- [ ] Fix various TODO's in the source files
- [ ] Write tests
- [ ] Write documentation
- [ ] Publish to NPM when done
- [ ] Add more codecs.


Acknowledgements 
---------------

Special thanks to @jamesp for his hard work on node-nmea, whose work somewhat inspired the codecs in this parser.