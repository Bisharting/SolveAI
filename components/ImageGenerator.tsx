import React, { useEffect, useState } from 'react';
import { generateConceptImage } from '../services/geminiService';
import { Loader2, ImageOff, RefreshCw, Edit2, X } from 'lucide-react';

interface ImageGeneratorProps {
  prompt: string;
  conceptName: string;
}

const ImageGenerator: React.FC<ImageGeneratorProps> = ({ prompt: initialPrompt, conceptName }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);
  
  // State to manage prompt editing and regeneration
  const [activePrompt, setActivePrompt] = useState(initialPrompt);
  const [draftPrompt, setDraftPrompt] = useState(initialPrompt);
  const [isEditing, setIsEditing] = useState(false);

  const fetchImage = async (promptText: string) => {
    setLoading(true);
    setError(false);
    try {
      const url = await generateConceptImage(promptText);
      if (url) {
        setImageUrl(url);
      } else {
        setError(true);
      }
    } catch (err) {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  // Initial load or when prop changes (new concept generated)
  useEffect(() => {
    setActivePrompt(initialPrompt);
    fetchImage(initialPrompt);
  }, [initialPrompt]);

  const handleEditOpen = () => {
    setDraftPrompt(activePrompt);
    setIsEditing(true);
  };

  const handleRegenerateFromEdit = () => {
    setActivePrompt(draftPrompt);
    setIsEditing(false);
    fetchImage(draftPrompt);
  };
  
  const handleQuickRegenerate = () => {
    fetchImage(activePrompt);
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-slate-500 animate-pulse">
          <Loader2 className="w-8 h-8 animate-spin mb-2" />
          <span className="text-sm font-medium">Generating visualization...</span>
        </div>
      );
    }

    if (error || !imageUrl) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-slate-600">
          <ImageOff className="w-8 h-8 mb-2" />
          <span className="text-sm">Could not generate image</span>
          <div className="flex gap-2 mt-4">
             <button 
                 onClick={handleEditOpen}
                 className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded text-xs text-slate-300 transition-colors flex items-center gap-1"
             >
                <Edit2 className="w-3 h-3" /> Edit
             </button>
             <button 
                 onClick={handleQuickRegenerate}
                 className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded text-xs text-slate-300 transition-colors flex items-center gap-1"
             >
                <RefreshCw className="w-3 h-3" /> Retry
             </button>
          </div>
        </div>
      );
    }

    return (
      <>
        <img
            src={imageUrl}
            alt={`Concept art for ${conceptName}`}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        
        {/* Controls Overlay - Only show on success image */}
        <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
            <button 
                onClick={handleEditOpen}
                className="p-2 bg-slate-900/80 hover:bg-slate-800 text-white rounded-lg backdrop-blur-sm border border-slate-700 transition-colors shadow-lg"
                title="Edit Prompt"
            >
                <Edit2 className="w-4 h-4" />
            </button>
            <button 
                onClick={handleQuickRegenerate}
                className="p-2 bg-slate-900/80 hover:bg-slate-800 text-white rounded-lg backdrop-blur-sm border border-slate-700 transition-colors shadow-lg"
                title="Regenerate"
            >
                <RefreshCw className="w-4 h-4" />
            </button>
        </div>

        {/* Bottom Prompt Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-4 translate-y-2 group-hover:translate-y-0 transition-transform duration-300 pointer-events-none">
            <p className="text-white text-xs line-clamp-2 opacity-80 group-hover:opacity-100">{activePrompt}</p>
        </div>
      </>
    );
  };

  return (
    <div className="relative w-full h-64 rounded-lg overflow-hidden group shadow-sm border border-slate-700 bg-slate-900">
      {renderContent()}

      {/* Edit Mode Overlay - Global for the component */}
      {isEditing && (
        <div className="absolute inset-0 z-20 bg-slate-900/95 backdrop-blur-sm p-4 flex flex-col animate-in fade-in duration-200">
            <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-slate-400 uppercase">Edit Image Prompt</span>
                <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-white transition-colors">
                    <X className="w-4 h-4" />
                </button>
            </div>
            <textarea 
                value={draftPrompt}
                onChange={(e) => setDraftPrompt(e.target.value)}
                className="flex-1 w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm text-slate-200 focus:ring-2 focus:ring-brand-500 focus:border-transparent focus:outline-none resize-none mb-3 custom-scrollbar"
                placeholder="Describe the image you want to generate..."
            />
            <div className="flex justify-end gap-2">
                <button 
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors"
                >
                    Cancel
                </button>
                <button 
                    onClick={handleRegenerateFromEdit}
                    className="px-3 py-1.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-lg flex items-center gap-2 transition-colors shadow-lg shadow-brand-900/20"
                >
                    <RefreshCw className="w-3 h-3" /> Regenerate
                </button>
            </div>
        </div>
      )}
    </div>
  );
};

export default ImageGenerator;