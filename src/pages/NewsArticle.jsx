import React from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, User, Share2, Check, ArrowRight } from 'lucide-react';
import { newsArticles } from '../data/dcvcData';
import { cmsStore } from '../services/cmsStore';
import { usePageMeta } from '../utils/seo';

export default function NewsArticle() {
  const { slug } = useParams();
  const article = newsArticles.find(a => a.slug === slug) || (cmsStore.data?.news || []).find(a => a.slug === slug || a.id === slug);
  const [copied, setCopied] = React.useState(false);

  usePageMeta({
    title: article ? article.title : 'News Article',
    description: article ? article.excerpt : 'Diversity Collective Ventura County community update.',
    canonicalPath: article ? `/news/${article.slug}` : '/news',
    ogImage: article?.image
  });

  if (!article) {
    return <Navigate to="/news" replace />;
  }

  const handleShare = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const related = newsArticles.filter(a => a.slug !== article.slug).slice(0, 2);

  return (
    <div className="pt-8 md:pt-14 pb-20 bg-transparent text-slate-800">
      
      {/* Back button and Share */}
      <div className="container-clean mb-6 flex items-center justify-between max-w-4xl">
        <Link 
          to="/news" 
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-[#5A1E65] transition-colors py-1.5 px-3.5 rounded-full bg-slate-100 hover:bg-purple-50"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to News & Articles</span>
        </Link>

        <button
          onClick={handleShare}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#5A1E65] py-1.5 px-3.5 rounded-full border border-slate-200 hover:bg-slate-50 transition-all cursor-pointer"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
          <span>{copied ? 'Link Copied!' : 'Share Article'}</span>
        </button>
      </div>

      {/* Main Article Container */}
      <article className="container-clean max-w-4xl">
        <header className="space-y-4 pb-8 border-b border-slate-200">
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="text-xs font-black uppercase tracking-wider text-[#5A1E65] bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
              {article.category}
            </span>
            <span className="text-slate-500 font-bold flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-amber-500" />
              <span>{article.publishedAt}</span>
            </span>
            <span className="text-slate-400">·</span>
            <span className="text-slate-500 font-bold flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-purple-600" />
              <span>{article.readingTime}</span>
            </span>
          </div>

          <h1 className="font-display text-3xl sm:text-5xl font-black text-slate-950 tracking-tight leading-[1.1]">
            {article.title}
          </h1>

          <div className="flex items-center gap-2 text-xs text-slate-500 font-bold pt-1">
            <User className="w-3.5 h-3.5 text-slate-400" />
            <span>By {article.author}</span>
          </div>
        </header>

        {/* Hero Photo */}
        <div className="my-8 rounded-3xl overflow-hidden aspect-[16/9] shadow-xl border-2 border-slate-200">
          <img
            src={article.image}
            alt={article.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Article Body */}
        <div className="prose prose-lg max-w-none text-slate-700 space-y-6 leading-relaxed font-medium">
          {article.body.map((para, i) => (
            <p key={i} className="text-base sm:text-lg">
              {para}
            </p>
          ))}
        </div>

        {/* Article Footer Callout */}
        <div className="mt-12 p-8 rounded-3xl bg-purple-50/70 border-2 border-purple-200 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1">
            <h4 className="font-display font-black text-slate-950 text-lg">Support Stories Like This</h4>
            <p className="text-xs text-slate-600">Your tax-deductible donation directly funds local LGBTQ+ advocacy, health care, and youth circles.</p>
          </div>
          <Link to="/donate" className="btn-primary py-3 px-6 text-xs font-bold whitespace-nowrap shadow-md">
            <span>Support Our Mission</span>
          </Link>
        </div>

        {/* Related Articles */}
        {related.length > 0 && (
          <div className="mt-16 pt-10 border-t border-slate-200 space-y-6">
            <h3 className="font-display text-2xl font-black text-slate-950">More from Diversity Collective</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {related.map((rel) => (
                <Link
                  key={rel.slug}
                  to={`/news/${rel.slug}`}
                  className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-purple-300 shadow-sm hover:shadow-md transition-all group block space-y-2"
                >
                  <span className="text-[10px] font-black uppercase text-[#5A1E65]">{rel.category}</span>
                  <h4 className="font-display text-base font-bold text-slate-900 group-hover:text-[#5A1E65] transition-colors leading-snug">
                    {rel.title}
                  </h4>
                  <span className="text-xs text-[#5A1E65] font-bold inline-flex items-center gap-1 pt-1">
                    <span>Read Article</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </article>

    </div>
  );
}

