# signalk-parser-nmea0183
[![Build Status](https://travis-ci.org/SignalK/signalk-parser-nmea0183.svg?branch=master)](https://travis-ci.org/SignalK/signalk-parser-nmea0183)


A Node.js [stream.Transform](https://nodejs.org/api/stream.html#stream_class_stream_transform)
which converts [NMEA 0183](http://www.nmea.org/content/nmea_standards/nmea_0183_v_410.asp)
sentences into Signal K sparse messages.

## Supported Sentences
The following is the list of sentences the parser supports. Pull requests welcome!

- [APB - Autopilot Sentence "B"](http://www.catb.org/gpsd/NMEA.html#_apb_autopilot_sentence_b)
- [DBT - Depth Below Transducer](http://www.catb.org/gpsd/NMEA.html#_dbt_depth_below_transducer)
- [DSC - Digital Selective Calling Class-D Radios](http://continuouswave.com/whaler/reference/DSC_Datagrams.html)
- [GGA - Global Positioning System Fix Data](http://www.catb.org/gpsd/NMEA.html#_gga_global_positioning_system_fix_data)
- [GLL - Geographic Position - Latitude/Longitude](http://www.catb.org/gpsd/NMEA.html#_gll_geographic_position_latitude_longitude)
- [HDM - Heading - Magnetic](http://www.catb.org/gpsd/NMEA.html#_hdm_heading_magnetic)
- [HDT - Heading - True](http://www.catb.org/gpsd/NMEA.html#_hdt_heading_true)
- [MTW - Mean Temperature of Water](http://catb.org/gpsd/NMEA.html#_mtw_mean_temperature_of_water)
- [MWV - Wind Speed and Angle](http://www.catb.org/gpsd/NMEA.html#_mwv_wind_speed_and_angle)
- [RMC - Recommended Minimum Navigation Information](http://www.catb.org/gpsd/NMEA.html#_rmc_recommended_minimum_navigation_information)
- [ROT - Rate of Turn](http://www.catb.org/gpsd/NMEA.html#_rot_rate_of_turn)
- [RPM - Revolutions](http://www.catb.org/gpsd/NMEA.html#_rpm_revolutions)
- [VDM - AIS Other Vessel Data](http://catb.org/gpsd/AIVDM.html)
- [VDO - AIS Own Vessel Data](http://catb.org/gpsd/AIVDM.html)
- [VDR - Set and Drift](http://www.catb.org/gpsd/NMEA.html#_vdr_set_and_drift)
- [VHW - Water Speed and Heading](http://www.catb.org/gpsd/NMEA.html#_vhw_water_speed_and_heading)
- [VPW - Speed - Measured Parallel to Wind](http://www.catb.org/gpsd/NMEA.html#_vpw_speed_measured_parallel_to_wind)
- [VTG - Track Made Good and Ground Speed](http://www.catb.org/gpsd/NMEA.html#_vtg_track_made_good_and_ground_speed)
- [VWR - Relative Wind Speed and Angle](http://www.catb.org/gpsd/NMEA.html#_vwr_relative_wind_speed_and_angle)

## Installation and Use

```
$ git clone https://github.com/SignalK/signalk-parser-nmea0183.git
$ cd signalk-parser-nmea0183
$ npm install
$ echo '$IIDBT,035.53,f,010.83,M,005.85,F*23' | ./bin/nmea0183-signalk
```

Should return something like this:

```
{
  "self": "D344B1D0",
  "version": "1",
  "vessels": {
    "D344B1D0": {
      "uuid": "D344B1D0",
      "environment": {
        "depth": {
          "belowTransducer": {
            "value": 10.83,
            "source": {
              "type": "NMEA0183",
              "sentence": "DBT",
              "label": "signalk/signalk-parser-nmea0183",
              "talker": "II"
            },
            "timestamp": "2016-04-15T17:56:52.000Z"
          }
        }
      }
    }
  }
}
```

You can also pipe a file into the parser CLI:

```
$ cat some-nmea-file.log | ./bin/nmea0183-signalk
```

## Use as a Node Module

See https://github.com/SignalK/signalk-server-node/blob/master/providers/nmea0183-signalk.js for an
example in a Node application.
