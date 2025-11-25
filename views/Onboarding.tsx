import React, { useState } from 'react';
import { LANGUAGES, Language, UserSettings } from '../types';
import { Button } from '../components/Button';

interface OnboardingProps {
  onComplete: (settings: UserSettings) => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [native, setNative] = useState<Language>(LANGUAGES[0]);
  const [target, setTarget] = useState<Language>(LANGUAGES[1]);

  const handleSubmit = () => {
    onComplete({ nativeLang: native, targetLang: target });
  };

  return (
    <div className="flex flex-col h-full p-8 justify-center bg-pop-purple/10">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-black text-pop-purple mb-2 drop-shadow-sm">LingoPop</h1>
        <p className="text-gray-600 font-medium">Your witty AI language buddy.</p>
      </div>

      <div className="space-y-6 bg-white p-6 rounded-3xl border-2 border-black shadow-hard">
        <div>
          <label className="block text-sm font-bold mb-2 uppercase tracking-wide text-gray-500">I speak</label>
          <div className="grid grid-cols-2 gap-2">
            {LANGUAGES.map(lang => (
              <button
                key={lang.code}
                onClick={() => setNative(lang)}
                className={`p-2 rounded-lg border-2 text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                  native.code === lang.code 
                  ? 'bg-pop-blue text-white border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] -translate-y-1' 
                  : 'bg-white border-gray-200 text-gray-400 hover:border-pop-blue'
                }`}
              >
                <span>{lang.flag}</span>
                <span>{lang.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-center text-gray-300">
            <i className="fas fa-arrow-down text-xl"></i>
        </div>

        <div>
          <label className="block text-sm font-bold mb-2 uppercase tracking-wide text-gray-500">I want to learn</label>
           <div className="grid grid-cols-2 gap-2">
            {LANGUAGES.map(lang => (
              <button
                key={lang.code}
                onClick={() => setTarget(lang)}
                className={`p-2 rounded-lg border-2 text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                  target.code === lang.code 
                  ? 'bg-pop-pink text-white border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] -translate-y-1' 
                  : 'bg-white border-gray-200 text-gray-400 hover:border-pop-pink'
                }`}
              >
                <span>{lang.flag}</span>
                <span>{lang.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="pt-4">
          <Button fullWidth onClick={handleSubmit} disabled={native.code === target.code}>
            Let's Go! 🚀
          </Button>
          {native.code === target.code && (
            <p className="text-xs text-red-500 text-center mt-2 font-bold">Please select different languages</p>
          )}
        </div>
      </div>
    </div>
  );
};