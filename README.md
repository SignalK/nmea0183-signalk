nmea-signalk
============

NMEA0183 to Signal K (signalk.github.io) Parser. Heavily inspired by jamesp/node-nmea.


goals
-----

1. Used from CLI:
	a. Support data piped in from another process
	b. Support for file input (assume each line is a NMEA sentence)
	c. Verbose mode (print output to console)

2. Used as module
	a. Should work as a writeable stream, allowing a serial stream of NMEA data or a file stream to go in. 
	b. But it should also be able to parse indiviudual lines

3. Output
	a. Output is always a full spec-compatible Signal K JSON object
	b. Merging of data into the K object with automatic conflict resolving based on timestamp
	c. Output either through `process.send`, Stdout or stream.


Acknowledgements 
---------------

Special thanks to @jamesp for his hard work on node-nmea, which heavily inspired the parsing part of this module.