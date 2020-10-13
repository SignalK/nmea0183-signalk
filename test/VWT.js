'use strict'

const Parser = require('../lib')
const chai = require('chai')
const should = chai.Should()

chai.use(require('chai-things'))

describe('VWT', () => {
    it('speed & direction data (#1)', () => {
	const delta = new Parser().parse('$IIVWT,030.,R,10.1,N,05.2,M,018.7,K*75')
	
	delta.updates[0].values[0].path.should.equal('environment.wind.speedTrue')
	delta.updates[0].values[0].value.should.equal(5.2)
	delta.updates[0].values[1].path.should.equal('environment.wind.angleTrueWater')
	delta.updates[0].values[1].value.should.be.closeTo(0.523599, 0.005)
    })

    it('speed & direction data (#2)', () => {
	const delta = new Parser().parse('$IIVWT,180.,R,10.1,N,05.2,M,018.7,K*7F')
	
	delta.updates[0].values[0].path.should.equal('environment.wind.speedTrue')
	delta.updates[0].values[0].value.should.equal(5.2)
	delta.updates[0].values[1].path.should.equal('environment.wind.angleTrueWater')
	delta.updates[0].values[1].value.should.be.closeTo(3.1415, 0.005)
    })

    it('speed & direction data (#3)', () => { // 190R = 170L
	const delta = new Parser().parse('$IIVWT,190.,R,10.1,N,05.2,M,018.7,K*7E')
	
	delta.updates[0].values[0].path.should.equal('environment.wind.speedTrue')
	delta.updates[0].values[0].value.should.equal(5.2)
	delta.updates[0].values[1].path.should.equal('environment.wind.angleTrueWater')
	delta.updates[0].values[1].value.should.be.closeTo(-2.967, 0.005)
    })

    it('speed & direction data (#4)', () => { 
	const delta = new Parser().parse('$IIVWT,170.,L,10.1,N,05.2,M,018.7,K*6E')
	
	delta.updates[0].values[0].path.should.equal('environment.wind.speedTrue')
	delta.updates[0].values[0].value.should.equal(5.2)
	delta.updates[0].values[1].path.should.equal('environment.wind.angleTrueWater')
	delta.updates[0].values[1].value.should.be.closeTo(-2.967, 0.005)
    })

    it('speed & direction data (#5)', () => { // 170 + 360 = 530
	const delta = new Parser().parse('$IIVWT,530.,L,10.1,N,05.2,M,018.7,K*6E')
	
	delta.updates[0].values[0].path.should.equal('environment.wind.speedTrue')
	delta.updates[0].values[0].value.should.equal(5.2)
	delta.updates[0].values[1].path.should.equal('environment.wind.angleTrueWater')
	delta.updates[0].values[1].value.should.be.closeTo(-2.967, 0.005)
    })

    it('missing speed data (#1)', () => {
	const delta = new Parser().parse('$IIVWT,030.,R,,N,05.2,M,018.7,*20')
	
	delta.updates[0].values[0].path.should.equal('environment.wind.speedTrue')
	delta.updates[0].values[0].value.should.equal(5.2)
	delta.updates[0].values[1].path.should.equal('environment.wind.angleTrueWater')
	delta.updates[0].values[1].value.should.be.closeTo(0.523599, 0.005)
    })

    it('missing speed data (#2)', () => {
	const delta = new Parser().parse('$IIVWT,030.,R,10.1,N,,,018.7,K*21')
	
	delta.updates[0].values[0].path.should.equal('environment.wind.speedTrue')
	delta.updates[0].values[0].value.should.be.closeTo(5.2, 0.05)
	delta.updates[0].values[1].path.should.equal('environment.wind.angleTrueWater')
	delta.updates[0].values[1].value.should.be.closeTo(0.523599, 0.005)
    })

    it('missing speed data (#3)', () => {
	const delta = new Parser().parse('$IIVWT,030.,R,10.1,N,,,,K*01')
	
	delta.updates[0].values[0].path.should.equal('environment.wind.speedTrue')
	delta.updates[0].values[0].value.should.be.closeTo(5.2, 0.05)
	delta.updates[0].values[1].path.should.equal('environment.wind.angleTrueWater')
	delta.updates[0].values[1].value.should.be.closeTo(0.523599, 0.005)
    })

    it('missing direction data (#1)', () => {
	const delta = new Parser().parse('$IIVWT,,R,10.1,N,,,,K*1C')
	
	should.equal(delta,null);
    })

    it('missing direction data (#2)', () => {
	const delta = new Parser().parse('$IIVWT,0.0,,10.1,N,,,,K*60')
	
	should.equal(delta,null);
    })

    it('improper direction designator (#1)', () => {
	const delta = new Parser().parse('$IIVWT,030.,r,10.1,N,05.2,M,018.7,K*55')

	should.equal(delta,null);
    })

    it('improper speed designator (#1)', () => {
	const delta = new Parser().parse('$IIVWT,030.,R,10.1,X,05.2,M,018.7,X*70')

	delta.updates[0].values[0].path.should.equal('environment.wind.speedTrue')
	delta.updates[0].values[0].value.should.equal(5.2)
	delta.updates[0].values[1].path.should.equal('environment.wind.angleTrueWater')
	delta.updates[0].values[1].value.should.be.closeTo(0.523599, 0.005)
    })

    it('improper speed designator (#2)', () => {
	const delta = new Parser().parse('$IIVWT,030.,R,10.1,N,05.2,X,018.7,K*60')

	delta.updates[0].values[0].path.should.equal('environment.wind.speedTrue')
	delta.updates[0].values[0].value.should.be.closeTo(5.2, 0.05)
	delta.updates[0].values[1].path.should.equal('environment.wind.angleTrueWater')
	delta.updates[0].values[1].value.should.be.closeTo(0.523599, 0.005)
    })

    it('improper speed designator (#3)', () => {
	const delta = new Parser().parse('$IIVWT,030.,R,10.1,X,05.2,X,018.7,X*65')

	should.equal(delta,null);
    })

    it('Doesn\'t choke on empty sentences', () => {
	const delta = new Parser().parse('$IIVWT,,,,*55')
	should.equal(delta, null)
    })

})
