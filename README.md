# signalk-parser-nmea0183
[![Build Status](https://travis-ci.org/SignalK/signalk-parser-nmea0183.svg?branch=development)](https://travis-ci.org/SignalK/signalk-parser-nmea0183)


A node.js/javascript parser of NMEA0183 sentences. This is a newer, more light-weight version of the parser in active development.


### Supported sentences

- [x] DBT
- [ ] `@TODO`


### Installation and use

```
@TODO
```


### NMEA0183v4 tag blocks

This parser has limited support of [NMEA0183v4 tag blocks](http://www.nmea.org/Assets/may%2009%20rtcm%200183_v400.pdf) (e.g. `\s:airmar dst800,c:1438489697*13\$SDDBT,17.0,f,5.1,M,2.8,F*3E`). 
Keep in mind that, since NMEA uses the backslash `\` as the start and end character of the tag block, you need to escape these characters *before* parsing them. 
This is necessary because javascript, like many, many other languages, treats the backslash as the escape character causing it not to be included in the resulting string unless escaped. 
Example: `\\s:airmar dst800,c:1438489697*13\\$SDDBT,17.0,f,5.1,M,2.8,F*3E`.


### License 

```
Copyright 2016 Signal K and Fabian Tollenaar <fabian@signalk.org>.

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