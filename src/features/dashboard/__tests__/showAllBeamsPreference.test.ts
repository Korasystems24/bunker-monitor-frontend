import { afterEach, describe, expect, it } from 'vitest'
import {
  readShowAllExceptDisabled,
  writeShowAllExceptDisabled,
} from '../showAllBeamsPreference'

describe('showAllBeamsPreference', () => {
  afterEach(() => {
    localStorage.clear()
  })

  it('stays off when nothing has been saved', () => {
    expect(readShowAllExceptDisabled()).toBe(false)
  })

  it('restores a saved checked state and a saved unchecked state', () => {
    writeShowAllExceptDisabled(true)
    expect(readShowAllExceptDisabled()).toBe(true)

    writeShowAllExceptDisabled(false)
    expect(readShowAllExceptDisabled()).toBe(false)
  })

  it('ignores any stored value other than "true"', () => {
    localStorage.setItem('bunker-monitor.showAllExceptDisabled', 'yes')
    expect(readShowAllExceptDisabled()).toBe(false)
  })
})
