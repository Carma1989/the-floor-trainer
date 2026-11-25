// Web Speech API hook for vocal answer detection like on The Floor TV

import { useState, useEffect, useRef } from 'react';
import { checkAnswerMatch } from '../data/categories';

export function useSpeechRecognition({ active = false, currentItem = null, onCorrect = null }) {
  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef(null);
  const onCorrectRef = useRef(onCorrect);
  const currentItemRef = useRef(currentItem);
  const activeRef = useRef(active);
  const blockedRef = useRef(false);

  useEffect(() => {
    onCorrectRef.current = onCorrect;
    currentItemRef.current = currentItem;
    activeRef.current = active;
  }, [onCorrect, currentItem, active]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }
    setIsSupported(true);

    const recognition = new SpeechRecognition();
    recognition.lang = 'pl-PL';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 3;

    recognition.onresult = (event) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const spoken = event.results[i][0].transcript;
        finalTranscript += spoken;

        // Check if spoken word matches current target item
        if (currentItemRef.current && checkAnswerMatch(spoken, currentItemRef.current)) {
          if (onCorrectRef.current) {
            onCorrectRef.current();
          }
        }
      }
      setTranscript(finalTranscript);
    };

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => {
      // Auto-restart only if still active and not permission-blocked
      if (recognitionRef.current && activeRef.current && !blockedRef.current) {
        setTimeout(() => {
          if (recognitionRef.current && activeRef.current && !blockedRef.current) {
            try {
              recognition.start();
            } catch (e) {
              setIsListening(false);
            }
          }
        }, 250);
      } else {
        setIsListening(false);
      }
    };

    recognition.onerror = (e) => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed' || e.error === 'audio-capture') {
        blockedRef.current = true;
        setIsListening(false);
      } else if (e.error !== 'no-speech' && e.error !== 'aborted') {
        console.warn('Speech error:', e.error);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.warn('Could not start recognition', e);
      }
    }
  };

  useEffect(() => {
    if (!recognitionRef.current) return;
    if (active && !isListening) {
      try {
        recognitionRef.current.start();
      } catch (e) {}
    } else if (!active && isListening) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
  }, [active]);

  return {
    isSupported,
    isListening,
    transcript,
    toggleListening
  };
}
