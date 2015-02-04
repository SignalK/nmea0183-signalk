var Parser  = require('../').parse;
var assert  = require('assert');

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

function verifyParsing(sentence, expected, errorMessage) {
  var cbPassed = false;
  Parser(sentence,
         function(_, sk) {
           assert.deepEqual(clearTimestampFromObj(sk),
                            expected,
                            errorMessage);
           cbPassed = true;
         },
         { selfType: 'uuid', selfId: '1A77F355' });
  assert(cbPassed, errorMessage + ": statement was not parsed");
}

describe('DBT parser', function() {
  it('DBT sentence', function() {
    verifyParsing('$IIDBT,034.28,f,010.45,M,005.64,F*2B',
                  {
                    "vessels": {
                      "1A77F355": {
                        "environment": {
                          "depth": {
                            "belowTransducer": {
                              "value": 10.45,
                              "source": {
                                "device": "signalk-parser-nmea0183",
                                "sentence": "DBT",
                                "type": "NMEA0183"
                              }
                            }
                          }
                        },
                        "uuid": "1A77F355"
                      }
                    },
                    "version": 1,
                    "self": "1A77F355"
                  },
                  "incorrect result for DBT");
  });
});

describe('MWV parser', function() {
  it('MWV sentence with true wind data', function() {
    verifyParsing('$IIMWV,318,T,07.61,N,A*2F',
                  {
                    "vessels": {
                      "1A77F355": {
                        "environment": {
                          "wind": {
                            "speedTrue": {
                              "value": 3.91492321400277,
                              "source": {
                                "device": "signalk-parser-nmea0183",
                                "sentence": "MWV",
                                "type": "NMEA0183"
                              }
                            },
                            "directionTrue": {
                              "value": 318,
                              "source": {
                                "device": "signalk-parser-nmea0183",
                                "sentence": "MWV",
                                "type": "NMEA0183"
                              }
                            }
                          }
                        },
                        "uuid": "1A77F355"
                      }
                    },
                    "version": 1,
                    "self": "1A77F355"
                  },
                  "incorrect result for MWV true wind");
  });

  it('MWV sentence with apparent wind data', function() {
    verifyParsing('$IIMWV,336,R,13.41,N,A*22',
                  { "self": "1A77F355",
                    "version": 1,
                    "vessels": {
                      "1A77F355": {
                        "uuid": "1A77F355",
                        "environment": {
                          "wind": {
                            "directionApparent": {
                              "source": {
                                "type": "NMEA0183",
                                "sentence": "MWV",
                                "device": "signalk-parser-nmea0183"
                              },
                              "value": 336
                            },
                            "speedApparent": {
                              "source": {
                                "type": "NMEA0183",
                                "sentence": "MWV",
                                "device": "signalk-parser-nmea0183"
                              },
                              "value": 6.89870174767111
                            }
                          }
                        }
                      }
                    }
                  },
                  "Incorrect result for MWV apparent wind");
  });
});
