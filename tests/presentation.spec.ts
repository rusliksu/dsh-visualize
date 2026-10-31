import { describe, expect, it } from 'vitest'
import { PRESENTATION_PREFIX, nestedPresentation } from '../src/presentation.ts'

const meta = { kind: 'visualize', fragment: '<div id="x"></div>', title: 'X', mode: 'inline', path: 'viz/x.html', style: 'editorial' }

function record(overrides: Record<string, unknown> = {}): string {
  return PRESENTATION_PREFIX + JSON.stringify({ turn: 3, callId: 'call-1', meta, ...overrides })
}

describe('nestedPresentation', () => {
  it('rebuilds the presentation record from a durable text block', () => {
    const found = nestedPresentation([{ type: 'text', text: 'Visualize · inline' }, { type: 'text', text: record() }])
    expect(found?.turn).toBe(3)
    expect(found?.callId).toBe('call-1')
    expect(found?.meta.path).toBe('viz/x.html')
    expect(found?.meta.style).toBe('editorial')
  })

  it('ignores content without the versioned record and non-array input', () => {
    expect(nestedPresentation([{ type: 'text', text: 'plain result' }])).toBeUndefined()
    expect(nestedPresentation(undefined)).toBeUndefined()
    expect(nestedPresentation('text')).toBeUndefined()
  })

  it('skips damaged JSON and keeps looking for a valid record', () => {
    const damaged = [{ type: 'text', text: PRESENTATION_PREFIX + '{oops' }, { type: 'text', text: record() }]
    expect(nestedPresentation(damaged)?.callId).toBe('call-1')
  })

  it('declines a record whose meta no longer narrows to a card', () => {
    expect(nestedPresentation([{ type: 'text', text: record({ meta: { ...meta, kind: 'artifact' } }) }])).toBeUndefined()
  })

  it('declines a negative or non-integer turn', () => {
    expect(nestedPresentation([{ type: 'text', text: record({ turn: -1 }) }])).toBeUndefined()
    expect(nestedPresentation([{ type: 'text', text: record({ turn: 1.5 }) }])).toBeUndefined()
  })
})
