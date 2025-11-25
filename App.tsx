import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Onboarding } from './views/Onboarding';
import { ResultView } from './views/ResultView';
import { NotebookView } from './views/NotebookView';
import { FlashcardMode } from './views/FlashcardMode';
import { Button } from './components/Button';
import { ViewState, UserSettings, SearchResult, Language } from './types';
import { analyzeText, generateImageForTerm } from './services/geminiService';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>(ViewState.ONBOARDING);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentResult, setCurrentResult] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Storage
  const [savedWords, setSavedWords] = useState<SearchResult[]>(() => {
    const saved = localStorage.getItem('lingopop_notebook');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('lingopop_notebook', JSON.stringify(savedWords));
  }, [savedWords]);

  const handleOnboardingComplete = (newSettings: UserSettings) => {
    setSettings(newSettings);
    setView(ViewState.SEARCH);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() || !settings) return;
    setLoading(true);
    setCurrentResult(null); // Clear previous

    try {
      // 1. Get Text analysis
      const textData = await analyzeText(searchQuery, settings.nativeLang, settings.targetLang);
      
      // 2. Start Image gen (async but we wait for simplicity in this demo flow, or display loader for image in result)
      // To make it snappy, we construct result first with undefined image, then update it? 
      // React state allows updates. But for cleaner code, let's wait or do parallel.
      
      const imagePromise = generateImageForTerm(searchQuery, textData.explanation);
      
      const newResult: SearchResult = {
        id: Date.now().toString(),
        term: searchQuery,
        ...textData,
        imageUrl: undefined, // Placeholder
        timestamp: Date.now(),
      };

      // Show result immediately with loading image
      setCurrentResult(newResult);
      setView(ViewState.RESULT);
      
      // Resolve image
      const imageUrl = await imagePromise;
      setCurrentResult(prev => prev ? { ...prev, imageUrl } : null);

    } catch (e: any) {
      console.error(e);
      // Improve error reporting
      let errorMessage = "AI hiccup. Try again!";
      if (e?.message) {
         if (e.message.includes("VITE_API_KEY")) {
             errorMessage = e.message;
         } else if (e.message.includes("401") || e.message.includes("403")) {
             errorMessage = "API Auth Error: Please check your API Key in Vercel settings.";
         } else if (e.message.includes("503")) {
             errorMessage = "AI is busy. Please wait a moment and try again.";
         } else {
             errorMessage = "Error: " + e.message;
         }
      }
      alert(errorMessage);
      setView(ViewState.SEARCH);
    } finally {
      setLoading(false);
      setSearchQuery("");
    }
  };

  const toggleSave = (res: SearchResult) => {
    if (savedWords.find(w => w.id === res.id)) {
      setSavedWords(prev => prev.filter(w => w.id !== res.id));
    } else {
      setSavedWords(prev => [res, ...prev]);
    }
  };

  const handleBackToSearch = () => {
    setView(ViewState.SEARCH);
    setCurrentResult(null);
  };

  // --- RENDERERS ---

  if (view === ViewState.ONBOARDING) {
    return (
      <Layout>
        <Onboarding onComplete={handleOnboardingComplete} />
      </Layout>
    );
  }

  if (view === ViewState.RESULT && currentResult && settings) {
    const isSaved = savedWords.some(w => w.id === currentResult.id);
    return (
      <Layout>
        <ResultView 
          result={currentResult} 
          settings={settings}
          onSave={toggleSave}
          isSaved={isSaved}
          onBack={handleBackToSearch}
        />
      </Layout>
    );
  }

  if (view === ViewState.NOTEBOOK && settings) {
    return (
      <Layout>
        <NotebookView 
          savedWords={savedWords} 
          settings={settings}
          onSelectWord={(w) => { setCurrentResult(w); setView(ViewState.RESULT); }}
          onRemoveWord={(id) => setSavedWords(prev => prev.filter(w => w.id !== id))}
          onStudy={() => setView(ViewState.FLASHCARDS)}
        />
        <div className="p-4 border-t border-gray-200">
             <Button variant="secondary" fullWidth onClick={() => setView(ViewState.SEARCH)}>
                 <i className="fas fa-search mr-2"></i> Back to Search
             </Button>
        </div>
      </Layout>
    );
  }

  if (view === ViewState.FLASHCARDS) {
    return (
        <Layout>
            <FlashcardMode words={savedWords} onExit={() => setView(ViewState.NOTEBOOK)} />
        </Layout>
    )
  }

  // DEFAULT: SEARCH VIEW
  return (
    <Layout>
      <div className="flex flex-col h-full relative bg-white">
        {/* Header */}
        <div className="p-4 flex justify-between items-center bg-white z-10">
           <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-pop-purple text-white flex items-center justify-center font-bold">L</span>
                <span className="font-bold text-pop-purple">LingoPop</span>
           </div>
           <button 
                onClick={() => setView(ViewState.NOTEBOOK)}
                className="bg-white border-2 border-black rounded-full w-10 h-10 flex items-center justify-center hover:bg-gray-50 shadow-hard-sm"
           >
               <i className="fas fa-book text-gray-700"></i>
           </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col justify-center px-6 pb-20">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-black text-pop-black mb-2">What's the word?</h1>
                <p className="text-gray-500">
                    Translate <span className="font-bold text-pop-pink">{settings?.nativeLang.name}</span> <i className="fas fa-arrow-right text-xs mx-1"></i> <span className="font-bold text-pop-blue">{settings?.targetLang.name}</span>
                </p>
            </div>

            <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-pop-pink to-pop-blue rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative bg-white rounded-2xl border-2 border-black shadow-hard p-1 flex">
                    <input 
                        type="text" 
                        className="flex-1 p-4 rounded-xl outline-none text-lg font-bold placeholder-gray-300 text-gray-800"
                        placeholder="Type anything..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        autoFocus
                    />
                    <button 
                        onClick={handleSearch}
                        disabled={loading || !searchQuery.trim()}
                        className="bg-pop-yellow px-6 rounded-xl font-bold border-l-2 border-black hover:bg-yellow-300 transition-colors disabled:opacity-50"
                    >
                        {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-arrow-right"></i>}
                    </button>
                </div>
            </div>

            {/* Recent/Suggested (Mock) */}
            <div className="mt-10 flex flex-wrap gap-2 justify-center opacity-60">
                {['Hello', 'Delicious', 'Where is the subway?'].map((tag) => (
                    <button key={tag} onClick={() => setSearchQuery(tag)} className="px-3 py-1 rounded-full bg-gray-100 text-xs font-bold text-gray-500 hover:bg-gray-200">
                        {tag}
                    </button>
                ))}
            </div>
        </div>
      </div>
    </Layout>
  );
};

export default App;