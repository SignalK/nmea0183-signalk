'use strict'

// eslint-disable-line strict

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

const debug = require('debug')('signalk-parser-nmea0183/findHook')
const fs = require('fs')
const path = require('path').join(__dirname, '../hooks')

const hooks = {}
fs
  .readdirSync(path)
  .filter(filename => filename.indexOf('.') > 0)
  .forEach((filename) => {
    hooks[filename.split('.')[0]] = require(`../hooks/${filename}`)
  })
module.exports = function findHook(id) {
  return hooks[id]
}
