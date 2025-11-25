import React, { useState, useEffect, useRef } from 'react';
import { SearchResult, ChatMessage, UserSettings } from '../types';
import { Button } from '../components/Button';
import { AudioPlayer } from '../components/AudioPlayer';
import { chatWithContext } from '../services/geminiService';

interface ResultViewProps {
  result: SearchResult;
  settings: UserSettings;
  onSave: (res: SearchResult) => void;
  isSaved: boolean;
  onBack: () => void;
}

export const ResultView: React.FC<ResultViewProps> = ({ result, settings, onSave, isSaved, onBack }) => {
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMsg, setInputMsg] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (chatOpen) scrollToBottom();
  }, [messages, chatOpen]);

  const handleSendChat = async () => {
    if (!inputMsg.trim()) return;
    const userMsg = inputMsg;
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInputMsg("");
    setChatLoading(true);

    try {
      const historyFormatted = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));
      
      const responseText = await chatWithContext(historyFormatted, userMsg, result);
      setMessages(prev => [...prev, { role: 'model', text: responseText }]);
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { role: 'model', text: "Oops, I got distracted. Say that again?" }]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 relative">
      {/* Header/Nav */}
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="!p-1">
          <i className="fas fa-chevron-left text-xl"></i>
        </Button>
        <span className="font-bold text-gray-500 text-sm">Result</span>
        <Button variant="ghost" onClick={() => onSave(result)} className={`!p-1 ${isSaved ? 'text-pop-yellow' : 'text-gray-400'}`}>
           <i className={`${isSaved ? 'fas' : 'far'} fa-bookmark text-xl`}></i>
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-24 space-y-6">
        
        {/* Main Word Card */}
        <div className="bg-white rounded-3xl p-6 border-2 border-black shadow-hard relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <i className="fas fa-quote-right text-6xl"></i>
            </div>
            <div className="flex justify-between items-start mb-2">
                <div>
                    <h2 className="text-4xl font-black text-pop-black tracking-tight">{result.term}</h2>
                    {result.phonetic && <p className="text-gray-400 font-mono text-sm mt-1">{result.phonetic}</p>}
                </div>
                <AudioPlayer text={result.term} voiceName={settings.targetLang.voiceName} compact />
            </div>
            <p className="text-lg text-pop-purple font-bold mt-4 border-l-4 border-pop-purple pl-3 leading-tight">
                {result.explanation}
            </p>
        </div>

        {/* AI Image */}
        {result.imageUrl && (
            <div className="rounded-3xl border-2 border-black overflow-hidden shadow-hard bg-white">
                <img src={result.imageUrl} alt={result.term} className="w-full h-48 object-cover" />
                <div className="p-2 bg-pop-yellow text-xs font-bold text-center border-t-2 border-black uppercase tracking-wider">
                    AI Visualization
                </div>
            </div>
        )}

        {/* Fun Usage */}
        <div className="bg-pop-blue/10 rounded-3xl p-6 border-2 border-pop-blue border-dashed">
            <div className="flex items-center gap-2 mb-3 text-pop-blue font-bold uppercase text-xs tracking-wider">
                <i className="fas fa-comment-dots"></i> The Vibe Check
            </div>
            <p className="text-pop-black font-medium leading-relaxed">
                {result.funUsage}
            </p>
             <div className="mt-4 pt-4 border-t border-pop-blue/20 text-sm text-gray-600">
                <span className="font-bold text-pop-blue">Similar: </span> {result.relatedWords}
            </div>
        </div>

        {/* Examples */}
        <div className="space-y-3">
             <div className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-2">Examples</div>
             {result.examples.map((ex, idx) => (
                 <div key={idx} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                     <div className="flex justify-between items-start gap-3">
                         <p className="text-pop-black font-bold text-lg leading-snug">{ex.original}</p>
                         <AudioPlayer text={ex.original} voiceName={settings.targetLang.voiceName} compact />
                     </div>
                     <p className="text-gray-500 mt-2 text-sm">{ex.translation}</p>
                 </div>
             ))}
        </div>
      </div>

      {/* Floating Chat Button (if closed) */}
      {!chatOpen && (
        <div className="absolute bottom-6 right-6 z-30">
            <button 
                onClick={() => setChatOpen(true)}
                className="bg-pop-pink text-white w-14 h-14 rounded-full border-2 border-black shadow-hard flex items-center justify-center text-2xl hover:scale-110 transition-transform"
            >
                <i className="fas fa-comments"></i>
            </button>
        </div>
      )}

      {/* Chat Sheet */}
      {chatOpen && (
          <div className="absolute inset-0 z-40 bg-white flex flex-col animate-[slideInUp_0.3s_ease-out]">
              <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-pop-pink/10">
                  <h3 className="font-bold text-pop-pink">Chat about "{result.term}"</h3>
                  <button onClick={() => setChatOpen(false)} className="p-2 bg-white rounded-full h-8 w-8 flex items-center justify-center shadow-sm">
                      <i className="fas fa-times"></i>
                  </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                  {messages.length === 0 && (
                      <div className="text-center text-gray-400 mt-10">
                          <i className="fas fa-robot text-4xl mb-3 opacity-20"></i>
                          <p>Ask me anything about this word!</p>
                      </div>
                  )}
                  {messages.map((m, i) => (
                      <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                              m.role === 'user' 
                              ? 'bg-pop-blue text-white rounded-br-none shadow-md' 
                              : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'
                          }`}>
                              {m.text}
                          </div>
                      </div>
                  ))}
                  {chatLoading && <div className="text-xs text-gray-400 ml-4">Thinking...</div>}
                  <div ref={messagesEndRef} />
              </div>
              <div className="p-4 border-t border-gray-200 bg-white">
                  <div className="flex gap-2">
                      <input 
                        className="flex-1 bg-gray-100 border-0 rounded-full px-4 py-2 focus:ring-2 focus:ring-pop-pink outline-none"
                        placeholder="Type a question..."
                        value={inputMsg}
                        onChange={(e) => setInputMsg(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                      />
                      <button 
                        onClick={handleSendChat}
                        disabled={chatLoading}
                        className="bg-pop-pink text-white w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-50"
                      >
                          <i className="fas fa-paper-plane"></i>
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};