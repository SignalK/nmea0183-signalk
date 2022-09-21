// $IIXDR,C,C,10.7,C,AIRTEMP,A,0.5,D,HEEL,A,-1.-3,D,TRIM,P,1.026,B,BARO,A,A,-4.-3,D,RUDDER*18

const fs = require('fs');
const xdrParser = require('xdr-parser-plugin/xdrParser');
const xdrDictionary = { definitions: [] };

// Populate a dictionary
const xdrDictPath = require.resolve('xdr-parser-plugin/xdrDict');
if (fs.existsSync(xdrDictPath)) {
  try {
    const json = JSON.parse(fs.readFileSync(xdrDictPath, 'utf-8'));

    if (json && Array.isArray(json.definitions)) {
      xdrDictionary.definitions = [ ...json.definitions ];
    }
  } catch (err) {
    console.warn('No dictionary found for xdr-parser-plugin');
  }
}

xdrDictionary.definitions = [
  ...xdrDictionary.definitions,
  {
    type: "Air temperature",
    data: "temperature",
    units: "C",
    name: "AIRTEMP",
    expression: "(x+273.15)",
    sk_path: "environment.outside.temperature",
  }
]

module.exports = function (input) {
  const { sentence } = input

  const delta = xdrParser(sentence, xdrDictionary);
  console.log(`Parsing ${sentence} >>> ` + JSON.stringify({ delta }, null, 2));
  return delta
}