import * as Speech from 'expo-speech';
import { SpeechCoordinator } from '@tap-o/core';
export const speech = new SpeechCoordinator({
  stop: () => Speech.stop(),
  speak: (text) => Speech.speak(text, { language: 'pt-BR', rate: 0.88, onError: () => {} }),
});
