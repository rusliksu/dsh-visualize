import { describe, expect, it } from 'vitest'
import type { Context } from '@deepseek-ai/cordis'
import { nestedPresentation } from '../src/presentation.ts'
import { visualizeTool } from '../src/tool.ts'

describe('durable nested visualization presentation', () => {
  const session = {}
  const value = { action: 'update', path: '/work/viz/card.html', title: 'Updated', mode: 'inline', sizeBytes: 16, fragment: '<div>after</div>' }
  const content = [{ type: 'text', text: 'Patched card' }]
  const ctx = {
    get: (name: string) => name === 'sessionProjections' ? {
      stateOf: (target: unknown, key: string) => {
        expect(target).toBe(session)
        expect(key).toBe('turnBoundary')
        return { lastTurn: 2 }
      },
    } : undefined,
  } as unknown as Context
  const tool = visualizeTool(ctx, 1000)
  const exec = { parent: {}, callId: 'root:ptc:1', agent: { session } } as never
  const result = { isError: false, content, value } as never

  it('persists the completed patched fragment while preserving the SDK value', () => {
    const projected = tool.finalizeContent?.(exec, result)
    expect(projected?.[0]).toEqual({ type: 'text', text: 'Patched card' })
    expect(nestedPresentation(projected)).toEqual({
      turn: 2, callId: 'root:ptc:1',
      meta: { kind: 'visualize', path: '/work/viz/card.html', title: 'Updated', mode: 'inline', fragment: '<div>after</div>' },
    })
    expect(result).toEqual({ isError: false, content: [{ type: 'text', text: 'Patched card' }], value })
  })

  it('does not add presentation records to direct calls or failures', () => {
    expect(tool.finalizeContent?.({ callId: 'root', agent: { session } } as never, result)).toBeUndefined()
    expect(tool.finalizeContent?.(exec, { isError: true, content } as never)).toBeUndefined()
    const noProjection = visualizeTool({ get: () => undefined } as unknown as Context, 1000)
    expect(noProjection.finalizeContent?.(exec, result)).toBeUndefined()
  })

  it('ignores unrelated text and invalid presentation records', () => {
    for (const text of ['ordinary tool output', 'dsh-visualize/v1:{', 'dsh-visualize/v1:null',
      'dsh-visualize/v1:{"turn":1,"callId":"x","meta":{"kind":"other"}}']) {
      expect(nestedPresentation([{ type: 'text', text }])).toBeUndefined()
    }
  })
})
