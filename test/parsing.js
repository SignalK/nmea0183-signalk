var Parser  = require('../');
var assert  = require('assert');
var validateSchema = require('signalk-schema').validateVessel;

function clearTimestampFromObj(obj) {
  var out = {};

  for(var prop in obj) {
    if(obj.hasOwnProperty(prop)) {
      if(typeof obj[prop] === 'object' && obj[prop] !== null) {
        out[prop] = clearTimestampFromObj(obj[prop]);
      } else {
        if(prop !== 'timestamp') {
          out[prop] = obj[prop];
        }
      }
    }
  }

  return out;
}

function parse(sentence) {
  var parsed;
  // Note, this assumes that Parser is synchronous (which it should be).
  // For a really nice implementation, a promise should be used here.
  Parser.parse(sentence,
         function(unused, parsedSentence) {
           parsed = parsedSentence;
         },
         { selfType: 'mmsi', selfId: '123456789' });
  return parsed;
}

function verifyParsing(sentence, expected) {
  var parsedSentence = parse(sentence);

  it ('Parsed data matches the expected result', function() {
    assert.deepEqual(clearTimestampFromObj(parsedSentence),
                     expected);
  });

  it('Schema conformance', function() {
    var vesselData = parsedSentence.vessels["123456789"];
    var result = validateSchema(vesselData);
    result.errors.forEach(function(error) {
      console.error("Schema validation error:",
                    "data path:", error.dataPath, ",",
                    "message:", error.message);
    });
    assert(!result.errors.length,
           "Parsed data does not conform to the schema");
  });
}

describe('DBT parser', function() {
  verifyParsing('$IIDBT,034.28,f,010.45,M,005.64,F*2B',
                {
                  "vessels": {
                    "123456789": {
                      "environment": {
                        "depth": {
                          "belowTransducer": {
                            "value": 10.45,
                            "source": {
                              "label": "signalk-parser-nmea0183",
                              "type": "NMEA0183",
                              "sentence": "DBT"
                            }
                          }
                        }
                      },
                      "mmsi": "123456789"
                    }
                  },
                  "version": 1,
                  "self": "123456789"
                });
});

describe('MWV parser; sentence with true wind data', function() {
  verifyParsing('$IIMWV,318,T,07.61,N,A*2F',
                {
                  "vessels": {
                    "123456789": {
                      "environment": {
                        "wind": {
                          "speedTrue": {
                            "value": 3.91492321400277,
                            "source": {
                              "label": "signalk-parser-nmea0183",
                              "type": "NMEA0183",
                              "sentence": "MWV"
                            }
                          },
                          "angleTrueWater": {
                            "value": -42,
                            "source": {
                              "label": "signalk-parser-nmea0183",
                              "type": "NMEA0183",
                              "sentence": "MWV"
                            }
                          }
                        }
                      },
                      "mmsi": "123456789"
                    }
                  },
                  "version": 1,
                  "self": "123456789"
                });
});

describe('MWV parser; sentence with apparent wind data', function() {
  verifyParsing('$IIMWV,336,R,13.41,N,A*22',
                { "self": "123456789",
                  "version": 1,
                  "vessels": {
                    "123456789": {
                      "mmsi": "123456789",
                      "environment": {
                        "wind": {
                          "angleApparent": {
                            "source": {
                              "label": "signalk-parser-nmea0183",
                              "type": "NMEA0183",
                              "sentence": "MWV"
                            },
                            "value": -24
                          },
                          "speedApparent": {
                            "source": {
                              "label": "signalk-parser-nmea0183",
                              "type": "NMEA0183",
                              "sentence": "MWV"
                            },
                            "value": 6.89870174767111
                          }
                        }
                      }
                    }
                  }
                });
});

describe('MWV parser; apparent wind data (wind from starboard)', function() {
  verifyParsing('$IIMWV,035,R,09.13,N,A*2E',
                { "self": "123456789",
                  "version": 1,
                  "vessels": {
                    "123456789": {
                      "mmsi": "123456789",
                      "environment": {
                        "wind": {
                          "angleApparent": {
                            "source": {
                              "label": "signalk-parser-nmea0183",
                              "type": "NMEA0183",
                              "sentence": "MWV"
                            },
                            "value": 35
                          },
                          "speedApparent": {
                            "source": {
                              "label": "signalk-parser-nmea0183",
                              "type": "NMEA0183",
                              "sentence": "MWV"
                            },
                            "value": 4.696878967653784
                          }
                        }
                      }
                    }
                  }
                });
});

describe('VHW parser; sentence with speed data only', function() {
  verifyParsing('$IIVHW,,T,,M,06.12,N,11.33,K*50',
                {
                  "vessels": {
                    "123456789": {
                      "navigation": {
                        "speedThroughWater": {
                          "value": 3.147222222222222,
                          "source": {
                            "label": "signalk-parser-nmea0183",
                            "type": "NMEA0183",
                            "sentence": "VHW"
                          }
                        }
                      },
                      "mmsi": "123456789"
                    }
                  },
                  "version": 1,
                  "self": "123456789"
                });
});

describe('VHW parser; sentence with direction and speed data', function() {
  verifyParsing('$SDVHW,182.5,T,181.8,M,0.0,N,0.0,K*4C',
                {
                  "vessels": {
                    "123456789": {
                      "navigation": {
                        "headingTrue": {
                          "value": "182.5",
                          "source": {
                            "label": "signalk-parser-nmea0183",
                            "type": "NMEA0183",
                            "sentence": "VHW"
                          }
                        },
                        "headingMagnetic": {
                          "value": "181.8",
                          "source": {
                            "label": "signalk-parser-nmea0183",
                            "type": "NMEA0183",
                            "sentence": "VHW"
                          }
                        },
                        "speedThroughWater": {
                          "value": 0,
                          "source": {
                            "label": "signalk-parser-nmea0183",
                            "type": "NMEA0183",
                            "sentence": "VHW"
                          }
                        }
                      },
                      "mmsi": "123456789"
                    }
                  },
                  "version": 1,
                  "self": "123456789"
                });
});
