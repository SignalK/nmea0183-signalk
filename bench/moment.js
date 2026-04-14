'use strict'

// Micro-benchmark for moment-timezone removal in nmea0183-signalk.
//
// Measures parse throughput for hooks that used moment-timezone:
//   - GGA, GLL, GNS: moment.tz('UTC').format('DDMMYY') per sentence
//   - RMC: moment.tz('UTC').format('DDMMYY') + moment.tz(iso, 'UTC').unix()
//   - TAG: moment.tz(ms, 'UTC').toISOString() in lib/getTagBlock.js
//
// Each sentence is parsed ITERATIONS times per trial, across TRIALS trials.
// We report the MIN trial (best-case, least noise from GC/scheduling) and
// the MEDIAN trial. Min is the more reliable signal for micro-benchmarks.
//
// Run from the repo root: node bench/moment.js [iterations] [trials]

const Parser = require('../lib')

const SAMPLES = {
  GGA: '$GPGGA,172814.0,3723.46587704,N,12202.26957864,W,2,6,1.2,18.893,M,-25.669,M,2.0,0031*4F',
  GLL: '$GPGLL,5057.970,N,00146.110,E,142451,A*27',
  GNS: '$GNGNS,014035.00,4332.69262,S,17235.48549,E,RR,13,0.9,25.63,11.24,,*70',
  RMC: '$GPRMC,085412.000,A,5222.3198,N,00454.5784,E,0.58,251.34,030414,,,A*65',
  TAG: '\\s:compass,c:1438489697*13\\$IIDBT,035.53,f,010.83,M,005.85,F*23',
}

const ITERATIONS = parseInt(process.argv[2], 10) || 200000
const TRIALS = parseInt(process.argv[3], 10) || 5
const WARMUP = 5000

function median(xs) {
  const sorted = [...xs].sort((a, b) => a - b)
  const mid = sorted.length >> 1
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

function bench(label, sentence) {
  const parser = new Parser()
  for (let i = 0; i < WARMUP; i++) parser.parse(sentence)

  const trials = []
  for (let t = 0; t < TRIALS; t++) {
    const start = process.hrtime.bigint()
    for (let i = 0; i < ITERATIONS; i++) parser.parse(sentence)
    const end = process.hrtime.bigint()
    trials.push(Number(end - start) / ITERATIONS)
  }

  const min = Math.min(...trials)
  const med = median(trials)
  console.log(
    `${label.padEnd(4)}  min ${min.toFixed(0).padStart(6)} ns/op   ` +
      `median ${med.toFixed(0).padStart(6)} ns/op   ` +
      `(${trials.map((t) => t.toFixed(0)).join(', ')})`,
  )
  return { min, med, trials }
}

console.log(
  `node ${process.version}  platform ${process.platform}/${process.arch}`,
)
console.log(
  `iterations per trial: ${ITERATIONS}   trials: ${TRIALS}   warmup: ${WARMUP}`,
)
console.log('')
const results = {}
for (const [label, sentence] of Object.entries(SAMPLES)) {
  results[label] = bench(label, sentence)
}
