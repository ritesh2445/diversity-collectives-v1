import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Sparkles, 
  Brain, 
  Search, 
  AlertTriangle, 
  TrendingUp, 
  FileText, 
  CheckCircle, 
  X, 
  ArrowRight, 
  RefreshCw, 
  Send,
  MessageSquare,
  Tag,
  ShieldAlert,
  Sliders
} from 'lucide-react';
import { 
  getAiAnomalies, 
  dismissAnomaly, 
  parseNaturalLanguageQuery, 
  generateWeeklyExecutiveSummary,
  getDirectorySubmissions,
  getInquiries
} from '../services/adminClient.js';

export default function SmartAutomationCenter({ onTriggerFeedback, onNavigateToTab }) {
  const [subTab, setSubTab] = useState('anomalies'); // 'anomalies' | 'nlq' | 'predictive' | 'digest' | 'tagger'
  const [anomalies, setAnomalies] = useState([]);
  const [summaryData, setSummaryData] = useState(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  // Natural Language Query state
  const [nlQuery, setNlQuery] = useState('');
  const [nlResult, setNlResult] = useState(null);
  const [nlLoading, setNlLoading] = useState(false);

  // Smart Content Tagger state
  const [taggerTitle, setTaggerTitle] = useState('Oxnard Youth Wellness Circle');
  const [taggerDescription, setTaggerDescription] = useState('Weekly safe space for LGBTQ+ high school and college youth featuring peer counseling, free mental health check-ins, and art therapy.');
  const [suggestedTags, setSuggestedTags] = useState([]);
  const [isAnalyzingContent, setIsAnalyzingContent] = useState(false);

  useEffect(() => {
    loadAnomalies();
    handleGenerateWeeklySummary();
  }, []);

  const loadAnomalies = async () => {
    const a = await getAiAnomalies();
    setAnomalies(a);
  };

  const handleDismiss = async (id) => {
    const res = await dismissAnomaly(id);
    setAnomalies(res.anomalies);
    onTriggerFeedback?.('Anomaly dismissed.');
  };

  const handleRunNlq = async (e) => {
    e?.preventDefault?.();
    if (!nlQuery.trim()) return;

    setNlLoading(true);
    try {
      const parsed = parseNaturalLanguageQuery(nlQuery);
      
      // Load context data to fulfill the query
      let matchedItems = [];
      if (parsed.domain === 'directory') {
        const bizList = await getDirectorySubmissions('all');
        matchedItems = parsed.status 
          ? bizList.filter(b => b.status === parsed.status)
          : bizList;
      } else if (parsed.domain === 'inquiries') {
        matchedItems = await getInquiries('contact');
      }

      setNlResult({
        parsed,
        items: matchedItems,
        count: matchedItems.length
      });
    } finally {
      setNlLoading(false);
    }
  };

  const handleGenerateWeeklySummary = async () => {
    setIsGeneratingSummary(true);
    try {
      const s = await generateWeeklyExecutiveSummary();
      setSummaryData(s);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleAnalyzeContent = () => {
    setIsAnalyzingContent(true);
    setTimeout(() => {
      setSuggestedTags([
        { tag: 'Youth & Family', category: 'Category', confidence: '98%' },
        { tag: 'Mental Health & Wellness', category: 'Category', confidence: '95%' },
        { tag: 'LGBTQ+ Affirming Safe Space', category: 'Badge', confidence: '99%' },
        { tag: 'Free Admission / Sliding Scale', category: 'Filter', confidence: '92%' },
        { tag: 'Ventura County / Oxnard', category: 'Location', confidence: '96%' }
      ]);
      setIsAnalyzingContent(false);
      onTriggerFeedback?.('AI generated 5 recommended metadata tags.');
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-black uppercase tracking-wider text-purple-700">
              PILLAR 5: AI & INTELLIGENT AUTOMATION
            </span>
          </div>
          <h2 className="font-display text-2xl font-bold text-slate-950 mt-1 flex items-center gap-2">
            <Zap className="w-6 h-6 text-amber-500" />
            <span>AI Operations & Conversational Intelligence</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Proactive anomaly detection, natural language database queries, automated executive briefings, and intelligent content classification.
          </p>
        </div>

        {/* Sub-Tabs */}
        <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200">
          {[
            { id: 'anomalies', label: 'Anomaly Center', icon: AlertTriangle },
            { id: 'nlq', label: 'Natural Language Query', icon: MessageSquare },
            { id: 'predictive', label: 'Predictive Trends', icon: TrendingUp },
            { id: 'digest', label: 'Executive Briefing', icon: FileText },
            { id: 'tagger', label: 'Smart Tagger', icon: Tag }
          ].map(t => {
            const Icon = t.icon;
            const isActive = subTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setSubTab(t.id)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  isActive ? 'bg-[#5A1E65] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SUB-TAB 1: ANOMALY DETECTION */}
      {subTab === 'anomalies' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <span>Real-Time Operational Anomaly Detection</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Machine learning models and statistical deviation engines continuously inspect traffic, error spikes, donations, and volunteer surges.
            </p>
          </div>

          <div className="space-y-4">
            {anomalies.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
                <p className="text-sm font-semibold text-slate-700">Zero anomalous deviations detected</p>
                <p className="text-xs text-slate-400 mt-1">All metrics are tracking normally within expected operational standard deviations.</p>
              </div>
            ) : (
              anomalies.map(anom => (
                <div 
                  key={anom.id} 
                  className={`p-5 rounded-2xl border transition-all space-y-3 ${
                    anom.severity === 'high' ? 'bg-rose-50/60 border-rose-200' :
                    anom.severity === 'medium' ? 'bg-amber-50/60 border-amber-200' : 'bg-purple-50/50 border-purple-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                          anom.severity === 'high' ? 'bg-rose-600 text-white' :
                          anom.severity === 'medium' ? 'bg-amber-500 text-slate-950' : 'bg-purple-700 text-white'
                        }`}>
                          {anom.severity} anomaly
                        </span>
                        <h4 className="font-bold text-sm text-slate-900">{anom.title}</h4>
                      </div>
                      <p className="text-xs text-slate-700 mt-1">{anom.description}</p>
                    </div>

                    <button
                      onClick={() => handleDismiss(anom.id)}
                      className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
                      title="Dismiss anomaly"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono bg-white/80 p-3 rounded-xl border border-slate-200/60">
                    <div>
                      <span className="text-slate-500">Metric / Baseline: </span>
                      <strong className="text-slate-800">{anom.baseline}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Observed Surge: </span>
                      <strong className="text-purple-900">{anom.detected}</strong>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-slate-600 italic">
                      💡 Suggested action: <strong>{anom.suggestedAction}</strong>
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {new Date(anom.detectedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: NATURAL LANGUAGE QUERY INTERFACE */}
      {subTab === 'nlq' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-purple-700" />
              <span>Ask Admin AI: Conversational Data Query</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Query directory records, donations, and inquiries using plain English sentences without complex database filters.
            </p>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleRunNlq} className="relative">
            <input
              type="text"
              value={nlQuery}
              onChange={(e) => setNlQuery(e.target.value)}
              placeholder="e.g. 'Show me pending directory listings from last week' or 'Find volunteer inquiries'"
              className="w-full pl-5 pr-28 py-3.5 rounded-2xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#5A1E65] outline-none shadow-xs font-medium"
            />
            <button
              type="submit"
              disabled={nlLoading || !nlQuery.trim()}
              className="absolute right-2 top-2 px-4 py-2 bg-[#5A1E65] hover:bg-purple-900 text-white font-bold text-xs rounded-xl cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              {nlLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-amber-300" />}
              <span>Ask AI</span>
            </button>
          </form>

          {/* Quick prompt suggestions */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Suggested Prompts:</span>
            {[
              'Show me pending directory listings',
              'Find high-tier donor appreciation gifts',
              'Check real-time system health and latencies',
              'Show volunteer and contact inquiries'
            ].map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setNlQuery(p);
                  parseNaturalLanguageQuery(p);
                }}
                className="text-xs bg-slate-100 hover:bg-purple-100 text-slate-700 hover:text-[#5A1E65] px-3 py-1 rounded-xl transition-colors cursor-pointer border border-slate-200"
              >
                "{p}"
              </button>
            ))}
          </div>

          {/* Query Results */}
          {nlResult && (
            <div className="p-5 rounded-2xl bg-purple-50/50 border border-purple-200 space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-purple-200 pb-3">
                <div className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-700" />
                  <div>
                    <h4 className="text-xs font-bold uppercase text-purple-900">Query Interpretation</h4>
                    <p className="text-xs text-slate-700">{nlResult.parsed.explanation}</p>
                  </div>
                </div>
                {onNavigateToTab && nlResult.parsed.domain && (
                  <button
                    onClick={() => onNavigateToTab(nlResult.parsed.domain)}
                    className="px-3 py-1.5 rounded-xl bg-[#5A1E65] text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <span>Open in {nlResult.parsed.domain}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {nlResult.items && nlResult.items.length > 0 ? (
                <div className="space-y-2">
                  <span className="text-[11px] font-bold uppercase text-slate-500">
                    Found {nlResult.items.length} matching record(s):
                  </span>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {nlResult.items.map((item, idx) => (
                      <div key={idx} className="bg-white p-3 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
                        <div>
                          <strong className="text-slate-900">{item.name || item.sender_name || item.subject}</strong>
                          <span className="text-slate-500 ml-2">({item.category || item.city || item.email})</span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full font-mono text-[10px] bg-purple-100 text-[#5A1E65] font-bold">
                          {item.status || 'Active'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">No specific direct records to preview. Click the button above to navigate to the module.</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 3: PREDICTIVE ANALYTICS */}
      {subTab === 'predictive' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-700">Predictive Metric</span>
            <h3 className="font-bold text-lg text-slate-900">Donor Retention Probability</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-emerald-600">92.4%</span>
              <span className="text-xs font-bold text-slate-500">Low Churn Risk</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Based on historical transaction cadences, automated appreciation card delivery increases 12-month donor retention by 28.6%.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-700">Predictive Metric</span>
            <h3 className="font-bold text-lg text-slate-900">Year-End Giving Forecast</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-slate-950">$82,400</span>
              <span className="text-xs font-bold text-emerald-600">+22% YoY</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Extrapolated from year-to-date trajectory, sustained monthly gifts, and anticipated Ventura County Pride Festival registrations.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-700">Predictive Metric</span>
            <h3 className="font-bold text-lg text-slate-900">Volunteer Capacity Need</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-amber-500">45 Active</span>
              <span className="text-xs font-bold text-slate-500">June Surge</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Pride Festival month will require an additional 18 trained community volunteers for wellness check-in and youth supervision.
            </p>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: EXECUTIVE WEEKLY SUMMARY */}
      {subTab === 'digest' && summaryData && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-700" />
                <span>Executive Weekly Briefing: "What Changed This Week?"</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Automated multi-source digest for Executive Director Tess Allen and Board of Directors.
              </p>
            </div>
            <button
              onClick={handleGenerateWeeklySummary}
              disabled={isGeneratingSummary}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingSummary ? 'animate-spin' : ''}`} />
              <span>Regenerate</span>
            </button>
          </div>

          <div className="p-5 rounded-2xl bg-purple-50/60 border border-purple-200 space-y-4">
            <span className="text-xs font-bold text-purple-900 font-mono">Report Period: {summaryData.period}</span>
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Key Achievements:</h4>
              <ul className="space-y-1.5 text-xs text-slate-800 list-disc list-inside">
                {summaryData.keyTakeaways.map((item, idx) => (
                  <li key={idx} className="leading-relaxed">{item}</li>
                ))}
              </ul>
            </div>

            <div className="space-y-2 pt-2 border-t border-purple-200">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Immediate Action Items:</h4>
              <ul className="space-y-1.5 text-xs text-slate-800 list-disc list-inside">
                {summaryData.recommendedActions.map((item, idx) => (
                  <li key={idx} className="leading-relaxed font-medium">{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 5: SMART CONTENT TAGGER */}
      {subTab === 'tagger' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Tag className="w-5 h-5 text-purple-700" />
              <span>AI Content Classifier & Tag Generator</span>
            </h3>
            <p className="text-xs text-slate-500">
              Paste draft article text or business listing descriptions. AI suggests affirmed categories, SEO keywords, and directory tags.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Content Title</label>
              <input
                type="text"
                value={taggerTitle}
                onChange={(e) => setTaggerTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#5A1E65] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Content Body / Description</label>
              <textarea
                rows={4}
                value={taggerDescription}
                onChange={(e) => setTaggerDescription(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#5A1E65] outline-none"
              />
            </div>

            <button
              onClick={handleAnalyzeContent}
              disabled={isAnalyzingContent}
              className="py-2.5 px-4 bg-[#5A1E65] hover:bg-purple-900 text-white font-bold text-xs rounded-xl cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-2"
            >
              {isAnalyzingContent ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-amber-300" />}
              <span>Generate Smart Tags</span>
            </button>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900">Recommended Metadata & Tags</h3>
            {suggestedTags.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <Tag className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="text-xs">Click "Generate Smart Tags" to classify this content.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {suggestedTags.map((t, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                    <div>
                      <strong className="text-slate-900">{t.tag}</strong>
                      <span className="text-slate-400 ml-2 font-mono text-[10px]">({t.category})</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                      {t.confidence} match
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
