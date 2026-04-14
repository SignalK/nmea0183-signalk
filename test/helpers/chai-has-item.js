'use strict'

// Minimal chai plugin that replaces the two chai-things assertions used in
// this repo's test suite. chai-things (last released 2014) only works with
// the chai 4 plugin API, so it blocks upgrading chai to 5.x / 6.x.
//
// Provides two BDD-style assertions:
//
//   arr.should.containItemWithProperty('path', 'navigation.position')
//     -> replaces: arr.should.contain.an.item.with.property('path', 'navigation.position')
//
//   arr.should.containItemMatching({ path: 'x', value: null })
//     -> replaces: arr.should.contain.an.item({ path: 'x', value: null })
//
// Both assertions pass when at least one element in the array matches.
// Property comparison uses chai's deep-equality helper so object and array
// values work the same way chai-things used to handle them.

module.exports = function chaiHasItem(chai, utils) {
  const Assertion = chai.Assertion
  const eql = utils.eql

  Assertion.addMethod('containItemWithProperty', function (prop, value) {
    const arr = this._obj
    new Assertion(arr).to.be.an('array')

    const checkValue = arguments.length >= 2
    const matches = arr.filter(function (item) {
      if (item == null || typeof item !== 'object') return false
      if (!(prop in item)) return false
      if (!checkValue) return true
      return eql(item[prop], value)
    })

    this.assert(
      matches.length > 0,
      'expected #{this} to contain an item with property ' +
        JSON.stringify(prop) +
        (checkValue ? ' = ' + JSON.stringify(value) : ''),
      'expected #{this} not to contain an item with property ' +
        JSON.stringify(prop) +
        (checkValue ? ' = ' + JSON.stringify(value) : ''),
      value,
      undefined,
      true
    )
  })

  Assertion.addMethod('containItemMatching', function (partial) {
    const arr = this._obj
    new Assertion(arr).to.be.an('array')
    new Assertion(partial).to.be.an('object')

    const keys = Object.keys(partial)
    const matches = arr.filter(function (item) {
      if (item == null || typeof item !== 'object') return false
      return keys.every(function (k) {
        return eql(item[k], partial[k])
      })
    })

    this.assert(
      matches.length > 0,
      'expected #{this} to contain an item matching ' + JSON.stringify(partial),
      'expected #{this} not to contain an item matching ' +
        JSON.stringify(partial),
      partial,
      undefined,
      true
    )
  })
}
