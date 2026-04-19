/**
 * Minimal chai plugin that replaces the two chai-things assertions used in
 * this repo's test suite. chai-things (last released 2014) only works with
 * the chai 4 plugin API, so it blocks upgrading chai to 5.x / 6.x.
 *
 * Provides two BDD-style assertions:
 *
 *   arr.should.containItemWithProperty('path', 'navigation.position')
 *     -> replaces: arr.should.contain.an.item.with.property('path', 'navigation.position')
 *
 *   arr.should.containItemMatching({ path: 'x', value: null })
 *     -> replaces: arr.should.contain.an.item({ path: 'x', value: null })
 *
 * Both assertions pass when at least one element in the array matches.
 * Property comparison uses chai's deep-equality helper so object and array
 * values work the same way chai-things used to handle them.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyObj = any

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Chai {
    interface Assertion {
      containItemWithProperty(prop: string, value?: unknown): Assertion
      containItemMatching(partial: Record<string, unknown>): Assertion
    }
  }
}

const chaiHasItem = function (chai: AnyObj, utils: AnyObj): void {
  const Assertion = chai.Assertion
  const eql = utils.eql

  Assertion.addMethod(
    'containItemWithProperty',
    function (this: AnyObj, prop: string, value?: unknown) {
      const arr = this._obj
      new Assertion(arr).to.be.an('array')

      const checkValue = arguments.length >= 2
      const matches = arr.filter((item: AnyObj) => {
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
    }
  )

  Assertion.addMethod(
    'containItemMatching',
    function (this: AnyObj, partial: Record<string, unknown>) {
      const arr = this._obj
      new Assertion(arr).to.be.an('array')
      new Assertion(partial).to.be.an('object')

      const keys = Object.keys(partial)
      const matches = arr.filter((item: AnyObj) => {
        if (item == null || typeof item !== 'object') return false
        return keys.every((k) => eql(item[k], partial[k]))
      })

      this.assert(
        matches.length > 0,
        'expected #{this} to contain an item matching ' +
          JSON.stringify(partial),
        'expected #{this} not to contain an item matching ' +
          JSON.stringify(partial),
        partial,
        undefined,
        true
      )
    }
  )
}

export default chaiHasItem
module.exports = chaiHasItem
module.exports.default = chaiHasItem
