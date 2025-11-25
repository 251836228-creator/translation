import React, { useState } from 'react';
import { generateAudio, getSharedAudioContext } from '../services/geminiService';
import { Button } from './Button';

interface AudioPlayerProps {
  text: string;
  voiceName?: string;
  label?: string; // Optional label text
  compact?: boolean;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ text, voiceName, label, compact }) => {
  const [loading, setLoading] = useState(false);

  const playAudio = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (loading) return;
    setLoading(true);
    try {
      const audioBuffer = await generateAudio(text, voiceName);
      const audioContext = getSharedAudioContext();
      
      // Resume context if suspended (common in browsers until user interaction)
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.start(0);
    } catch (err) {
      console.error("Audio playback error", err);
    } finally {
      setLoading(false);
    }
  };

  if (compact) {
     return (
        <button 
            onClick={playAudio} 
            disabled={loading}
            className="text-pop-blue hover:text-pop-purple transition-colors disabled:opacity-50"
        >
            {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-volume-up"></i>}
        </button>
     )
  }

  return (
    <Button variant="secondary" onClick={playAudio} disabled={loading} className="flex items-center gap-2 text-sm !py-1 !px-3 !shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
      {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-volume-up"></i>}
      {label && <span>{label}</span>}
    </Button>
  );
};