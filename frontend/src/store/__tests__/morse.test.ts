/// <reference types="vitest" />
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useMorseStore } from '../morse'
import { MORSE_TABLE } from '../../utils/morse-code'

vi.mock('../../utils/morse-code', async () => {
  const actual = await vi.importActual('../../utils/morse-code')
  return {
    ...actual,
  }
})

class MockAudioContext {
  createOscillator() {
    return {
      type: '',
      frequency: { value: 0 },
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    }
  }
  createGain() {
    return {
      gain: { value: 0 },
      connect: vi.fn(),
    }
  }
  destination = {}
}

;(globalThis as any).AudioContext = MockAudioContext

describe('Morse Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('initial state', () => {
    it('should have correct initial values', () => {
      const store = useMorseStore()
      expect(store.inputText).toBe('')
      expect(store.morseOutput).toBe('')
      expect(store.decodedText).toBe('')
      expect(store.wpm).toBe(15)
      expect(store.frequency).toBe(700)
      expect(store.volume).toBe(0.6)
      expect(store.score.correct).toBe(0)
      expect(store.score.total).toBe(0)
      expect(store.history).toEqual([])
      expect(store.quizChar).toBe('')
      expect(store.userAnswer).toBe('')
      expect(store.isPlaying).toBe(false)
    })

    it('should calculate correct dot duration for 15 wpm', () => {
      const store = useMorseStore()
      expect(store.dotDuration).toBe(80)
    })

    it('should calculate correct dot duration for 20 wpm', () => {
      const store = useMorseStore()
      store.wpm = 20
      expect(store.dotDuration).toBe(60)
    })
  })

  describe('encode', () => {
    it('should encode text to morse code', () => {
      const store = useMorseStore()
      store.inputText = 'SOS'
      store.encode()
      expect(store.morseOutput).toBe('... --- ...')
    })

    it('should handle empty input', () => {
      const store = useMorseStore()
      store.inputText = ''
      store.encode()
      expect(store.morseOutput).toBe('')
    })
  })

  describe('decode', () => {
    it('should decode morse code to text', () => {
      const store = useMorseStore()
      store.inputText = '... --- ...'
      store.decode()
      expect(store.decodedText).toBe('SOS')
    })

    it('should handle empty input', () => {
      const store = useMorseStore()
      store.inputText = ''
      store.decode()
      expect(store.decodedText).toBe('')
    })
  })

  describe('training mode', () => {
    it('generateQuiz should select a valid character', () => {
      const store = useMorseStore()
      store.generateQuiz()
      expect(store.quizChar).toMatch(/^[A-Z0-9]$/)
      expect(store.userAnswer).toBe('')
    })

    it('generateQuiz should generate different characters over multiple calls', () => {
      const store = useMorseStore()
      const chars = new Set()
      for (let i = 0; i < 50; i++) {
        store.generateQuiz()
        chars.add(store.quizChar)
      }
      expect(chars.size).toBeGreaterThan(1)
    })

    it('checkAnswer should mark correct answer', () => {
      const store = useMorseStore()
      store.generateQuiz()
      const correctCode = MORSE_TABLE[store.quizChar]
      store.userAnswer = correctCode
      store.checkAnswer()
      expect(store.score.correct).toBe(1)
      expect(store.score.total).toBe(1)
      expect(store.history.length).toBe(1)
      expect(store.history[0].correct).toBe(true)
      expect(store.history[0].input).toBeDefined()
      expect(store.history[0].output).toBe(correctCode)
    })

    it('checkAnswer should mark incorrect answer', () => {
      const store = useMorseStore()
      store.generateQuiz()
      store.userAnswer = '---'
      const correctCode = MORSE_TABLE[store.quizChar]
      const expectedCorrect = correctCode === '---'
      store.checkAnswer()
      expect(store.score.correct).toBe(expectedCorrect ? 1 : 0)
      expect(store.score.total).toBe(1)
      expect(store.history.length).toBe(1)
      expect(store.history[0].correct).toBe(expectedCorrect)
    })

    it('checkAnswer should trim whitespace from answer', () => {
      const store = useMorseStore()
      store.generateQuiz()
      const correctCode = MORSE_TABLE[store.quizChar]
      store.userAnswer = `  ${correctCode}  `
      store.checkAnswer()
      expect(store.score.correct).toBe(1)
    })

    it('checkAnswer should generate next quiz', () => {
      const store = useMorseStore()
      store.generateQuiz()
      const firstChar = store.quizChar
      store.userAnswer = MORSE_TABLE[firstChar]
      store.checkAnswer()
      expect(store.quizChar).toBeDefined()
      expect(store.userAnswer).toBe('')
    })

    it('should accumulate score over multiple answers', () => {
      const store = useMorseStore()
      for (let i = 0; i < 5; i++) {
        store.generateQuiz()
        store.userAnswer = MORSE_TABLE[store.quizChar]
        store.checkAnswer()
      }
      expect(store.score.correct).toBe(5)
      expect(store.score.total).toBe(5)
      expect(store.history.length).toBe(5)
    })

    it('resetScore should clear score and history', () => {
      const store = useMorseStore()
      store.generateQuiz()
      store.userAnswer = MORSE_TABLE[store.quizChar]
      store.checkAnswer()
      expect(store.score.total).toBe(1)
      expect(store.history.length).toBe(1)
      store.resetScore()
      expect(store.score.correct).toBe(0)
      expect(store.score.total).toBe(0)
      expect(store.history).toEqual([])
    })

    it('history should be ordered newest first', () => {
      const store = useMorseStore()
      vi.useFakeTimers()
      for (let i = 0; i < 3; i++) {
        vi.advanceTimersByTime(10)
        store.generateQuiz()
        store.userAnswer = MORSE_TABLE[store.quizChar]
        store.checkAnswer()
      }
      vi.useRealTimers()
      expect(store.history.length).toBe(3)
      expect(store.history[0].id).toBeGreaterThan(store.history[1].id)
      expect(store.history[1].id).toBeGreaterThan(store.history[2].id)
    })

    it('history entries should have valid timestamps', () => {
      const store = useMorseStore()
      store.generateQuiz()
      store.userAnswer = MORSE_TABLE[store.quizChar]
      const before = Date.now()
      store.checkAnswer()
      const after = Date.now()
      expect(store.history[0].timestamp).toBeGreaterThanOrEqual(before)
      expect(store.history[0].timestamp).toBeLessThanOrEqual(after)
    })
  })

  describe('audio playback', () => {
    it('playTone should resolve after tone completes', async () => {
      vi.useFakeTimers()
      const store = useMorseStore()
      const promise = store.playTone(100)
      vi.advanceTimersByTime(100)
      await promise
      vi.useRealTimers()
    })

    it('playMorse should set isPlaying flag', async () => {
      vi.useFakeTimers()
      const store = useMorseStore()
      const playPromise = store.playMorse('.-')
      expect(store.isPlaying).toBe(true)
      for (let i = 0; i < 10; i++) {
        vi.advanceTimersByTime(200)
        await Promise.resolve()
      }
      await playPromise
      expect(store.isPlaying).toBe(false)
      vi.useRealTimers()
    })

    it('should not be playing initially', () => {
      const store = useMorseStore()
      expect(store.isPlaying).toBe(false)
    })
  })

  describe('settings', () => {
    it('should allow updating wpm', () => {
      const store = useMorseStore()
      store.wpm = 25
      expect(store.wpm).toBe(25)
      expect(store.dotDuration).toBe(48)
    })

    it('should allow updating frequency', () => {
      const store = useMorseStore()
      store.frequency = 800
      expect(store.frequency).toBe(800)
    })

    it('should allow updating volume', () => {
      const store = useMorseStore()
      store.volume = 0.8
      expect(store.volume).toBe(0.8)
    })
  })
})
