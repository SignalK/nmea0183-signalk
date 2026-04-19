/**
 * Copyright 2016/2017 Signal K and Fabian Tollenaar <fabian@signalk.org>.
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

// Entry point mirrors the legacy CommonJS shape: `require('@signalk/nmea0183-signalk')`
// returns the Parser constructor directly.
import Parser from './lib'

export default Parser
export { Parser }
export type {
  ParserInput,
  ParserOptions,
  ParserTags,
  ParserSession,
  HookFn,
  Delta,
  DeltaUpdate,
  DeltaValue,
  CustomSentenceParserEntry
} from './types'

// CommonJS compatibility: allow both `require('...')` (constructor) and
// `require('...').Parser` to keep working for downstream consumers that have
// not migrated to ES-module default imports yet.
module.exports = Parser
module.exports.default = Parser
module.exports.Parser = Parser
