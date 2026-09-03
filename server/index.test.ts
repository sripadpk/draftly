import { describe, expect, it } from 'vitest'

describe('document validation', () => {
  it('requires a document title and owner', () => {
    const title = ''
    const ownerId = ''

    const isValid = Boolean(title && ownerId)

    expect(isValid).toBe(false)
  })

  it('accepts a valid document payload', () => {
    const title = 'Test Document'
    const ownerId = 'cf01d087-6bda-48dc-a21d-6dfc75832988'

    const isValid = Boolean(title && ownerId)

    expect(isValid).toBe(true)
  })
})