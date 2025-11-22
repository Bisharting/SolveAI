
import React, { useState, useEffect, useRef } from 'react';
import { 
  Lightbulb, 
  ArrowRight, 
  Sparkles, 
  Target, 
  AlertTriangle, 
  CheckCircle2, 
  Layers, 
  BrainCircuit,
  PenTool,
  ChevronRight,
  BarChart3,
  Settings2,
  MessageSquare,
  X,
  MessageSquarePlus,
  Send,
  Loader2,
  Save,
  FolderOpen,
  Trash2,
  Clock,
  FileText,
  ArrowLeft,
  Hammer,
  Bot,
  Search,
  Globe,
  ExternalLink,
  ShieldAlert,
  Trophy,
  DollarSign,
  BookOpen,
  History,
  Zap
} from 'lucide-react';
import { solveUserProblem, getProblemSuggestions, discoverMarketNiches, createConceptChatSession, analyzeCompetitors } from './services/geminiService';
import ImageGenerator from './components/ImageGenerator';
import { SolverResponse, UserInput, GeneratedConcept, MarketNiche, ChatMessage, CompetitorAnalysisResult, ExistingSolution } from './types';
import { Chat, GenerateContentResponse } from "@google/genai";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

// --- Types for Local State ---

interface RefinementData {
  messages: ChatMessage[];
  competitorAnalysis: CompetitorAnalysisResult | null;
}

interface SavedReport {
  id: string;
  timestamp: number;
  data: SolverResponse;
  refinements: Record<number, RefinementData>;
}

// --- Sub-Components ---

// 1. Header
const Header: React.FC<{ onOpenFeedback: () => void; onOpenSaved: () => void; onHome: () => void }> = ({ onOpenFeedback, onOpenSaved, onHome }) => (
  <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
      <div className="flex items-center gap-2 cursor-pointer" onClick={onHome}>
        <div className="bg-brand-600 p-2 rounded-lg shadow-lg shadow-brand-500/20">
          <BrainCircuit className="w-5 h-5 text-white" />
        </div>
        <h1 className="text-xl font-bold text-white tracking-tight">
          Solve<span className="text-brand-400 font-light">AI</span>
        </h1>
      </div>
      <div className="flex items-center gap-3 sm:gap-4">
        <button 
          onClick={onOpenSaved}
          className="text-sm text-slate-300 hover:text-brand-400 font-medium flex items-center gap-2 transition-colors bg-slate-800/50 hover:bg-slate-800 px-3 py-1.5 rounded-lg border border-transparent hover:border-slate-700"
        >
          <FolderOpen className="w-4 h-4" />
          <span className="hidden sm:inline">Saved</span>
        </button>

        <button 
          onClick={onOpenFeedback}
          className="text-sm text-slate-300 hover:text-brand-400 font-medium flex items-center gap-2 transition-colors bg-slate-800/50 hover:bg-slate-800 px-3 py-1.5 rounded-lg border border-transparent hover:border-slate-700"
        >
          <MessageSquare className="w-4 h-4" />
          <span className="hidden sm:inline">Feedback</span>
        </button>
        <div className="w-px h-4 bg-slate-700 hidden sm:block"></div>
        <div className="text-sm text-slate-500 font-medium hidden sm:block">
          Universal Problem Solver
        </div>
      </div>
    </div>
  </header>
);

// Saved Reports Modal
const SavedReportsModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  reports: SavedReport[];
  onLoad: (report: SavedReport) => void;
  onDelete: (id: string) => void;
}> = ({ isOpen, onClose, reports, onLoad, onDelete }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <FolderOpen className="w-6 h-6 text-brand-500" />
              Saved Solutions
            </h3>
            <p className="text-slate-400 text-sm mt-1">Access your previous problem-solving sessions</p>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1 hover:bg-slate-800 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
          {reports.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-600">
                <FolderOpen className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-medium text-slate-300">No saved sessions</h4>
              <p className="text-slate-500 text-sm mt-1">Solve a problem and save the report to see it here.</p>
            </div>
          ) : (
            reports.map((report) => (
              <div 
                key={report.id} 
                className="bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-xl p-4 transition-all group"
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-xs text-brand-400 font-medium mb-1">
                      <Clock className="w-3 h-3" />
                      {new Date(report.timestamp).toLocaleDateString(undefined, { 
                        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                      })}
                    </div>
                    <h4 className="text-white font-semibold truncate mb-1">
                      {report.data.problem_understanding.summary.split('.')[0]}...
                    </h4>
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <span className="bg-slate-900 px-2 py-0.5 rounded text-xs border border-slate-700">
                        {report.data.existing_solutions.length} Existing
                      </span>
                      <span className="bg-slate-900 px-2 py-0.5 rounded text-xs border border-slate-700">
                        {report.data.generated_concepts.length} New
                      </span>
                      {report.refinements && Object.keys(report.refinements).length > 0 && (
                        <span className="bg-brand-900/50 text-brand-300 px-2 py-0.5 rounded text-xs border border-brand-500/30 flex items-center gap-1">
                          <Hammer className="w-3 h-3" /> {Object.keys(report.refinements).length} Plans
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 shrink-0">
                    <button 
                      onClick={() => onLoad(report)}
                      className="px-3 py-1.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-lg transition-colors"
                    >
                      Load
                    </button>
                    <button 
                      onClick={() => onDelete(report.id)}
                      className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// Feedback Modal Component
const FeedbackModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    const [type, setType] = useState('general');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
  
    if (!isOpen) return null;
  
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);
      setTimeout(() => {
        setIsSubmitting(false);
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          setMessage('');
          setType('general');
          onClose();
        }, 2000);
      }, 800);
    };
  
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl p-6 relative">
          <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
          <div className="mb-6"><h3 className="text-xl font-bold text-white">Share Feedback</h3></div>
          {showSuccess ? (
            <div className="text-center py-8"><CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-2" /><h4 className="text-white">Thank You!</h4></div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
                <textarea value={message} onChange={e => setMessage(e.target.value)} className="w-full p-3 bg-slate-800 border border-slate-700 rounded text-white" placeholder="Tell us what you think..." required />
                <button type="submit" disabled={isSubmitting} className="w-full py-3 bg-white text-black font-bold rounded hover:bg-brand-50 disabled:opacity-50">Submit</button>
            </form>
          )}
        </div>
      </div>
    );
};

// Niche Explorer Modal
const NicheExplorerModal: React.FC<{ isOpen: boolean; onClose: () => void; onSelectNiche: (niche: MarketNiche) => void; }> = ({ isOpen, onClose, onSelectNiche }) => {
    const [domain, setDomain] = useState('');
    const [niches, setNiches] = useState<MarketNiche[]>([]);
    const [loading, setLoading] = useState(false);
    if (!isOpen) return null;
    const handleSearch = async () => {
        setLoading(true);
        try { const res = await discoverMarketNiches(domain); setNiches(res); } catch(e) {} finally { setLoading(false); }
    };
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl p-6 h-[80vh] flex flex-col">
                <div className="flex justify-between mb-4"><h3 className="text-xl font-bold text-white">Niche Scout</h3><button onClick={onClose}><X className="w-5 h-5 text-slate-400"/></button></div>
                <div className="flex gap-2 mb-4">
                    <input value={domain} onChange={e=>setDomain(e.target.value)} className="flex-1 bg-slate-800 border border-slate-700 rounded p-2 text-white" placeholder="Enter industry..." />
                    <button onClick={handleSearch} disabled={loading} className="bg-brand-600 text-white px-4 rounded">{loading ? 'Scanning...' : 'Scan'}</button>
                </div>
                <div className="overflow-y-auto flex-1 grid md:grid-cols-2 gap-4">
                    {niches.map((n,i) => (
                        <div key={i} onClick={() => onSelectNiche(n)} className="bg-slate-800 p-4 rounded border border-slate-700 hover:border-brand-500 cursor-pointer">
                            <h4 className="text-white font-bold">{n.name}</h4>
                            <p className="text-slate-400 text-sm">{n.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
};

// 2. Hero/Input Section
const InputSection: React.FC<{
  onSubmit: (data: UserInput) => void;
  isLoading: boolean;
}> = ({ onSubmit, isLoading }) => {
  const [formData, setFormData] = useState<UserInput>({
    problemDescription: '',
    domain: '',
    constraints: '',
    numConcepts: 3,
    solutionType: 'both'
  });

  const [showInspiration, setShowInspiration] = useState(false);
  const [showNicheExplorer, setShowNicheExplorer] = useState(false);
  const [inspirationDomain, setInspirationDomain] = useState('');
  const [suggestedProblems, setSuggestedProblems] = useState<string[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'numConcepts' ? parseInt(value) : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleGetSuggestions = async () => {
      setIsSuggesting(true);
      try {
          const suggestions = await getProblemSuggestions(inspirationDomain);
          setSuggestedProblems(suggestions);
      } catch (error) {
          console.error(error);
      } finally {
          setIsSuggesting(false);
      }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6">
      <NicheExplorerModal 
        isOpen={showNicheExplorer} 
        onClose={() => setShowNicheExplorer(false)} 
        onSelectNiche={(n) => { setFormData(p => ({...p, domain: n.name})); setShowNicheExplorer(false); }} 
      />

      <div className="text-center mb-10">
        <h2 className="text-5xl font-extrabold text-white mb-4 tracking-tight">
          Solve <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-purple-400">Anything</span>
        </h2>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto">
          Plug in a problem. Get proven real-world solutions or generate fresh innovations.
        </p>
      </div>

      <div className="bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 overflow-hidden">
        <div className="p-1 bg-gradient-to-r from-brand-500 via-purple-500 to-pink-500 opacity-30"></div>
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          
          {/* Solution Strategy Toggle */}
          <div className="grid grid-cols-3 gap-2 bg-slate-900 p-1.5 rounded-xl border border-slate-700">
             {[
               { id: 'existing', label: 'Proven Solutions', icon: BookOpen },
               { id: 'new', label: 'Fresh Innovation', icon: Sparkles },
               { id: 'both', label: 'Comprehensive', icon: Layers }
             ].map((opt) => (
               <button
                 key={opt.id}
                 type="button"
                 onClick={() => setFormData(prev => ({ ...prev, solutionType: opt.id as any }))}
                 className={`
                   flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all
                   ${formData.solutionType === opt.id 
                     ? 'bg-brand-600 text-white shadow-lg shadow-brand-900/20' 
                     : 'text-slate-400 hover:text-white hover:bg-slate-800'}
                 `}
               >
                 <opt.icon className="w-4 h-4" />
                 <span className="hidden sm:inline">{opt.label}</span>
               </button>
             ))}
          </div>

          <div>
            <div className="flex justify-between items-baseline mb-2">
                <label htmlFor="problemDescription" className="block text-sm font-semibold text-slate-300">
                The Problem <span className="text-red-400">*</span>
                </label>
                <button 
                  type="button" 
                  onClick={() => setShowInspiration(!showInspiration)} 
                  className="text-brand-400 text-xs hover:underline flex items-center gap-1 font-medium"
                >
                    <Lightbulb className="w-3 h-3" /> Need inspiration?
                </button>
            </div>

            {showInspiration && (
                <div className="mb-4 p-4 bg-slate-900/50 rounded-xl border border-brand-500/20 animate-in slide-in-from-top-2">
                    <div className="flex gap-2 mb-3">
                        <input
                            type="text"
                            value={inspirationDomain}
                            onChange={(e) => setInspirationDomain(e.target.value)}
                            placeholder="Enter a domain..."
                            className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none"
                        />
                        <button
                            type="button"
                            onClick={handleGetSuggestions}
                            disabled={isSuggesting}
                            className="px-4 py-2 bg-brand-600 text-white text-xs font-bold rounded-lg"
                        >
                            {isSuggesting ? '...' : 'Find Problems'}
                        </button>
                    </div>
                    {suggestedProblems.map((p, i) => (
                        <div key={i} onClick={() => setFormData(pr => ({...pr, problemDescription: p}))} className="text-sm p-2 hover:bg-slate-800 cursor-pointer text-slate-300 hover:text-white border-b border-slate-800 last:border-0">
                            {p}
                        </div>
                    ))}
                </div>
            )}

            <textarea
              id="problemDescription"
              name="problemDescription"
              required
              value={formData.problemDescription}
              onChange={handleChange}
              placeholder="Describe what you want to solve (e.g., 'My headphones always tangle', 'Employee retention is low')..."
              className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-600 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors min-h-[120px] resize-y text-slate-100 placeholder-slate-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="domain" className="block text-sm font-semibold text-slate-300 mb-2 flex justify-between">
                Context / Industry
                <button type="button" onClick={() => setShowNicheExplorer(true)} className="text-brand-400 text-xs flex items-center gap-1">
                  <Target className="w-3 h-3" /> Scan
                </button>
              </label>
              <input
                  type="text"
                  name="domain"
                  value={formData.domain}
                  onChange={handleChange}
                  placeholder="e.g., Consumer Electronics, HR..."
                  className="w-full px-4 py-2.5 rounded-lg bg-slate-900 border border-slate-600 focus:ring-2 focus:ring-brand-500 text-slate-100"
                />
            </div>
            <div>
              <label htmlFor="constraints" className="block text-sm font-semibold text-slate-300 mb-2">
                Constraints
              </label>
              <input
                  type="text"
                  name="constraints"
                  value={formData.constraints}
                  onChange={handleChange}
                  placeholder="e.g., Low budget, < 1 month..."
                  className="w-full px-4 py-2.5 rounded-lg bg-slate-900 border border-slate-600 focus:ring-2 focus:ring-brand-500 text-slate-100"
                />
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={isLoading || !formData.problemDescription}
              className={`
                w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg shadow-brand-500/20 transition-all
                ${isLoading 
                  ? 'bg-slate-700 text-slate-400 cursor-not-allowed' 
                  : 'bg-brand-600 text-white hover:bg-brand-500 hover:shadow-brand-600/30 active:scale-[0.98]'}
              `}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Solving Problem...
                </>
              ) : (
                <>
                  Generate Solutions
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// 3. Problem Summary Dashboard
const ProblemSummary: React.FC<{ data: SolverResponse }> = ({ data }) => (
  <section className="bg-slate-800 rounded-xl border border-slate-700 p-6 shadow-sm mb-8">
    <div className="flex items-center gap-2 mb-4">
      <Search className="w-6 h-6 text-purple-400" />
      <h3 className="text-lg font-bold text-white">Analysis</h3>
    </div>
    <div className="grid md:grid-cols-3 gap-6">
       <div className="md:col-span-2">
         <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Problem Summary</h4>
         <p className="text-slate-300 text-lg leading-relaxed mb-4">{data.problem_understanding.summary}</p>
         <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Root Cause</h4>
         <p className="text-white bg-slate-900/50 p-3 rounded-lg border border-slate-700">{data.problem_understanding.root_cause}</p>
       </div>
       <div className="space-y-4">
          <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Goals</h4>
            <ul className="space-y-1">{data.problem_understanding.design_goals.map((g,i) => <li key={i} className="text-sm text-slate-300 flex gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 shrink-0"/>{g}</li>)}</ul>
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Assumptions</h4>
            <ul className="space-y-1">{data.problem_understanding.assumptions.map((a,i) => <li key={i} className="text-sm text-slate-400 flex gap-2"><span className="w-1 h-1 bg-slate-500 rounded-full mt-2"/>{a}</li>)}</ul>
          </div>
       </div>
    </div>
  </section>
);

// 4. Existing Solution Card
const ExistingSolutionCard: React.FC<{ solution: ExistingSolution }> = ({ solution }) => (
  <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 hover:border-brand-500/30 transition-colors">
    <div className="flex justify-between items-start mb-3">
      <h4 className="text-xl font-bold text-white">{solution.name}</h4>
      <div className="flex items-center gap-1 bg-green-900/30 text-green-400 px-2 py-1 rounded border border-green-500/20 text-xs font-bold">
        <CheckCircle2 className="w-3 h-3" /> {solution.efficacy_rating}% Efficacy
      </div>
    </div>
    <p className="text-slate-400 text-sm mb-4">{solution.description}</p>
    
    <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50 mb-4">
      <h5 className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-1">
        <Zap className="w-3 h-3 text-yellow-400" /> Why it works
      </h5>
      <p className="text-slate-300 text-sm">{solution.why_it_works}</p>
    </div>

    <div className="flex items-start gap-2 mb-4">
      <BookOpen className="w-4 h-4 text-brand-500 mt-0.5 shrink-0" />
      <p className="text-sm text-slate-300"><span className="text-slate-500 font-medium">Example:</span> {solution.real_world_example}</p>
    </div>

    <div>
      <h5 className="text-xs font-bold text-slate-500 uppercase mb-2">Limitations</h5>
      <div className="flex flex-wrap gap-2">
        {solution.limitations.map((l, i) => (
          <span key={i} className="text-xs bg-slate-750 text-slate-400 px-2 py-1 rounded border border-slate-700">{l}</span>
        ))}
      </div>
    </div>
  </div>
);

// 5. Concept Detail (For New Solutions)
const ConceptDetail: React.FC<{ 
  concept: GeneratedConcept; 
  isRecommended: boolean;
  onRefine: (concept: GeneratedConcept) => void;
}> = ({ concept, isRecommended, onRefine }) => {
  return (
    <div className={`
      bg-slate-800 rounded-2xl overflow-hidden border transition-all duration-300 flex flex-col
      ${isRecommended ? 'border-brand-500 shadow-xl shadow-brand-500/10 ring-1 ring-brand-500/50' : 'border-slate-700 shadow-md hover:shadow-xl hover:border-slate-600'}
    `}>
      <div className="p-6 border-b border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h3 className="text-2xl font-bold text-white">{concept.name}</h3>
            <span className="text-xs bg-brand-900 text-brand-300 border border-brand-500/30 px-2 py-1 rounded-full uppercase font-bold">
              {concept.type}
            </span>
          </div>
          <p className="text-slate-400 font-medium">{concept.one_line_pitch}</p>
        </div>
        <button 
             onClick={() => onRefine(concept)}
             className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg font-bold text-sm transition-colors flex items-center gap-2 shadow-lg shadow-brand-500/20 whitespace-nowrap"
           >
             <Hammer className="w-4 h-4" /> Build & Refine
        </button>
      </div>

      <div className="grid lg:grid-cols-5 flex-1">
        <div className="lg:col-span-3 p-6 border-r border-slate-700">
          <p className="text-slate-300 text-sm leading-relaxed mb-6">{concept.detailed_description}</p>

          <div className="grid sm:grid-cols-2 gap-6 mb-6">
            <div>
              <h4 className="font-semibold text-white mb-3 flex items-center gap-2 text-sm">
                <Layers className="w-4 h-4 text-brand-500" /> Key Features
              </h4>
              <ul className="space-y-2">
                {concept.key_features.slice(0, 4).map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-400">
                    <CheckCircle2 className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3 flex items-center gap-2 text-sm">
                <DollarSign className="w-4 h-4 text-green-500" /> Viability
              </h4>
              <ul className="space-y-2">
                {concept.monetization_strategies?.slice(0, 3).map((s, i) => (
                   <li key={i} className="text-sm text-slate-400 flex items-start gap-2">
                     <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 shrink-0"></span>
                     {s}
                   </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-slate-900/30 p-6 flex flex-col gap-6">
          <div>
             <h4 className="font-semibold text-white mb-3 text-sm">Visual Concept</h4>
             <ImageGenerator prompt={concept.image_prompt} conceptName={concept.name} />
          </div>
          
          <div className="space-y-4">
             <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Success Rating</span>
                <span className="text-white font-bold">{concept.success_rating.score}/100</span>
             </div>
             <div className="w-full bg-slate-700 rounded-full h-2">
               <div className="bg-brand-500 h-2 rounded-full" style={{width: `${concept.success_rating.score}%`}}></div>
             </div>
             <p className="text-xs text-slate-500">{concept.success_rating.justification}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// 6. Refinement & Chat View
const RefinementView: React.FC<{ 
  concept: GeneratedConcept; 
  onBack: () => void;
  onSave: (data: RefinementData) => void;
  initialData?: RefinementData;
}> = ({ concept, onBack, onSave, initialData }) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
      if (initialData?.messages && initialData.messages.length > 0) return initialData.messages;
      return [{
          role: 'model',
          text: `Hi! I'm your assistant for **${concept.name}**. I can help you expand on this ${concept.type}, discuss implementation, or suggest next steps.`,
          timestamp: Date.now()
      }];
  });
  const [competitorData, setCompetitorData] = useState<CompetitorAnalysisResult | null>(initialData?.competitorAnalysis || null);

  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatSession = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'chat' | 'market'>('chat');
  const [isScanning, setIsScanning] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  useEffect(() => {
    if (!chatSession.current) {
        chatSession.current = createConceptChatSession(concept);
        // Note: In a production app we would hydrate the chat history for the API here
    }
  }, [concept]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleSend = async (textOverride?: string) => {
    const text = textOverride || inputValue;
    if (!text.trim() || !chatSession.current) return;
    const userMsg: ChatMessage = { role: 'user', text: text, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    if (!textOverride) setInputValue('');
    setIsTyping(true);
    try {
      const result: GenerateContentResponse = await chatSession.current.sendMessage({ message: text });
      setMessages(prev => [...prev, { role: 'model', text: result.text || "Error", timestamp: Date.now() }]);
    } catch (error) { setMessages(prev => [...prev, { role: 'model', text: "Error connecting.", timestamp: Date.now() }]); } finally { setIsTyping(false); }
  };
  
  const handleScanCompetitors = async () => {
     setIsScanning(true);
     try { const result = await analyzeCompetitors(concept); setCompetitorData(result); } catch (error) {} finally { setIsScanning(false); }
  };

  const handleSaveClick = () => {
      setSaveStatus('saving');
      onSave({ messages, competitorAnalysis: competitorData });
      setTimeout(() => {
          setSaveStatus('saved');
          setTimeout(() => setSaveStatus('idle'), 2000);
      }, 500);
  };

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col animate-in fade-in duration-500">
      <div className="mb-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-slate-800 rounded text-slate-400 hover:text-white"><ArrowLeft className="w-5 h-5" /></button>
            <h2 className="text-xl font-bold text-white">Refine: <span className="text-brand-400">{concept.name}</span></h2>
        </div>
        <div className="flex items-center gap-4">
            <button 
                onClick={handleSaveClick}
                disabled={saveStatus !== 'idle'}
                className={`px-4 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all border ${
                    saveStatus === 'saved' 
                    ? 'bg-green-600 text-white border-green-500' 
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white hover:border-brand-500'
                }`}
            >
                {saveStatus === 'saving' && <Loader2 className="w-4 h-4 animate-spin" />}
                {saveStatus === 'saved' && <CheckCircle2 className="w-4 h-4" />}
                {saveStatus === 'idle' && <Save className="w-4 h-4" />}
                {saveStatus === 'saved' ? 'Saved Plan' : 'Save Plan'}
            </button>

            <div className="bg-slate-800 p-1 rounded-lg flex gap-1">
                <button onClick={() => setActiveTab('chat')} className={`px-4 py-1.5 rounded text-sm font-medium flex gap-2 ${activeTab === 'chat' ? 'bg-brand-600 text-white' : 'text-slate-400'}`}><MessageSquare className="w-4 h-4" /> Chat</button>
                <button onClick={() => setActiveTab('market')} className={`px-4 py-1.5 rounded text-sm font-medium flex gap-2 ${activeTab === 'market' ? 'bg-brand-600 text-white' : 'text-slate-400'}`}><Globe className="w-4 h-4" /> Research</button>
            </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
        <div className="hidden lg:block lg:col-span-1 bg-slate-800 rounded-2xl border border-slate-700 overflow-y-auto custom-scrollbar p-6">
           <ImageGenerator prompt={concept.image_prompt} conceptName={concept.name} />
           <div className="mt-4 space-y-4">
              <div><h4 className="text-xs font-bold text-slate-500 uppercase">Description</h4><p className="text-sm text-slate-300 mt-1">{concept.detailed_description}</p></div>
              <div><h4 className="text-xs font-bold text-slate-500 uppercase">Features</h4><ul className="mt-1 space-y-1">{concept.key_features.map((f,i)=><li key={i} className="text-sm text-slate-300 flex gap-2"><CheckCircle2 className="w-3 h-3 mt-1 text-brand-500"/>{f}</li>)}</ul></div>
           </div>
        </div>

        <div className="lg:col-span-2 flex flex-col bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden relative">
           {activeTab === 'chat' && (
              <>
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-slate-900/50">
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] p-4 rounded-2xl text-sm shadow-sm ${msg.role === 'user' ? 'bg-brand-600 text-white' : 'bg-slate-800 border border-slate-700 text-slate-200'}`}>
                            <div className="whitespace-pre-wrap">{msg.text}</div>
                            </div>
                        </div>
                    ))}
                    {messages.length === 1 && (
                        <div className="mt-6">
                            <p className="text-xs font-bold text-slate-500 uppercase mb-3">Suggested Actions</p>
                            <div className="flex flex-wrap gap-2">
                                {["Implementation plan", "Cost analysis", "Marketing strategy", "Risk mitigation"].map((q, i) => (
                                    <button key={i} onClick={() => handleSend(q)} className="text-xs py-2 px-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 hover:text-white hover:border-brand-500">{q}</button>
                                ))}
                            </div>
                        </div>
                    )}
                    {isTyping && <div className="flex gap-2 items-center text-slate-500 text-xs"><Loader2 className="w-3 h-3 animate-spin"/> AI is thinking...</div>}
                    <div ref={messagesEndRef} />
                </div>
                <div className="p-4 bg-slate-800 border-t border-slate-700">
                    <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
                        <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="Ask follow-up questions..." className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-brand-500 outline-none" />
                        <button type="submit" disabled={!inputValue.trim() || isTyping} className="bg-brand-600 text-white p-3 rounded-xl hover:bg-brand-500"><Send className="w-5 h-5" /></button>
                    </form>
                </div>
              </>
           )}

           {activeTab === 'market' && (
              <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                 {!competitorData && !isScanning ? (
                     <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                        <Search className="w-12 h-12 text-slate-600" />
                        <h3 className="text-lg font-bold text-white">Scan Real World Data</h3>
                        <p className="text-slate-400 max-w-md text-sm">Search for existing solutions to benchmark against.</p>
                        <button onClick={handleScanCompetitors} className="px-6 py-2 bg-brand-600 text-white font-bold rounded-lg">Run Scan</button>
                     </div>
                 ) : isScanning ? (
                     <div className="flex flex-col items-center justify-center h-full"><Loader2 className="w-8 h-8 text-brand-500 animate-spin mb-2" /><p className="text-slate-400">Searching...</p></div>
                 ) : competitorData ? (
                     <div className="space-y-6">
                        <div className="bg-slate-900/50 border border-slate-700 p-4 rounded-lg"><p className="text-white">{competitorData.data.verdict}</p></div>
                        {competitorData.data.competitors.map((c,i) => (
                            <div key={i} className="bg-slate-800 border border-slate-700 p-4 rounded-lg">
                                <div className="flex justify-between"><h5 className="font-bold text-white">{c.name}</h5><span className="text-xs text-slate-400">{c.product_name}</span></div>
                                <p className="text-sm text-slate-400 mt-2"><span className="text-red-400">Overlap:</span> {c.key_overlap}</p>
                            </div>
                        ))}
                        {competitorData.sources.length > 0 && (
                           <div className="flex flex-wrap gap-2 mt-4">{competitorData.sources.map((s,i) => <a key={i} href={s.uri} target="_blank" className="text-xs bg-slate-900 px-2 py-1 rounded text-brand-400 border border-slate-700 truncate max-w-[150px]">{s.title}</a>)}</div>
                        )}
                     </div>
                 ) : null}
              </div>
           )}
        </div>
      </div>
    </div>
  );
};


// --- Main App Component ---

export default function App() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SolverResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [savedReports, setSavedReports] = useState<SavedReport[]>([]);
  const [isSavedReportsOpen, setIsSavedReportsOpen] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [selectedConcept, setSelectedConcept] = useState<GeneratedConcept | null>(null);
  
  // State for current refinements and active report tracking
  const [currentRefinements, setCurrentRefinements] = useState<Record<number, RefinementData>>({});
  const [activeReportId, setActiveReportId] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('solveai_saved_reports');
    if (saved) { try { setSavedReports(JSON.parse(saved)); } catch (e) {} }
  }, []);

  const saveToStorage = (updatedReports: SavedReport[]) => {
      localStorage.setItem('solveai_saved_reports', JSON.stringify(updatedReports));
      setSavedReports(updatedReports);
  };

  // Main save function - persists results and all current refinements
  const handleSaveReport = () => {
    if (!results) return;
    
    let updatedReports = [...savedReports];
    let reportId = activeReportId;

    if (reportId) {
        // Update existing
        updatedReports = updatedReports.map(r => 
            r.id === reportId ? { ...r, data: results, refinements: currentRefinements, timestamp: Date.now() } : r
        );
    } else {
        // Create new
        reportId = Date.now().toString();
        const newReport: SavedReport = { 
            id: reportId, 
            timestamp: Date.now(), 
            data: results,
            refinements: currentRefinements
        };
        updatedReports = [newReport, ...updatedReports];
        setActiveReportId(reportId);
    }

    saveToStorage(updatedReports);
    setShowSaveSuccess(true);
    setTimeout(() => setShowSaveSuccess(false), 2000);
  };

  // Logic called when "Save Plan" is clicked inside RefinementView
  const handleSavePlan = (refinementData: RefinementData) => {
     if (!results || !selectedConcept) return;
     
     const updatedRefinements = {
         ...currentRefinements,
         [selectedConcept.id]: refinementData
     };
     setCurrentRefinements(updatedRefinements);

     // Auto-trigger save to storage
     let updatedReports = [...savedReports];
     let reportId = activeReportId;

     if (reportId) {
         updatedReports = updatedReports.map(r => 
            r.id === reportId ? { ...r, data: results, refinements: updatedRefinements, timestamp: Date.now() } : r
         );
     } else {
        reportId = Date.now().toString();
        const newReport: SavedReport = { 
            id: reportId, 
            timestamp: Date.now(), 
            data: results,
            refinements: updatedRefinements
        };
        updatedReports = [newReport, ...updatedReports];
        setActiveReportId(reportId);
     }
     saveToStorage(updatedReports);
  };

  const handleDeleteReport = (id: string) => {
    const updated = savedReports.filter(r => r.id !== id);
    saveToStorage(updated);
    if (activeReportId === id) {
        setActiveReportId(null);
    }
  };

  const handleLoadReport = (report: SavedReport) => {
      setResults(report.data);
      setCurrentRefinements(report.refinements || {});
      setActiveReportId(report.id);
      setSelectedConcept(null);
      setIsSavedReportsOpen(false);
  };

  const handleFormSubmit = async (data: UserInput) => {
    setLoading(true);
    setError(null);
    setResults(null); 
    setSelectedConcept(null);
    setCurrentRefinements({});
    setActiveReportId(null);
    
    try {
      const response = await solveUserProblem(data);
      setResults(response);
    } catch (err) {
      setError("Could not generate solutions. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 pb-20 text-slate-200 font-sans">
      <Header 
        onOpenFeedback={() => setIsFeedbackOpen(true)} 
        onOpenSaved={() => setIsSavedReportsOpen(true)}
        onHome={() => { setResults(null); setSelectedConcept(null); setActiveReportId(null); }}
      />

      <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />
      <SavedReportsModal 
        isOpen={isSavedReportsOpen} onClose={() => setIsSavedReportsOpen(false)}
        reports={savedReports} onLoad={handleLoadReport}
        onDelete={handleDeleteReport}
      />

      <main>
        {!results && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <InputSection onSubmit={handleFormSubmit} isLoading={loading} />
          </div>
        )}

        {error && (
          <div className="max-w-3xl mx-auto px-4 mt-8">
            <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 flex items-center gap-3 text-red-300">
              <AlertTriangle className="w-5 h-5" />
              {error}
            </div>
            <button onClick={() => setError(null)} className="mt-4 text-sm text-slate-500 hover:text-slate-300 underline">Try again</button>
          </div>
        )}

        {results && !selectedConcept && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12 animate-in fade-in duration-1000">
            
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-slate-800 pb-6">
               <div>
                   <h2 className="text-3xl font-bold text-white">Solution Report</h2>
                   <p className="text-slate-400 text-sm mt-1">{new Date().toLocaleDateString()} • Strategy: {results.existing_solutions.length > 0 && results.generated_concepts.length > 0 ? "Comprehensive" : results.existing_solutions.length > 0 ? "Proven" : "Innovation"}</p>
               </div>
               <div className="flex gap-3">
                 <button onClick={handleSaveReport} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${showSaveSuccess ? 'bg-green-600 text-white' : 'bg-slate-800 text-slate-300 border border-slate-700'}`}>
                   {showSaveSuccess ? <><CheckCircle2 className="w-4 h-4" /> Saved</> : <><Save className="w-4 h-4" /> Save Report</>}
                 </button>
                 <button onClick={() => { setResults(null); setActiveReportId(null); }} className="text-sm text-brand-400 font-medium px-4 py-2 rounded-lg hover:bg-brand-900/20">New Analysis</button>
               </div>
            </div>

            <ProblemSummary data={results} />

            {/* Existing Solutions Section */}
            {results.existing_solutions.length > 0 && (
                <div className="animate-in slide-in-from-bottom-8 duration-700 delay-100">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="p-2 bg-green-900/20 rounded-lg"><BookOpen className="w-6 h-6 text-green-500" /></div>
                        <div>
                            <h3 className="text-xl font-bold text-white">Proven Pathways</h3>
                            <p className="text-slate-400 text-sm">Real-world solutions that have worked for others.</p>
                        </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                        {results.existing_solutions.map((sol) => (
                            <ExistingSolutionCard key={sol.id} solution={sol} />
                        ))}
                    </div>
                </div>
            )}

            {/* New Solutions Section */}
            {results.generated_concepts.length > 0 && (
                <div className="animate-in slide-in-from-bottom-8 duration-700 delay-200">
                    <div className="flex items-center gap-2 mb-6 mt-8">
                        <div className="p-2 bg-brand-900/20 rounded-lg"><Sparkles className="w-6 h-6 text-brand-500" /></div>
                        <div>
                            <h3 className="text-xl font-bold text-white">Innovation Lab</h3>
                            <p className="text-slate-400 text-sm">Fresh concepts designed for your specific constraints.</p>
                        </div>
                    </div>
                    <div className="grid lg:grid-cols-2 gap-8">
                        {results.generated_concepts.map((concept) => (
                            <ConceptDetail 
                                key={concept.id} 
                                concept={concept} 
                                isRecommended={concept.name === results.overall_recommendations.best_approach}
                                onRefine={(c) => setSelectedConcept(c)} 
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Final Recommendation */}
            <section className="bg-black/40 border border-slate-700 rounded-2xl p-8 text-white shadow-2xl relative overflow-hidden backdrop-blur-sm">
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-600 rounded-full blur-[100px] opacity-20 -translate-y-1/2 translate-x-1/2"></div>
                <div className="relative z-10">
                    <h3 className="text-xl font-bold mb-4 text-white flex items-center gap-2"><Trophy className="w-5 h-5 text-yellow-500"/> Final Recommendation</h3>
                    <div className="mb-6">
                        <span className="text-sm font-medium text-slate-400 uppercase tracking-wider">Best Approach</span>
                        <div className="text-2xl font-bold text-white mt-1">{results.overall_recommendations.best_approach}</div>
                    </div>
                    <p className="text-slate-300 leading-relaxed mb-6 border-l-2 border-brand-500 pl-4">{results.overall_recommendations.reason}</p>
                    <div className="grid md:grid-cols-3 gap-4">
                        {results.overall_recommendations.suggested_next_steps.map((step, i) => (
                            <div key={i} className="bg-slate-900/50 p-4 rounded-lg border border-slate-700 flex gap-3">
                                <span className="bg-brand-900 text-brand-400 font-bold w-6 h-6 rounded flex items-center justify-center shrink-0 text-xs">{i+1}</span>
                                <span className="text-sm text-slate-300">{step}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

          </div>
        )}

        {/* Refinement View */}
        {results && selectedConcept && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
             <RefinementView 
                concept={selectedConcept} 
                onBack={() => setSelectedConcept(null)} 
                onSave={handleSavePlan}
                initialData={currentRefinements[selectedConcept.id]}
             />
          </div>
        )}

      </main>
    </div>
  );
}
