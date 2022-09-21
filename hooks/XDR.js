// $IIXDR,C,C,10.7,C,AIRTEMP,A,0.5,D,HEEL,A,-1.-3,D,TRIM,P,1.026,B,BARO,A,A,-4.-3,D,RUDDER*18

const xdrDictionary = require('xdr-parser-plugin/xdrDict');
const xdrParser = require('xdr-parser-plugin/xdrParser');


module.exports = function (input) {
  const { sentence } = input

  const delta = xdrParser(sentence, xdrDictionary);
  console.log(`Parsing ${sentence} >>> ` + JSON.stringify({ delta }, null, 2));
  return delta
}