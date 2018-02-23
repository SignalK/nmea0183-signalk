'use strict'

/**
* Copyright 2016 Signal K and Fabian Tollenaar <fabian@signalk.org>.
* Based on the work by Philip J Freeman
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

const debug = require('debug')('signalk-parser-nmea0183/DSC')
const utils = require('@signalk/nmea0183-utilities')
var delta = {}

function isEmpty(mixed) {
  return ((typeof mixed !== 'string' && typeof mixed !== 'number') || (typeof mixed === 'string' && mixed.trim() === ''))
}

function parsePosition(line) {

  /*
  * Position Format:
  *
  * / Quadrant Id ("0" = NE, "1" = NW, "2" = SE, and "3" = SW
  * |
  * |/ Degrees Latitude
  * ||
  * || / Minutes Latitude
  * || |
  * || | / Degrees Longitude
  * || | |
  * || | |  / Minutes Longitude
  * || | |  |
  * 1YYyyXXXxx
  */

  var lat = parseFloat(line.substring(1,3));
  var lat_min = parseFloat(line.substring(3,5));
  var lat_dec = lat+(lat_min/60)

  var lon = parseFloat(line.substring(5,8));
  var lon_min = parseFloat(line.substring(8,10));
  var lon_dec = lon+(lon_min/60)

  var quadrant = parseInt(line.substring(0,1))

  if (quadrant == 1 || quadrant == 3) {
    lon_dec = lon_dec * -1;
  }
  if (quadrant == 2 || quadrant == 3) {
    lat_dec = lat_dec * -1;
  }
  debug('lat: ' + lat_dec + ' ,lon: ' + lon_dec)
  return { 'longitude': lon_dec, 'latitude': lat_dec }
}

module.exports = function (parser, input) {
  try {
    const { id, sentence, parts, tags } = input
    var values = [];

    const empty = parts.reduce((e, val) => {
      if (isEmpty(val)) {
        ++e
      }
      return e
    }, 0)

    if (empty > 3) {
      return Promise.resolve(null)
    }

    // for some reason, it seems the sender identification is mmsi+'0', so we
    // strip the trailing zero to get a 9 digit mmsi
    var mmsi = parts[1].substring(0,9);
    debug ("mmsi: " + mmsi)

    var handled = false;
    var get_position = false;
    var distress = false;
    var distress_nature = "";

    switch(parts[2]) {

      case '00': // routine category
      switch (parts[3]) {
        case '21': // ship position
        handled = true;
        get_position = true;
        break;
        //case '??': // other telecommands
      }
      break;

      case '08': // * 108 = safety
      break;
      case '10': // * 110 = urgency
      break;
      case '12': // * 112 = distress
      handled = true;
      get_position = true;
      distress = true;
      switch (parts[3]) { // Nature of Distress
        case '00': // = Fire, explosion
        distress_nature = 'fire';
        break;
        case '01': // = Flooding
        distress_nature = 'flooding';
        break;
        case '02': // = Collision
        distress_nature = 'collision';
        break;
        case '03': // = Grounding
        distress_nature = 'grounding';
        break;
        case '04': // = Listing, in danger of capsize
        distress_nature = 'listing';
        break;
        case '05': // = Sinking
        distress_nature = 'sinking';
        break;
        case '06': // = Disabled and adrift
        distress_nature = 'adrift';
        break;
        case '07': // = Undesignated distres
        distress_nature = 'undesignated';
        break;
        case '08': // = Abandoning ship
        distress_nature = 'abandon'
        break;
        case '09': // = Piracy/armed robbery attack
        distress_nature = 'piracy'
        break;
        case '10': // = Man overboard
        distress_nature = 'mob'
        break;
        case '12': // = EPRIB emission
        distress_nature = 'epirb';
        break;
        default: // unassigned symbol; take no action
        distress_nature = 'unassigned';
      }
    }

    /*values.push({
      path: "",
      value: {
        mmsi: parts[1]
      }
    })*/


    if (get_position) {
      var position = parsePosition(parts[5])
      values.push({
        path: "navigation.position",
        value: {
          latitude: position.latitude,
          longitude: position.longitude
        }
      })
    }
    if (distress) {
      values.push({
        path: "notifications."+distress_nature,
        value: {
          message: "DSC Distress Recieved! Nature of distress: "+distress_nature
        }
      })
    }
    if (!handled) {
      console.log("DSC Message Not Handled: "+line);
      values.push({
        path: "notifications.dsc_parser",
        value: {
          message: "DSC Message Not Handled: "+line
        }
      })
    }
    if (values.length > 0) {
      //multiplexer.self();

      delta = {
        "updates": [{
          "source": tags.source,//this.source(input.instrument),
          "timestamp": tags.timestamp,
          "values": values
        }],
        "context": 'vessels.urn:mrn:imo:mmsi:' + mmsi
      };
    }
    return Promise.resolve({ delta })
  } catch (e) {
    debug(`Try/catch failed: ${e.message}`)
    return Promise.reject(e)
  }
}


/*
* DSC Codec - Some DSC Capable VHF Radios output DSC Sentences
*
* This codec currently contains basic support for distress messages and
* position messages.
*
* NOTE: The position in the DSC sentence is only accurate to the minute,
* however, there is an extended sentence that provides further detail. The
* DSE Sentence (which can follow the DSC sentence) contains further position
* detail.
*
*
* Documentation for DSC Sentences:
*
*  * http://continuouswave.com/whaler/reference/DSC_Datagrams.html
*
* Distress Alert Example:
* $CDDSC,12,3380400790,12,06,00,1423108312,2019,,,S,E*6A
* $CDDSE,1,1,A,3380400790,00,45894494*1B
*
* Distress Cancelation (unsupported):
* $CDDSC,12,3381581370,12,06,00,1423108312,0236,3381581370,,S,*20
*
* Example of Non-Distress Call:
* $CDDSC,20,3381581370,00,21,26,1423108312,1902,,,B,E*7B
*
*
*
*        0  1          2  3  4  5          6      9 10
*        |  |          |  |  |  |          |      | |
* $--DSC,XX,XXXXXXXXXX,XX,XX,XX,XXXXXXXXXX,XXXX,,,A,C*hh<CR><LF>
*
* Field Number:
*   0.    Format Specifier (without first digit)
*            102 = selective call to a group of ships in particular geographic area
*            112 = distress alert call
*            114 = selective call to a group of ships having common interest
*            116 = all ships call
*            120 = selective call to particular individual station
*            123 = selective call to a particular individual using automatic service
*
*   1.    Sender MMSI
*   2.    Category Element (without first digit)
*            100 = Routine
*            108 = Safety
*            110 = Urgency
*            112 = Distress
*
*   3.    variable based on Category
*   4.    variable based on category
*   5.    Sender Position
*   6.    time in UTC
*   7.    address of vessel in distress (if different than sending vessel?)
*   8.    Unknown
*   9.    Unknown (It may be a representation of a service command)
*   10.   Expansion message follows
*            E = true
*           ' '= false
*
*/
