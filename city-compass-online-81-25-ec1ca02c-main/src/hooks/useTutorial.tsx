
import { useState, useEffect } from 'react';

const TUTORIAL_ACCESS_COUNT_KEY = 'saj-tem-tutorial-access-count';
const MAX_TUTORIAL_SHOWS = 2;

export const useTutorial = () => {
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    const accessCount = parseInt(localStorage.getItem(TUTORIAL_ACCESS_COUNT_KEY) || '0');
    
    if (accessCount < MAX_TUTORIAL_SHOWS) {
      // Incrementa o contador de acessos
      localStorage.setItem(TUTORIAL_ACCESS_COUNT_KEY, (accessCount + 1).toString());
      
      const timer = setTimeout(() => {
        setShowTutorial(true);
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, []);

  const startTutorial = () => {
    setShowTutorial(true);
  };

  const closeTutorial = () => {
    setShowTutorial(false);
  };

  const resetTutorial = () => {
    localStorage.removeItem(TUTORIAL_ACCESS_COUNT_KEY);
    setShowTutorial(true);
  };

  return {
    showTutorial,
    startTutorial,
    closeTutorial,
    resetTutorial
  };
};
