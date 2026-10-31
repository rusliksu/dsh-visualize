import { describe, expect, it } from 'vitest'
import { EN, RU, ZH, settingsLang, translator, type SettingsKey } from '../src/client/settings-locale.ts'

describe('settings locale', () => {
  it('routes the Russian host locale to the Russian page', () => {
    expect(settingsLang('ru-RU')).toBe('ru')
    expect(settingsLang('en-US')).toBe('en')
    expect(settingsLang('zh-CN')).toBe('zh')
    expect(settingsLang(undefined)).toBe('zh')
  })

  it('keeps every key translated in all shipped languages', () => {
    for (const key of Object.keys(EN) as SettingsKey[]) {
      expect(RU[key], key).toBeTruthy()
      expect(ZH[key], key).toBeTruthy()
    }
  })

  it('fills placeholders in the Russian copy', () => {
    expect(translator('ru')('saved', { style: 'Кит' })).toContain('Кит')
    expect(translator('ru')('bytes', { bytes: 12, max: 4096 })).toBe('12 / 4096 байт')
  })
})
