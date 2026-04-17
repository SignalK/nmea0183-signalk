/**
 * Copyright 2016 Signal K and Fabian Tollenaar <fabian@signalk.org>.
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

import Debug from 'debug'
import * as utils from '@signalk/nmea0183-utilities'

import getTagBlock from './getTagBlock'
import transformSource from './transformSource'
import defaultHooks from '../hooks'
import type {
  Delta,
  HookFn,
  ParserOptions,
  ParserSession,
  ParserTags
} from '../types'

// package.json loaded via resolveJsonModule. Using a typed local shape avoids
// leaking the full json schema into the Parser class surface.
import pkg from '../../package.json'

const debug = Debug('signalk-parser-nmea0183')

// Runtime shape of an entry emitted via the onPropertyValues channel. Both
// fields must be present and correctly typed; isValidSentenceParserEntry
// narrows the raw unknown payload to this type.
interface SentenceParserEntry {
  sentence: string
  parser: HookFn
}

class Parser {
  options: ParserOptions
  session: ParserSession
  name: string
  version: string
  author: string
  license: string
  hooks: Record<string, HookFn>

  constructor(opts?: ParserOptions | unknown) {
    if (opts === null) {
      throw new TypeError(
        'Parser options must not be null; pass undefined or an options object'
      )
    }
    // Fall back to an empty options object when the caller passes a
    // non-object sentinel (legacy behaviour covered by info.js tests).
    const resolved: ParserOptions =
      typeof opts === 'object' && opts !== undefined
        ? (opts as ParserOptions)
        : {}
    this.options = resolved
    if (!Object.keys(this.options).includes('validateChecksum')) {
      this.options.validateChecksum = true
    }
    this.session = {}

    this.name = pkg.name
    this.version = pkg.version
    this.author = pkg.author
    this.license = pkg.license
    this.hooks = { ...defaultHooks }

    if (resolved.onPropertyValues) {
      resolved.onPropertyValues(
        'nmea0183sentenceParser',
        (propertyValues_: Array<{ value: unknown }> | undefined) => {
          if (propertyValues_ === undefined) {
            return
          }
          propertyValues_
            .filter((v) => v)
            .map((propValue) => propValue.value)
            .filter(isValidSentenceParserEntry)
            .forEach(({ sentence, parser }) => {
              debug(`setting custom parser ${sentence}`)
              this.hooks[sentence] = parser
            })
        }
      )
    }
  }

  parse(sentence: string): Delta | null {
    const maybeTagBlock = getTagBlock(sentence)
    let tags: ParserTags
    let body: string
    if (maybeTagBlock !== false) {
      body = maybeTagBlock.sentence
      tags = maybeTagBlock.tags
    } else {
      body = sentence
      tags = {}
    }

    const valid = utils.valid(body, this.options.validateChecksum)
    if (valid === false) {
      throw new Error(`Sentence "${body.trim()}" is invalid`)
    }

    if (body.charCodeAt(body.length - 1) === 10) {
      // in case there's a newline
      body = body.substr(0, body.length - 1)
    }

    const data = body.split('*')[0]!
    const dataParts = data.split(',')
    const header = dataParts[0]!
    let id = ''
    let talker = ''
    let internalId = ''

    if (header.charAt(1).toUpperCase() === 'P') {
      // proprietary sentence
      id = header.substr(-3, header.length).toUpperCase()
      talker = header.substr(1, 2).toUpperCase()
      internalId = header.substr(1, header.length)
    } else {
      id = header.substr(3, header.length).toUpperCase()
      talker = header.substr(1, 2)
      internalId = header.substr(3, 3).toUpperCase()
    }
    const split = dataParts.slice(1, dataParts.length)

    if (typeof tags.source === 'undefined') {
      tags.source = ':'
    } else {
      tags.source = `${tags.source}:${id}`
    }

    const hook = this.hooks[internalId]
    if (typeof hook === 'function') {
      const result = hook(
        {
          id,
          sentence: body,
          parts: split,
          tags,
          talker
        },
        this.session
      )
      return transformSource(result ?? null, id, talker)
    }
    return null
  }
}

function isValidSentenceParserEntry(
  entry: unknown
): entry is SentenceParserEntry {
  const candidate = entry as Partial<SentenceParserEntry> | null | undefined
  const isValid =
    candidate !== null &&
    candidate !== undefined &&
    typeof candidate.sentence === 'string' &&
    typeof candidate.parser === 'function'
  if (!isValid) {
    console.error(`Invalid sentence parser entry:${JSON.stringify(entry)}`)
  }
  return isValid
}

export default Parser
export { Parser }
module.exports = Parser
module.exports.default = Parser
module.exports.Parser = Parser
