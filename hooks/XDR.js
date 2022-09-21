// $IIXDR,C,C,10.7,C,AIRTEMP,A,0.5,D,HEEL,A,-1.-3,D,TRIM,P,1.026,B,BARO,A,A,-4.-3,D,RUDDER*18

const math = require('math-expression-evaluator');
const fs = require('fs');
const xdrDictionary = { definitions: [] };

try {
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
} catch (e) {
  console.warn('Using default dictionary');
}

xdrDictionary.definitions = [
  ...xdrDictionary.definitions,
  {
    type: "value",
    data: "temperature",
    units: "C",
    name: "AIRTEMP",
    expression: "(x+273.15)",
    sk_path: "environment.outside.temperature",
  },
  {
    type: "roll",
    data: "angle",
    units: "D",
    name: "HEEL",
    expression: "(x*pi/180)",
    sk_path: "navigation.attitude"
  },
  {
    type: "value",
    data: "angle",
    units: "D",
    name: "RUDDER",
    expression: "(x*pi/180)",
    sk_path: "steering.rudderAngle"
  }
]

module.exports = function (input) {
  if (!Array.isArray(xdrDictionary.definitions)) {
    return null;
  }

  const isUpperCaseChar = (p, minLen = 0) => {
    const num = parseFloat(p)
    return (isNaN(num) && typeof p === 'string' && p.length > minLen && p.toUpperCase() === p)
  }

  const { definitions } = xdrDictionary
  const { parts } = input
  const subs = {}
  const boundaries = parts.slice(1).filter(p => isUpperCaseChar(p, 1))
  const values = []

  for (const boundary of boundaries) {
    const index = boundaries.indexOf(boundary);
    const prevBoundary = index === 0 ? null : boundaries[index - 1];
    const elements = [];
    let fill = false;

    for (p of parts.slice(1)) {
      if (!fill && (!prevBoundary || p === prevBoundary) && elements.length === 0) {
        fill = true;
      }

      if (fill === false || p === boundary) {
        fill = false;
        continue
      }

      if (p !== prevBoundary) {
        elements.push(p);
      }
    }

    if (elements.length) {
      subs[boundary] = elements
    }
  }

  for (const boundary of boundaries) {
    const data = subs[boundary]

    let typeFlag = null
    let value = null
    let unit = null
    
    if (data.length === 3) {
      ([ typeFlag, value, unit ] = data);
    }

    if (value === null || typeFlag === null || unit === null) {
      continue
    }

    if (isNaN(parseFloat(value))) {
      continue
    }

    const def = definitions.find(({ name }) => (name === boundary));

    if (!def) {
      continue;
    }

    if (def.units !== unit) {
      // Not parsing as unit doesn't match
      continue;
    }

    const expression = def.expression.replace(/x/g, value); 
    const attitudeTypes = ['yaw', 'pitch', 'roll'];

    let path = def.sk_path;
    let result = math.eval(expression); 

    if (!result || isNaN(result)) {
      continue
    }

    result = parseFloat(result.toFixed(4))

    if (attitudeTypes.includes(def.type.toLowerCase())) {
      path = `${path}.${def.type}`
    }

    values.push({
      path,
      value: result
    })
  }

  if (values.length === 0) {
    return null;
  }

  return {
    updates: [
      {
        source: 'XDR',
        timestamp: new Date().toISOString(),
        values,
      },
    ],
  }
}