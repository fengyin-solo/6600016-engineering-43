/// <reference types="vitest" />
import { describe, it, expect } from 'vitest'
import { MORSE_TABLE, REVERSE_TABLE, textToMorse, morseToText } from '../morse-code'

describe('MORSE_TABLE', () => {
  it('should contain all uppercase letters A-Z', () => {
    for (let i = 65; i <= 90; i++) {
      const char = String.fromCharCode(i)
      expect(MORSE_TABLE[char]).toBeDefined()
      expect(typeof MORSE_TABLE[char]).toBe('string')
      expect(MORSE_TABLE[char].length).toBeGreaterThan(0)
    }
  })

  it('should contain all digits 0-9', () => {
    for (let i = 0; i <= 9; i++) {
      const char = String(i)
      expect(MORSE_TABLE[char]).toBeDefined()
      expect(typeof MORSE_TABLE[char]).toBe('string')
      expect(MORSE_TABLE[char].length).toBe(5)
    }
  })

  it('should contain common punctuation marks', () => {
    const expectedPunctuation = ['.', ',', '?', '!', '/', '(', ')', '&', ':', ';', '=', '+', '-', '_', '"', '$', '@']
    expectedPunctuation.forEach(punct => {
      expect(MORSE_TABLE[punct]).toBeDefined()
    })
  })

  it('should use / for space character', () => {
    expect(MORSE_TABLE[' ']).toBe('/')
  })

  it('should only contain valid morse symbols (., -, /)', () => {
    Object.values(MORSE_TABLE).forEach(code => {
      expect(code).toMatch(/^[.\-\/]+$/)
    })
  })
})

describe('REVERSE_TABLE', () => {
  it('should be the exact inverse of MORSE_TABLE', () => {
    Object.entries(MORSE_TABLE).forEach(([char, code]) => {
      expect(REVERSE_TABLE[code]).toBe(char)
    })
  })

  it('should have the same number of entries as MORSE_TABLE', () => {
    expect(Object.keys(REVERSE_TABLE).length).toBe(Object.keys(MORSE_TABLE).length)
  })
})

describe('textToMorse', () => {
  it('should convert simple text to morse code', () => {
    expect(textToMorse('SOS')).toBe('... --- ...')
    expect(textToMorse('A')).toBe('.-')
    expect(textToMorse('B')).toBe('-...')
  })

  it('should handle lowercase input by converting to uppercase', () => {
    expect(textToMorse('sos')).toBe('... --- ...')
    expect(textToMorse('hello')).toBe('.... . .-.. .-.. ---')
  })

  it('should handle spaces between words', () => {
    expect(textToMorse('A B')).toBe('.- / -...')
  })

  it('should handle multiple words', () => {
    expect(textToMorse('HELLO WORLD')).toBe('.... . .-.. .-.. --- / .-- --- .-. .-.. -..')
  })

  it('should return empty string for unsupported characters', () => {
    expect(textToMorse('#')).toBe('')
    expect(textToMorse('A#B')).toBe('.-  -...')
  })

  it('should handle empty string', () => {
    expect(textToMorse('')).toBe('')
  })

  it('should handle numbers correctly', () => {
    expect(textToMorse('123')).toBe('.---- ..--- ...--')
  })

  it('should handle punctuation correctly', () => {
    expect(textToMorse('HI!')).toBe('.... .. -.-.--')
  })

  it('should handle full sentences', () => {
    expect(textToMorse('I AM HERE.')).toBe('.. / .- -- / .... . .-. . .-.-.-')
  })
})

describe('morseToText', () => {
  it('should convert morse code to text', () => {
    expect(morseToText('... --- ...')).toBe('SOS')
    expect(morseToText('.-')).toBe('A')
    expect(morseToText('-...')).toBe('B')
  })

  it('should handle word separators (/)', () => {
    expect(morseToText('.- / -...')).toBe('A B')
  })

  it('should handle multiple words', () => {
    expect(morseToText('.... . .-.. .-.. --- / .-- --- .-. .-.. -..')).toBe('HELLO WORLD')
  })

  it('should return empty string for unknown codes', () => {
    expect(morseToText('......')).toBe('')
    expect(morseToText('.- ...... -...')).toBe('AB')
  })

  it('should handle empty string', () => {
    expect(morseToText('')).toBe('')
  })

  it('should handle numbers correctly', () => {
    expect(morseToText('.---- ..--- ...--')).toBe('123')
  })

  it('should handle punctuation correctly', () => {
    expect(morseToText('.... .. -.-.--')).toBe('HI!')
  })

  it('should handle full sentences', () => {
    expect(morseToText('.. / .- -- / .... . .-. . .-.-.-')).toBe('I AM HERE.')
  })
})

describe('roundtrip conversion', () => {
  it('should convert text to morse and back correctly', () => {
    const testCases = [
      'HELLO WORLD',
      'SOS',
      'THE QUICK BROWN FOX',
      '12345',
      'HELLO! HOW ARE YOU?',
      'I AM HERE.',
    ]

    testCases.forEach(text => {
      const morse = textToMorse(text)
      const decoded = morseToText(morse)
      expect(decoded).toBe(text)
    })
  })
})
