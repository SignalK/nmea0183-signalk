# @signalk/nmea0183-signalk

> A node.js/JavaScript parser of NMEA0183 sentences. Sentences are parsed to [Signal K delta](http://signalk.org/specification/master/data_model.html#delta-format) format.

## Supported sentences

- [ALK - Seatalk](http://www.thomasknauf.de/rap/seatalk2.htm)
- [APB - Autopilot Sentence "B"](https://gpsd.gitlab.io/gpsd/NMEA.html#_apb_autopilot_sentence_b)
- [BOD - Bearing Origin to Destination](https://www.tronico.fi/OH6NT/docs/NMEA0183.pdf)
- [BWC - Bearing & distance - great circle](https://www.tronico.fi/OH6NT/docs/NMEA0183.pdf)
- [BWR - Bearing & distance - rhumbline](https://www.tronico.fi/OH6NT/docs/NMEA0183.pdf)
- [BVE - CruzPro Proprietary Sentence (currently only OP30/60 supported)](http://www.cruzpro.com/op60.html)
- [DBT - Depth Below Transducer](https://gpsd.gitlab.io/gpsd/NMEA.html#_dbt_depth_below_transducer)
- [DBS - Depth Below Surface](https://gpsd.gitlab.io/gpsd/NMEA.html#_dbs_depth_below_surface)
- [DBK - Depth Below Keel](https://gpsd.gitlab.io/gpsd/NMEA.html#_dbk_depth_below_keel)
- [DPT - Depth of Water](https://gpsd.gitlab.io/gpsd/NMEA.html#_dpt_depth_of_water)
- [DSC - Digital Selective Calling Class-D Radios](http://continuouswave.com/whaler/reference/DSC_Datagrams.html)
- [GGA - Global Positioning System Fix Data](https://gpsd.gitlab.io/gpsd/NMEA.html#_gga_global_positioning_system_fix_data)
- [GLL - Geographic Position - Latitude/Longitude](https://gpsd.gitlab.io/gpsd/NMEA.html#_gll_geographic_position_latitude_longitude)
- [HDG - Heading - Deviation & Variation](https://gpsd.gitlab.io/gpsd/NMEA.html#_hdg_heading_deviation_amp_variation)
- [HDM - Heading - Magnetic](https://gpsd.gitlab.io/gpsd/NMEA.html#_hdm_heading_magnetic)
- [HDT - Heading - True](https://gpsd.gitlab.io/gpsd/NMEA.html#_hdt_heading_true)
- [HSC - Heading Steering Command](https://www.tronico.fi/OH6NT/docs/NMEA0183.pdf)
- KEP - NKE Performance data
- [MDA - Meteorological Composite](https://gpsd.gitlab.io/gpsd/NMEA.html#_mda_meteorilogical_composite)
- [MTA - Mean Temperature of Air](https://www.nmea.org/Assets/100108_nmea_0183_sentences_not_recommended_for_new_designs.pdf)
- [MTW - Mean Temperature of Water](https://gpsd.gitlab.io/gpsd/NMEA.html#_mtw_mean_temperature_of_water)
- [MWD - Wind Speed and Direction](https://lists.nongnu.org/archive/html/gpsd-dev/2012-04/msg00048.html)
- [MWV - Wind Speed and Angle](https://gpsd.gitlab.io/gpsd/NMEA.html#_mwv_wind_speed_and_angle)
- [RMB - Recommended Minimum Navigation Information](https://gpsd.gitlab.io/gpsd/NMEA.html#_rmb_recommended_minimum_navigation_information)
- [RMC - Recommended Minimum Navigation Information](https://gpsd.gitlab.io/gpsd/NMEA.html#_rmc_recommended_minimum_navigation_information)
- [ROT - Rate of Turn](https://gpsd.gitlab.io/gpsd/NMEA.html#_rot_rate_of_turn)
- [RPM - Revolutions](https://gpsd.gitlab.io/gpsd/NMEA.html#_rpm_revolutions)
- [RSA - Rudder Sensor Angle](https://gpsd.gitlab.io/gpsd/NMEA.html#_rsa_rudder_sensor_angle)
- [VDM - AIS Other Vessel Data](https://gpsd.gitlab.io/gpsd/AIVDM.html)
- [VDO - AIS Own Vessel Data](https://gpsd.gitlab.io/gpsd/AIVDM.html)
- [VDR - Set and Drift](https://gpsd.gitlab.io/gpsd/NMEA.html#_vdr_set_and_drift)
- [VHW - Water Speed and Heading](https://gpsd.gitlab.io/gpsd/NMEA.html#_vhw_water_speed_and_heading)
- [VLW - Distance Traveled through Water](https://gpsd.gitlab.io/gpsd/NMEA.html#_vlw_distance_traveled_through_water)
- [VPW - Speed - Measured Parallel to Wind](https://gpsd.gitlab.io/gpsd/NMEA.html#_vpw_speed_measured_parallel_to_wind)
- [VTG - Track Made Good and Ground Speed](https://gpsd.gitlab.io/gpsd/NMEA.html#_vtg_track_made_good_and_ground_speed)
- [VWR - Relative Wind Speed and Angle](https://gpsd.gitlab.io/gpsd/NMEA.html#_vwr_relative_wind_speed_and_angle)
- [VWT - True Wind Angle and Speed](https://lists.nongnu.org/archive/html/gpsd-dev/2012-04/msg00048.html)
- [ZDA - UTC day, month, and year, and local time zone offset](https://gpsd.gitlab.io/gpsd/NMEA.html#_zda_time_amp_date_utc_day_month_year_and_local_time_zone)
- [XTE - Cross-track Error](https://www.tronico.fi/OH6NT/docs/NMEA0183.pdf)
- [ZDA - UTC day, month, and year, and local time zone offset](http://www.trimble.com/oem_receiverhelp/v4.44/en/NMEA-0183messages_ZDA.html)
- [Custom Sentences](#custom-sentences)

**Note:** *at this time, unknown sentences will be silently discarded.*

### Custom Sentences

You can add custom sentence parsers via the [Signal K Server plugin mechanism](https://github.com/SignalK/signalk-server/blob/master/SERVERPLUGINS.md). A plugin can register custom parsers by emitting `nmea0183sentenceParser` PropertyValues with a value that has the properties
- sentence: the three letter id of the sentence
- parser: a function with the signature `({ id, sentence, parts, tags }, session) => delta`

See [custom-sentence-plugin](./custom-sentence-plugin) for an example.

## Usage

### JavaScript API

```javascript
const Parser = require('@signalk/nmea0183-signalk')
const parser = new Parser()

try {
  const delta = parser.parse('$SDDBT,17.0,f,5.1,M,2.8,F*3E')
  if (delta !== null) {
    console.log(`[delta] ${JSON.stringify(delta, null, 2)}`)
  }
}
catch (e) {
  console.error(`[error] ${e.message}`)
}
```

### Command line

In addition to usage in your code, the parser can be used on the command-line if installed globally (`npm install --global`). This allows you to pipe data from one program into the parser directly, without using a Signal K server. The parser holds no Signal K tree in memory (a big change vs. 1.x), so the output will be stringified [Signal K delta](http://signalk.org/specification/master/data_model.html#delta-format) messages.

```bash
$ echo '$SDDBT,17.0,f,5.1,M,2.8,F*3E' | nmea0183-signalk
```

## NMEA0183v4 tag blocks

This parser has (limited) support of [NMEA0183v4 tag blocks](http://www.nmea.org/Assets/may%2009%20rtcm%200183_v400.pdf) (e.g. `\s:airmar dst800,c:1438489697*13\$SDDBT,17.0,f,5.1,M,2.8,F*3E`).

Example:

```javascript
const Parser = require('@signalk/nmea0183-signalk')
const parser = new Parser()

try {
  // backslash starts an escape sequence in JavaScript code, so they need to be double in string literals
  const delta = parser.parse('\\s:airmar dst800,c:1438489697*13\\$SDDBT,17.0,f,5.1,M,2.8,F*3E')
  if (delta !== null) {
    console.log(`[delta] ${JSON.stringify(delta, null, 2)}`)
  }
}
catch (e) {
  console.error(`[error] ${e.message}`)
}
```

Output:
```json
[delta] {
  "updates": [
    {
      "source": {
        "sentence": "DBT",
        "talker": "airmar dst800",
        "type": "NMEA0183"
      },
      "timestamp": "2015-08-02T04:28:17.000Z",
      "values": [
        {
          "path": "environment.depth.belowTransducer",
          "value": 5.1
        }
      ]
    }
  ]
}
```

**Note:** *at this time, the checksum of the tag block (`c:1438489697*13`) is not validated.*

## License

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
