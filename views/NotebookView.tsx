import React, { useState } from 'react';
import { SearchResult, UserSettings } from '../types';
import { Button } from '../components/Button';
import { generateStoryFromList } from '../services/geminiService';

interface NotebookViewProps {
  savedWords: SearchResult[];
  settings: UserSettings;
  onSelectWord: (word: SearchResult) => void;
  onRemoveWord: (id: string) => void;
  onStudy: () => void;
}

export const NotebookView: React.FC<NotebookViewProps> = ({ savedWords, settings, onSelectWord, onRemoveWord, onStudy }) => {
  const [story, setStory] = useState<string | null>(null);
  const [loadingStory, setLoadingStory] = useState(false);

  const handleGenerateStory = async () => {
    if (savedWords.length < 3) return alert("Add at least 3 words to generate a story!");
    setLoadingStory(true);
    try {
      const generated = await generateStoryFromList(savedWords, settings.nativeLang);
      setStory(generated);
    } catch (e) {
      console.error(e);
      alert("Failed to weave a story.");
    } finally {
      setLoadingStory(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-xl font-black text-pop-black">My Notebook</h2>
        {savedWords.length > 0 && (
            <button onClick={onStudy} className="text-xs font-bold bg-pop-green text-white px-3 py-1 rounded-full shadow-hard-sm border border-black active:translate-y-1">
                STUDY MODE
            </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {savedWords.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-3xl">
                    📓
                </div>
                <p className="text-gray-500 font-medium">Your notebook is empty.</p>
                <p className="text-gray-400 text-sm mt-1">Start searching to add words!</p>
            </div>
        ) : (
            <div className="grid gap-3">
                {savedWords.map(word => (
                    <div key={word.id} onClick={() => onSelectWord(word)} className="bg-white border-2 border-gray-100 rounded-xl p-3 flex justify-between items-center hover:border-pop-yellow cursor-pointer group transition-colors">
                        <div>
                            <div className="font-bold text-pop-black">{word.term}</div>
                            <div className="text-xs text-gray-400 truncate max-w-[150px]">{word.explanation}</div>
                        </div>
                        <button 
                            onClick={(e) => { e.stopPropagation(); onRemoveWord(word.id); }}
                            className="text-gray-300 hover:text-red-500 px-2 group-hover:block"
                        >
                            <i className="fas fa-trash"></i>
                        </button>
                    </div>
                ))}
            </div>
        )}

        {story && (
             <div className="mt-8 bg-pop-yellow/20 p-6 rounded-3xl border-2 border-pop-yellow relative">
                 <div className="absolute -top-3 left-4 bg-pop-yellow text-pop-black text-xs font-bold px-2 py-1 border border-black rounded shadow-sm">
                     AI STORY TIME
                 </div>
                 <button onClick={() => setStory(null)} className="absolute top-2 right-2 text-pop-yellow/70 hover:text-pop-yellow">
                     <i className="fas fa-times-circle"></i>
                 </button>
                 <div className="prose prose-sm font-medium text-gray-800 leading-relaxed">
                     <div dangerouslySetInnerHTML={{ 
                         __html: story.replace(/\*\*(.*?)\*\*/g, '<span class="bg-yellow-200 px-1 rounded text-black font-bold border-b-2 border-yellow-500">$1</span>') 
                     }} />
                 </div>
             </div>
        )}
      </div>

      <div className="p-4 border-t border-gray-200">
        <Button 
            fullWidth 
            onClick={handleGenerateStory} 
            disabled={loadingStory || savedWords.length < 3}
            variant="primary"
            className="flex justify-center gap-2 items-center"
        >
            {loadingStory ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-magic"></i>}
            {loadingStory ? 'Weaving Magic...' : 'Generate Story'}
        </Button>
        {savedWords.length < 3 && savedWords.length > 0 && (
             <p className="text-center text-xs text-gray-400 mt-2">Add {3 - savedWords.length} more words to unlock stories.</p>
        )}
      </div>
    </div>
  );
};