#!/usr/bin/env node

// Stream NMEA 0183 sentences from stdin, emit Signal K deltas as JSON lines.
// Checksum validation is off because real-world NMEA streams often carry
// mid-stream corruption; callers can re-enable with a small wrapper if they
// need strict parsing.

import Parser from '../lib'
import split from 'split'

const parser = new Parser({
  validateChecksum: false
})

process.stdin.resume()
process.stdin.setEncoding('utf8')

process.stdin.pipe(split()).on('data', (data: unknown) => {
  if (typeof data !== 'string') {
    return
  }

  try {
    const delta = parser.parse(data.trim())
    if (delta !== null) {
      console.log(JSON.stringify(delta))
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    console.error('Encountered an error:', message)
  }
})

process.stdin.on('error', (err: NodeJS.ErrnoException) => {
  console.error('Encountered an input error:', err.message)
  process.exit(1)
})
