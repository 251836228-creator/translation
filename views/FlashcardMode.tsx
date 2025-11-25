import React, { useState } from 'react';
import { SearchResult } from '../types';
import { Button } from '../components/Button';

interface FlashcardModeProps {
  words: SearchResult[];
  onExit: () => void;
}

export const FlashcardMode: React.FC<FlashcardModeProps> = ({ words, onExit }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const currentWord = words[currentIndex];

  const handleNext = () => {
    setIsFlipped(false);
    setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % words.length);
    }, 200); // Wait for unflip if needed, though instant is better for UX
  };

  const handlePrev = () => {
    setIsFlipped(false);
     setTimeout(() => {
        setCurrentIndex((prev) => (prev - 1 + words.length) % words.length);
     }, 200);
  };

  return (
    <div className="h-full flex flex-col bg-pop-green/10 p-6 relative">
      <div className="flex justify-between items-center mb-6">
          <Button variant="ghost" onClick={onExit}><i className="fas fa-times"></i></Button>
          <span className="font-bold text-pop-green uppercase tracking-widest text-sm">Flashcards {currentIndex + 1}/{words.length}</span>
          <div className="w-8"></div> {/* Spacer */}
      </div>

      <div className="flex-1 flex items-center justify-center perspective-1000">
        <div 
            className={`relative w-full h-[400px] cursor-pointer transition-transform duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}
            onClick={() => setIsFlipped(!isFlipped)}
        >
            {/* Front */}
            <div className="absolute w-full h-full bg-white rounded-3xl border-4 border-black shadow-hard flex flex-col items-center justify-center p-6 backface-hidden z-10">
                <div className="w-full h-40 bg-gray-100 rounded-xl mb-6 overflow-hidden border border-gray-200">
                    {currentWord.imageUrl ? (
                        <img src={currentWord.imageUrl} alt="concept" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300 text-4xl">?</div>
                    )}
                </div>
                <h2 className="text-4xl font-black text-center break-all">{currentWord.term}</h2>
                <p className="text-sm text-gray-400 mt-2">Tap to flip</p>
            </div>

            {/* Back */}
            <div className="absolute w-full h-full bg-pop-green text-white rounded-3xl border-4 border-black shadow-hard flex flex-col items-center justify-center p-8 backface-hidden rotate-y-180 overflow-y-auto text-center">
                 <h3 className="text-2xl font-bold mb-4 border-b-2 border-white/30 pb-2 w-full">{currentWord.explanation}</h3>
                 
                 {currentWord.examples[0] && (
                     <div className="bg-black/10 p-3 rounded-lg text-sm w-full">
                         <p className="font-bold mb-1">"{currentWord.examples[0].original}"</p>
                         <p className="opacity-80 italic">{currentWord.examples[0].translation}</p>
                     </div>
                 )}
            </div>
        </div>
      </div>

      <div className="flex justify-between items-center mt-8">
          <Button variant="secondary" onClick={handlePrev} className="rounded-full w-12 h-12 !p-0"><i className="fas fa-arrow-left"></i></Button>
          <Button variant="secondary" onClick={handleNext} className="rounded-full w-12 h-12 !p-0"><i className="fas fa-arrow-right"></i></Button>
      </div>
    </div>
  );
};