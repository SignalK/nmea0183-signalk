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

import Parser from '../src/lib'
import * as chai from 'chai'
import chaiHasItem from './helpers/chai-has-item'
chai.Should()
chai.use(chaiHasItem as any)

const nmeaLine =
  '\\s:compass,c:1438489697*13\\$IIDBT,035.53,f,010.83,M,005.85,F*23'

describe('NMEA0183v4 tag block', () => {
  it('Converts OK using individual parser', () => {
    const delta = new Parser().parse(nmeaLine) as any

    delta.updates[0]!.source.should.be.an('object')
    delta.updates[0]!.source.talker.should.equal('compass')
    delta.updates[0]!.timestamp.should.equal('2015-08-02T04:28:17.000Z')
    delta.updates[0]!.values.should.containItemWithProperty(
      'path',
      'environment.depth.belowTransducer'
    )
  })

  it('Accepts a tag block in front of an AIS "!" sentence', () => {
    const line =
      '\\s:ais,c:1438489697*20\\!AIVDM,1,1,,B,13aGra0P00PHid>NK9<2FOvHR624,0*3E'
    const delta = new Parser().parse(line) as any
    delta.updates[0]!.source.talker.should.equal('ais')
    delta.updates[0]!.timestamp.should.equal('2015-08-02T04:28:17.000Z')
  })

  it('Second-millennium 10-digit epoch tags convert to seconds', () => {
    // 10-digit epoch (seconds, not ms) should be multiplied by 1000
    const line = '\\c:1438489697*5F\\$IIDBT,035.53,f,010.83,M,005.85,F*23'
    const delta = new Parser().parse(line) as any
    delta.updates[0]!.timestamp.should.equal('2015-08-02T04:28:17.000Z')
  })
})
