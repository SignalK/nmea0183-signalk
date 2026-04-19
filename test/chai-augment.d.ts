/**
 * chai v5 dropped the ambient `Object.prototype.should` augmentation that
 * chai v4 used to ship. At runtime `chai.Should()` still installs `should`
 * on Object.prototype, so the existing BDD-style assertions still work.
 * This file reintroduces the compile-time augmentation so the test files
 * read naturally under strict mode.
 */

import type { Should } from 'chai'

declare global {
  interface Object {
    should: Should
  }
  interface Function {
    should: Should
  }
  interface Boolean {
    should: Should
  }
  interface Number {
    should: Should
  }
  interface String {
    should: Should
  }
  interface Array<T> {
    should: Should
  }
}

export {}
