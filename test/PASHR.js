/**
 * Copyright 2016 Signal K and contributors.
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

'use strict'

const Parser = require('../lib')
const chai = require('chai')
const { expect } = require('chai')
const utils = require('@signalk/nmea0183-utilities')

chai.Should()

chai.use(require('chai-things'))

// {
//   path: 'navigation.headingTrue',
//   value: utils.transform(utils.float(state.trueHeading), 'deg', 'rad'),
// },
// {
//   path: 'balance.rollAngle',
//   value: utils.transform(utils.float(state.rollAngle), 'deg', 'rad'),
// },
// {
//   path: 'balance.pitchAngle',
//   value: utils.transform(utils.float(state.pitchAngle), 'deg', 'rad'),
// },
// {
//   path: 'balance.rollAngleAccuracy',
//   value: utils.float(state.rollAngleAccuracy),
// },
// {
//   path: 'balance.pitchAngleAccuracy',
//   value: utils.float(state.pitchAngleAccuracy),
// }


describe('PASHR', () => {
  it('Should understand full trame', () => {
    const delta = new Parser().parse('$PASHR,225444.123,125.12,T,12.45,11.91,xxx.xx,1.123,1.456,2.653,1,4*56')
    delta.should.be.an('object')

    testAllKeys(delta)

    // headingTrue
    delta.updates[0].values[0].value.should.be.closeTo(
      2, 18166156,
      0.01
    )

    // rollAngle
    delta.updates[0].values[1].value.should.be.closeTo(
      0, 2712,
      0.01
    )

    // pitchAngle
    delta.updates[0].values[2].value.should.be.closeTo(
      0, 2078,
      0.01
    )

    // rollAngleAccuracy
    delta.updates[0].values[3].value.should.be.closeTo(
      0.0196,
      0.01
    )

    // pitchAngleAccuracy
    delta.updates[0].values[4].value.should.be.closeTo(
      0.0254,
      0.01
    )

    // headingTrueAccuracy
    delta.updates[0].values[5].value.should.be.closeTo(
      0.0463,
      0.01
    )
  })


    it('Should dont set heading if the flag isnt present', () => {
    const delta = new Parser().parse('$PASHR,225444.123,125.12,,12.45,11.91,xxx.xx,1.123,1.456,2.653,1,4*02')
    delta.should.be.an('object')

    testAllKeys(delta)

    // headingTrue
    expect(delta.updates[0].values[0].value).to.be.null

    // rollAngle
    delta.updates[0].values[1].value.should.be.closeTo(
      0, 2712,
      0.01
    )

    // pitchAngle
    delta.updates[0].values[2].value.should.be.closeTo(
      0, 2078,
      0.01
    )

    // rollAngleAccuracy
    delta.updates[0].values[3].value.should.be.closeTo(
      0.0196,
      0.01
    )

    // pitchAngleAccuracy
    delta.updates[0].values[4].value.should.be.closeTo(
      0.0254,
      0.01
    )

    // headingTrueAccuracy
        expect(delta.updates[0].values[5].value).to.be.null
  })



})


function testAllKeys(delta) {
  delta.updates[0].values.should.contain.an.item.with.property(
    "path",
    'navigation.headingTrue',
  )

  delta.updates[0].values.should.contain.an.item.with.property(
    "path",
    'balance.rollAngle',
  )
  delta.updates[0].values.should.contain.an.item.with.property(
    "path",
    'balance.pitchAngle',
  )
  delta.updates[0].values.should.contain.an.item.with.property(
    "path",
    'balance.rollAngleAccuracy',
  )
  delta.updates[0].values.should.contain.an.item.with.property(
    "path",
    'balance.pitchAngleAccuracy',
  )
}