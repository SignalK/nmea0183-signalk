# signalk-parser-nmea0183
[![Build Status](https://travis-ci.org/SignalK/signalk-parser-nmea0183.svg?branch=development)](https://travis-ci.org/SignalK/signalk-parser-nmea0183)

A node.js/javascript parser of NMEA0183 sentences. Sentences are parsed to [Signal K delta](http://signalk.org/specification/master/data_model.html#delta-format) format.


### Supported sentences

- [x] ALK
- [ ] APB
- [x] DBT
- [x] GGA
- [x] GLL
- [x] HDG
- [x] HDM
- [x] HDT
- [x] MTW
- [x] MWV
- [x] RMC
- [x] ROT
- [x] RPM
- [x] VDM
- [x] VDO
- [x] VDR
- [x] VHW
- [x] VPW
- [x] VTG
- [x] VWR


### Todo

- [x] Sentence support (parity with old parser)
- [x] Tests for every sentence
- [x] Stream interface
- [x] Tests for the stream interface
- [x] Update readme
- [ ] Include (optional?) parsing to full Signal K format
- [ ] Extend sentence support beyond current set


### Usage

```javascript
const Parser = require('signalk-parser-nmea0183')
const parser = new Parser()

parser.on('error', error => {
  console.error(`[error] ${error.message}`)
})

parser.on('warning', warning => {
  console.warn(`[warning] ${warning.message}`)
})

parser.on('signalk:delta', delta => {
  console.log(`[delta] ${JSON.stringify(delta, null, 2)}`)
})

// Individual sentence
parser.parse('$SDDBT,17.0,f,5.1,M,2.8,F*3E')

// Streams
const stream = parser.stream()
someInputStreamOfSentences.pipe(parser.stream) // piping
stream.write('$SDDBT,17.0,f,5.1,M,2.8,F*3E') // manual writing

stream.on('data', result => {
  // do something with result.delta
  // result.full is, as of this writing, not present
})
```


### NMEA0183v4 tag blocks

This parser has limited support of [NMEA0183v4 tag blocks](http://www.nmea.org/Assets/may%2009%20rtcm%200183_v400.pdf) (e.g. `\s:airmar dst800,c:1438489697*13\$SDDBT,17.0,f,5.1,M,2.8,F*3E`). 
Keep in mind that, since NMEA uses the backslash `\` as the start and end character of the tag block, you need to escape these characters *before* parsing them. 
This is necessary because javascript treats the backslash as the escape character causing it not to be included in the resulting string (unless escaped). 

Example: 

```javascript
const Parser = require('signalk-parser-nmea0183')
const parser = new Parser()

parser.on('error', error => {
  console.error(`[error] ${error.message}`)
})

parser.on('warning', warning => {
  console.warn(`[warning] ${warning.message}`)
})

parser.on('signalk:delta', delta => {
  console.log(`[delta] ${JSON.stringify(delta, null, 2)}`)
})

parser.parse('\\s:airmar dst800,c:1438489697*13\\$SDDBT,17.0,f,5.1,M,2.8,F*3E')
```

**Note:** *at this time, the checksum of the tag block (`c:1438489697*13`) is not validated.*


### License 

```
Copyright 2016/2017 Signal K and Fabian Tollenaar <fabian@signalk.org>.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```