/*
 * Copyright 2015 Fabian Tollenaar <fabian@starting-point.nl>
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
 */
var _ = require('lodash');

! function() {
  "use strict";

  Math.radians = function(degrees) {
    return degrees * Math.PI / 180;
  };

  var NMEA0183 = function(name, decoder) {
    if (!(this instanceof NMEA0183)) return new NMEA0183();

    this.name = name;
    this._decoder = decoder;
    this.exceptions = [];

    this.errors = {
      GENERAL: 0,
      MALFORMED: 1,
      VOID: 2,
      VOID_MODE: 3
    };

    this.RATIOS = {
      // DISTANCE
      NM_IN_KM: 1.852,
      KM_IN_NM: 0.539956803,
      // SPEED
      // Knots
      KNOTS_IN_MS: 0.514444,
      KNOTS_IN_MPH: 1.150779,
      KNOTS_IN_KPH: 1.852,
      // MPH
      MPH_IN_MS: 0.44704,
      MPH_IN_KPH: 1.609344,
      MPH_IN_KNOTS: 0.868976,
      // KPH
      KPH_IN_MS: 0.277778,
      KPH_IN_MPH: 0.621371,
      KPH_IN_KNOTS: 0.539957,
      // MS
      MS_IN_KPH: 3.6,
      MS_IN_MPH: 2.236936,
      MS_IN_KNOTS: 1.943844,
    };
  };

  NMEA0183.prototype.source = function(talker) {
    var source = {
      type: 'NMEA0183',
      sentence: this.name,
      label: 'signalk-parser-nmea0183'
    };

    if(typeof talker === 'string' && talker.trim().length > 0) {
      source.talker = talker.toUpperCase()
    }

    return source
  };

  NMEA0183.prototype.transform = function(value, inputFormat, outputFormat) {
    value = this.float(value);

    inputFormat = inputFormat.toLowerCase();
    outputFormat = outputFormat.toLowerCase();

    if (inputFormat === outputFormat) {
      return value;
    }

    // M
    if (inputFormat == 'm') {
      if (outputFormat == 'nm') return (value / 1000) / this.RATIOS.NM_IN_KM;
    }

    // KM
    if (inputFormat == 'km') {
      if (outputFormat == 'nm') return value / this.RATIOS.NM_IN_KM;
      if (outputFormat == 'm') return value * 1000;
    }

    // NM
    if (inputFormat == 'nm') {
      if (outputFormat == 'km') return value / this.RATIOS.KM_IN_NM;
      if (outputFormat == 'm') return (value / this.RATIOS.KM_IN_NM) * 1000;
    }

    // KNOTS
    if (inputFormat == 'knots') {
      if (outputFormat == 'kph') return value / this.RATIOS.KPH_IN_KNOTS;
      if (outputFormat == 'ms') return value / this.RATIOS.MS_IN_KNOTS;
      if (outputFormat == 'mph') return value / this.RATIOS.MPH_IN_KNOTS;
    }

    // KPH
    if (inputFormat == 'kph') {
      if (outputFormat == 'knots') return value / this.RATIOS.KNOTS_IN_KPH;
      if (outputFormat == 'ms') return value / this.RATIOS.MS_IN_KPH;
      if (outputFormat == 'mph') return value / this.RATIOS.MPH_IN_KPH;
    }

    // MPH
    if (inputFormat == 'mph') {
      if (outputFormat == 'knots') return value / this.RATIOS.KNOTS_IN_MPH;
      if (outputFormat == 'ms') return value / this.RATIOS.MS_IN_MPH;
      if (outputFormat == 'kph') return value / this.RATIOS.KPH_IN_MPH;
    }

    // MS
    if (inputFormat == 'ms') {
      if (outputFormat == 'knots') return value / this.RATIOS.KNOTS_IN_MS;
      if (outputFormat == 'mph') return value / this.RATIOS.MPH_IN_MS;
      if (outputFormat == 'kph') return value / this.RATIOS.KPH_IN_MS;
    }

    // DEGREES
    if (inputFormat == 'deg') {
      if (outputFormat == 'rad') return Math.radians(value)
    }

    // Celsius
    if (inputFormat == 'c') {
      if (outputFormat == 'k') return value + 273.15
    }

    // Just return input if input/output formats are not recognised.
    return value;
  };

  NMEA0183.prototype.reportError = function(errorCode, errorMsg) {
    this.exceptions.push({
      source: this.name,
      code: errorCode,
      message: errorMsg,
      time: new Date().toISOString()
    });
  };

  NMEA0183.prototype.magneticVariaton = function(degrees, pole) {
    pole = pole.toUpperCase();
    degrees = this.float(degrees);

    if (pole == "S" || pole == "W") {
      degrees *= -1;
    }

    return degrees;
  }

  NMEA0183.prototype.timestamp = function(time, date) {
    /* TIME (UTC) */
    if (time) {
      var hours, minutes, seconds;
      hours = this.int(time.slice(0, 2), true);
      minutes = this.int(time.slice(2, 4), true);
      seconds = this.int(time.slice(-2), true);
    } else {
      var dt, hours, minutes, seconds;
      dt = new Date();
      hours = dt.getUTCHours();
      minutes = dt.getUTCMinutes();
      seconds = dt.getUTCSeconds();
    }

    /* DATE (UTC) */
    if (date) {
      var year, month, day;
      day = this.int(date.slice(0, 2), true);
      month = this.int(date.slice(2, 4)-1, true);
      year = this.int(date.slice(-2));

      // HACK copied from jamesp/node-nmea
      if (year < 73) {
        year = this.int("20" + _.padStart(year, 2, '0'));
      } else {
        year = this.int("19" + year);
      }
    } else {
      var dt, year, month, day;

      dt = new Date();
      year = dt.getUTCFullYear();
      month = dt.getUTCMonth();
      day = dt.getUTCDate();
    }

    /* construct */
    var d = new Date(Date.UTC(year, month, day, hours, minutes, seconds));
    return d.toISOString();
  }

  NMEA0183.prototype.coordinate = function(value, pole) {
    // N 5222.3277 should be read as 52°22.3277'
    // E 454.5824 should be read as 4°54.5824'
    //
    // 1. split at .
    // 2. last two characters of split[0] (.slice(-2)) + everything after . (split[1]) are the minutes
    // 3. degrees: split[0][a]
    // 4. minutes: split[0][b] + '.' + split[1]
    //
    // 52°22'19.662'' N -> 52.372128333
    // 4°54'34.944'' E -> 4.909706667
    // S & W should be negative.

    pole = pole.toUpperCase();

    var split = value.split('.');
    var degrees = this.float(split[0].slice(0, -2));
    var minsec = this.float(split[0].slice(-2) + '.' + split[1]);
    var decimal = this.float(degrees + (minsec / 60));

    if (pole == "S" || pole == "W") {
      decimal *= -1;
    }

    return this.float(decimal);
  }

  NMEA0183.prototype.zero = function(n) {
    if (this.float(n) < 10) {
      return "0" + n;
    } else {
      return "" + n;
    }
  }

  NMEA0183.prototype.int = function(n) {
    if (("" + n).trim() === '') {
      return 0;
    } else {
      return parseInt(n, 10);
    }
  }

  NMEA0183.prototype.float = function(n) {
    if (("" + n).trim() === '') {
      return 0.0;
    } else {
      return parseFloat(n);
    }
  }

  NMEA0183.prototype.decode = function() {
    return this._decoder.apply(this, Array.prototype.slice.call(arguments));
  }

  module.exports = NMEA0183;

}();
