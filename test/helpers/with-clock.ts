/**
 * Pins the clock (`Date.now()` and `new Date()`) to a fixed instant while
 * `fn` runs, then restores the real one. Sentences that carry only a time of
 * day are dated against the host clock, so pinning it is what makes midnight
 * edge cases reproducible. `fn` must be synchronous: the real clock is back as
 * soon as it returns, so code after an `await` would not see the pin.
 */

import { mock } from 'node:test'

function withClock<T>(iso: string, fn: () => T): T {
  mock.timers.enable({ apis: ['Date'], now: Date.parse(iso) })
  try {
    return fn()
  } finally {
    mock.timers.reset()
  }
}

export default withClock
