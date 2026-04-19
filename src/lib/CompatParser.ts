/**
 * Legacy streaming compatibility wrapper.
 *
 * Kept for historical reasons; the original implementation relied on a
 * `.stream()` method on the Parser class that has since been removed, so in
 * practice this shim does not produce events today. It is preserved as an
 * entry point in case a streaming wrapper is reintroduced, and to keep the
 * file/export surface stable across the TypeScript migration.
 */

import { Transform, type TransformOptions } from 'stream'

import Parser from './'

export interface CompatParserOptions {
  stream?: TransformOptions
  [key: string]: unknown
}

export default class CompatParser extends Transform {
  parser: Parser

  constructor(opts: CompatParserOptions = {}) {
    const streamOpts: TransformOptions = {
      ...(opts.stream ?? {}),
      objectMode: true
    }
    super(streamOpts)

    this.parser = new Parser(opts)
  }

  override _transform(
    chunk: string | Buffer,
    _encoding: BufferEncoding,
    done: (err?: Error | null) => void
  ): void {
    try {
      const data = typeof chunk === 'string' ? chunk : chunk.toString('utf8')
      const delta = this.parser.parse(data.trim())
      if (delta !== null) {
        this.emit('delta', delta)
        this.push(delta)
      }
      done()
    } catch (err) {
      done(err instanceof Error ? err : new Error(String(err)))
    }
  }
}
