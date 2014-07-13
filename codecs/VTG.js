/* 
 * VTG codec
 * 
 * @repository    https://github.com/signalk/nmea-signalk
 * @author      Fabian Tollenaar <fabian@starting-point.nl>
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

/*
 === VTG - Track made good and Ground speed ===

 ------------------------------------------------------------------------------
        0   1 2   3  4  5 6   7 8  9
        |   | |   |  |  | |   | |  |
 $--VTG,x.x,T,x.x,M,x.x,N,x.x,K,m,*hh<CR><LF>
 ------------------------------------------------------------------------------

 Field Number:

 0. Track Degrees
 1. T = True
 2. Track Degrees
 3. M = Magnetic
 4. Speed Knots
 5. N = Knots
 6. Speed Kilometers Per Hour
 7. K = Kilometers Per Hour
 8. FAA mode indicator (NMEA 2.3 and later)
 9. Checksum
 */

var Codec = require('../lib/NMEA0183');

module.exports = new Codec('VTG', function(values) {

    var speed = 0.0;
    var note = "VTG - no notes";

    if(this.float(values[6]) > 0 && String(values[7]).toUpperCase() === 'K') {
        speed = this.transform(values[6], 'kph', 'ms');
        note = "VTG - Transformed " + values[6] + " (" + String(values[7]).toUpperCase() + ") to " + speed + " m/s.";
    }

    if(this.float(values[4]) > 0 && String(values[5]).toUpperCase() === 'N') {
        speed = this.transform(values[6], 'knots', 'ms');
        note = "VTG - Transformed " + values[4] + " (" + String(values[5]).toUpperCase() + ") to " + speed + " m/s.";
    }

    var data = {
        courseOverGroundMagnetic: this.float(values[2]),
        courseOverGroundTrue: this.float(values[0]),
        speedOverGround: speed,
        timestamp: this.timestamp(),
        source: this.source(),
        notes: note
    };

    return this.signal.navigation(data);
});