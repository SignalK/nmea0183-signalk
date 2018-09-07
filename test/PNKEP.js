/**
 * Copyright 2018 Signal K and contributors.
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

const Parser = require('../lib')
const chai = require("chai")
const should = chai.Should()
chai.use(require('@signalk/signalk-schema').chaiModule)
const toFull = require("./toFull")

chai.use(require("chai-things"))

describe("PNKEP", () => {
  it("Polarspeed data ", () => {
    const delta = new Parser().parse('$PNKEP,01,8.3,N,15.5,K*52')
      delta.updates[0].values.should.contain.an.item.with.property(
        "path",
        "performance.targetSpeed"
      )
      delta.updates[0].values[0].value.should.be.closeTo(
        4.269889970594349,
        0.0005
      )
      toFull(delta).should.be.validSignalK
    })

  it("Course on next track data", () => {
    const delta = new Parser().parse("$PNKEP,02,344.4*6B")

      delta.updates[0].values.should.contain.an.item.with.property(
        "path",
        "performance.tackMagnetic"
      )
      delta.updates[0].values[0].value.should.be.closeTo(6.0109139439, 0.00005)
      toFull(delta).should.be.validSignalK
    })

  it("Direction data", () => {
    const delta = new Parser().parse("$PNKEP,03,152.0,55.2,67.1*69")

      delta.updates[0].values.should.contain.an.item.with.property(
        "path",
        "performance.targetAngle"
      )
      delta.updates[0].values[0].value.should.be.closeTo(2.652900463, 0.00005)
      toFull(delta).should.be.validSignalK
  })
})
