'use strict'

/**
 * Copyright 2019 Signal K and contributors.
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

const Parser = require('../lib');
const chai = require('chai');
const should = chai.Should();

chai.use(require('chai-things'));
chai.use(require('@signalk/signalk-schema').chaiModule);

const toFull = require('./toFull');

describe('PASHR', () => {
	it('Converts OK using individual parser', () => {
		const delta = new Parser().parse('$PASHR,123816.80,312.95,T,-0.83,-0.42,-0.01,0.234,0.224,0.298,2,1*0B');

		should.not.exist(delta.updates[0].source.label);
		delta.updates[0].source.talker.should.equal('PA');
		// Paths
		delta.updates[0].values.should.contain.an.item.with.property('path', 'navigation.attitude');
		delta.updates[0].values.should.contain.an.item.with.property('path', 'navigation.attitude.accuracy');
		delta.updates[0].values.should.contain.an.item.with.property('path', 'navigation.attitude.heading');
		delta.updates[0].values.should.contain.an.item.with.property('path', 'navigation.attitude.heading.true');
		delta.updates[0].values.should.contain.an.item.with.property('path', 'navigation.attitude.heave');
		delta.updates[0].values.should.contain.an.item.with.property('path', 'navigation.attitude.aid');
		delta.updates[0].values.should.contain.an.item.with.property('path', 'navigation.attitude.status');
		// Values
		delta.updates[0].values[0].value.should.deep.equal({ heading: 312.95, roll: -0.83, pitch: -0.42 });
		delta.updates[0].values[1].value.should.deep.equal({ heading: 0.298, roll: 0.234, pitch: 0.224 });
		delta.updates[0].values[2].value.should.deep.equal({ heading: 312.95, true: true });
		delta.updates[0].values[3].value.should.equal(true);
		delta.updates[0].values[4].value.should.equal(-0.01);
		delta.updates[0].values[5].value.should.equal('RTK fixed integer position');
		delta.updates[0].values[6].value.should.equal('Post-Alignment');
		toFull(delta).should.be.validSignalK
	});

	it('Doesn\'t choke on empty sentences', () => {
		const delta = new Parser().parse('$PASHR,,,,,,,,,,,*74');
		should.equal(delta, null)
	})
});