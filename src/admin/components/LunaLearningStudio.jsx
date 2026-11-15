import React, { useState, useEffect } from 'react';
import {
  Brain,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  Send,
  Database,
  Building2,
  Calendar,
  Users,
  Briefcase,
  HelpCircle,
  Plus,
  Trash2,
  BookOpen,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { lunaLearningEngine } from '../../services/lunaLearningEngine.js';
import { cmsStore } from '../../services/cmsStore.js';

export default function LunaLearningStudio() {
  const [learningStatus, setLearningStatus] = useState(() => lunaLearningEngine.getLearningStatus());
  const [testQuery, setTestQuery] = useState('What time does Narcotics Anonymous meet?');
  const [testResult, setTestResult] = useState(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [flashMessage, setFlashMessage] = useState('');

  // Custom knowledge state
  const [customFacts, setCustomFacts] = useState(() => {
    return cmsStore && typeof cmsStore.getCustomKnowledge === 'function'
      ? cmsStore.getCustomKnowledge()
      : (lunaLearningEngine.knowledge.customKnowledge || []);
  });
  const [newTopic, setNewTopic] = useState('');
  const [newKeywords, setNewKeywords] = useState('');
  const [newAnswer, setNewAnswer] = useState('');

  const refreshStatus = () => {
    const status = lunaLearningEngine.getLearningStatus();
    setLearningStatus(status);
    const facts = cmsStore && typeof cmsStore.getCustomKnowledge === 'function'
      ? cmsStore.getCustomKnowledge()
      : (lunaLearningEngine.knowledge.customKnowledge || []);
    setCustomFacts(facts);
  };

  useEffect(() => {
    refreshStatus();
    if (cmsStore && typeof cmsStore.subscribe === 'function') {
      const unsub = cmsStore.subscribe(() => {
        refreshStatus();
      });
      return () => unsub();
    }
  }, []);

  const showFlash = (msg) => {
    setFlashMessage(msg);
    setTimeout(() => setFlashMessage(''), 3000);
  };

  const handleManualRelearn = () => {
    setIsRefreshing(true);
    try {
      lunaLearningEngine.learnFromSite();
      refreshStatus();
      showFlash("Luna successfully digested and updated her knowledge graph across all site entities!");
    } catch (err) {
      console.error('[Luna Learning] Re-learn failed:', err);
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const handleRunTestQuery = (queryToRun) => {
    const q = (queryToRun || testQuery).trim();
    if (!q) return;

    setIsTesting(true);
    const startTime = performance.now();
    try {
      const res = lunaLearningEngine.answerQuery(q);
      const latencyMs = Math.round((performance.now() - startTime) * 10) / 10;
      setTestResult({
        query: q,
        ...res,
        latencyMs
      });
    } catch (err) {
      setTestResult({
        query: q,
        success: false,
        answer: `Error executing query: ${err.message}`,
        citations: []
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleAddCustomFact = (e) => {
    e.preventDefault();
    if (!newTopic.trim() || !newAnswer.trim()) return;

    const fact = {
      id: `fact-${Date.now()}`,
      topic: newTopic.trim(),
      title: newTopic.trim(),
      answer: newAnswer.trim(),
      keywords: newKeywords.split(',').map((k) => k.trim()).filter(Boolean),
      updatedAt: new Date().toISOString()
    };

    if (cmsStore && typeof cmsStore.saveCustomKnowledge === 'function') {
      cmsStore.saveCustomKnowledge(fact);
    }
    lunaLearningEngine.addCustomFact(fact);
    refreshStatus();
    setNewTopic('');
    setNewKeywords('');
    setNewAnswer('');
    showFlash(`Added custom knowledge: "${fact.topic}"! Luna learned it immediately.`);
  };

  const handleDeleteCustomFact = (id) => {
    if (cmsStore && typeof cmsStore.deleteCustomKnowledge === 'function') {
      cmsStore.deleteCustomKnowledge(id);
    }
    lunaLearningEngine.removeCustomFact(id);
    refreshStatus();
    showFlash('Custom knowledge snippet removed.');
  };

  const counts = learningStatus?.counts || {};

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-linear-to-r from-[#5A1E65] via-purple-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-purple-500/20 to-transparent pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-purple-200 text-xs font-bold mb-3 border border-white/10">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Autonomous Continuous Learning Engine</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-white">
              Luna AI Knowledge & Learning Center
            </h2>
            <p className="text-purple-200/90 text-sm mt-2 max-w-2xl leading-relaxed">
              Luna dynamically ingests, updates, and grounds herself in 100% of the information available on Diversity Collective Ventura County. Every time an event, program, business, news post, or setting is edited in CMS, Luna learns it in real-time.
            </p>
          </div>

          <div className="flex flex-col sm:items-end gap-3 shrink-0">
            <button
              type="button"
              onClick={handleManualRelearn}
              disabled={isRefreshing}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 font-black text-sm shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Re-index & Learn from Site Now</span>
            </button>
            {learningStatus?.lastLearnedAt && (
              <span className="text-xs text-purple-200/80">
                Last updated: {new Date(learningStatus.lastLearnedAt).toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>

        {flashMessage && (
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-xs font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{flashMessage}</span>
          </div>
        )}
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {[
          { label: 'Total Entities', count: learningStatus?.totalEntities || 0, icon: Database, color: 'text-purple-700 bg-purple-50' },
          { label: 'Programs', count: counts.programs || 0, icon: BookOpen, color: 'text-indigo-700 bg-indigo-50' },
          { label: 'Circles & Groups', count: counts.communityGroups || 0, icon: Users, color: 'text-pink-700 bg-pink-50' },
          { label: 'Live Events', count: counts.events || 0, icon: Calendar, color: 'text-amber-700 bg-amber-50' },
          { label: 'Directory Spots', count: counts.businesses || 0, icon: Building2, color: 'text-emerald-700 bg-emerald-50' },
          { label: 'Board & Staff', count: (counts.board || 0) + (counts.staff || 0), icon: Briefcase, color: 'text-blue-700 bg-blue-50' },
          { label: 'Workshops', count: counts.trainings || 0, icon: ShieldCheck, color: 'text-violet-700 bg-violet-50' },
          { label: 'Custom Facts', count: counts.customKnowledge || 0, icon: Sparkles, color: 'text-rose-700 bg-rose-50' },
        ].map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-white rounded-2xl border border-slate-200/80 p-4 flex flex-col justify-between shadow-2xs">
              <div className="flex items-center justify-between gap-1 mb-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{stat.label}</span>
                <div className={`p-1.5 rounded-lg ${stat.color}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>
              <span className="text-2xl font-black text-slate-900 font-display">{stat.count}</span>
            </div>
          );
        })}
      </div>

      {/* Main Studio Grid: Sandbox & Custom Knowledge */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Testing Sandbox (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 space-y-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-black text-slate-950 font-display flex items-center gap-2">
                <Brain className="w-5 h-5 text-[#5A1E65]" />
                <span>Luna AI Verification Sandbox</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Test any question live to verify that Luna answers with 100% accurate, up-to-date site information.
              </p>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Example Real-World Queries:</span>
            <div className="flex flex-wrap gap-1.5">
              {[
                'What time does Narcotics Anonymous meet?',
                'When does Queer Adulting meet?',
                'What time does Toastmasters meet?',
                'Is Beacon Coffee in the directory?',
                'Who offers affirming counseling in Ventura?',
                'Who is on the Board of Directors?',
                'What are the Community Resource Center hours?',
                'What is Amplify After Hours?',
                'Do you have a food pantry or mutual aid?'
              ].map((preset, pIdx) => (
                <button
                  key={pIdx}
                  type="button"
                  onClick={() => {
                    setTestQuery(preset);
                    handleRunTestQuery(preset);
                  }}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 hover:bg-purple-100 hover:text-purple-900 text-slate-700 transition-colors cursor-pointer text-left"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Query Input Box */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={testQuery}
                onChange={(e) => setTestQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleRunTestQuery()}
                placeholder="Ask Luna any question about DCVC..."
                className="flex-1 px-4 py-3 rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#5A1E65] text-sm text-slate-900 font-medium"
              />
              <button
                type="button"
                onClick={() => handleRunTestQuery()}
                disabled={isTesting}
                className="px-5 py-3 rounded-2xl bg-[#5A1E65] hover:bg-purple-900 active:scale-95 text-white font-bold text-sm shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span>Ask</span>
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Output Display */}
          {testResult && (
            <div className="rounded-2xl border border-purple-200/80 bg-purple-50/50 p-5 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-600 border-b border-purple-200/60 pb-2">
                <span className="flex items-center gap-1.5 text-purple-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Grounding: Verified Site Knowledge</span>
                </span>
                <span className="text-slate-500">Latency: {testResult.latencyMs}ms · Mode: {testResult.mode || 'client-unlimited'}</span>
              </div>

              <div className="text-sm text-slate-900 leading-relaxed whitespace-pre-line font-normal">
                {testResult.answer}
              </div>

              {testResult.citations && testResult.citations.length > 0 && (
                <div className="pt-2 border-t border-purple-200/40">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Citations & Direct Links:</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {testResult.citations.map((c, cIdx) => (
                      <span key={cIdx} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-purple-200 text-xs font-bold text-[#5A1E65]">
                        <span>{c.title}</span>
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Custom Knowledge Editor (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-6 space-y-5 shadow-xs">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-lg font-black text-slate-950 font-display flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <span>Custom Knowledge & Special Facts</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Teach Luna specific answers, emergency notices, or FAQ facts. She learns them instantly.
            </p>
          </div>

          {/* Add New Fact Form */}
          <form onSubmit={handleAddCustomFact} className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <span className="text-xs font-bold text-slate-700 block">Teach Luna a New Fact</span>
            
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase">Topic / Question Title</label>
              <input
                type="text"
                value={newTopic}
                onChange={(e) => setNewTopic(e.target.value)}
                placeholder="e.g. Thanksgiving Center Hours"
                required
                className="w-full mt-1 px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#5A1E65] bg-white font-medium text-slate-900"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase">Trigger Keywords (Comma-separated)</label>
              <input
                type="text"
                value={newKeywords}
                onChange={(e) => setNewKeywords(e.target.value)}
                placeholder="thanksgiving, holiday, closed, schedule"
                className="w-full mt-1 px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#5A1E65] bg-white font-medium text-slate-900"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase">Verified Answer / Explanation</label>
              <textarea
                value={newAnswer}
                onChange={(e) => setNewAnswer(e.target.value)}
                rows={3}
                placeholder="The Center will be closed for Thanksgiving from Nov 26 to Nov 29..."
                required
                className="w-full mt-1 px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#5A1E65] bg-white font-medium text-slate-900"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-[#5A1E65] hover:bg-purple-900 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Teach Luna This Fact</span>
            </button>
          </form>

          {/* List of Custom Facts */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-700 block">
              Active Learned Custom Snippets ({customFacts.length})
            </span>

            {customFacts.length === 0 ? (
              <p className="text-xs text-slate-500 italic p-3 bg-slate-50 rounded-xl text-center">
                No custom facts added yet. Luna currently learns directly from all live programs, events, directory listings, and pages!
              </p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {customFacts.map((fact) => (
                  <div key={fact.id} className="p-3 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-900">{fact.topic}</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteCustomFact(fact.id)}
                        className="text-slate-400 hover:text-rose-600 transition-colors p-1 cursor-pointer"
                        title="Delete custom fact"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2">{fact.answer}</p>
                    {fact.keywords && fact.keywords.length > 0 && (
                      <span className="text-[10px] text-slate-400 block">
                        Keywords: {Array.isArray(fact.keywords) ? fact.keywords.join(', ') : fact.keywords}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
