"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import axios from 'axios';
import {
  ShieldCheckIcon,
  EyeIcon,
  BookOpenIcon,
  MagnifyingGlassIcon,
  LockClosedIcon,
  SparklesIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  Cog6ToothIcon,
  CpuChipIcon,
  GlobeAltIcon,
  ChartBarIcon,
  InformationCircleIcon,
  RocketLaunchIcon,
  BeakerIcon,
  LightBulbIcon
} from '@heroicons/react/24/outline';

// Types
interface AuditFormData {
  url: string;
  enableAI: boolean;
  enableRAG: boolean;
  geminiApiKey?: string;
}

interface ComplianceIssue {
  category: string;
  issue: string;
  priority: 'high' | 'medium' | 'low';
  recommendation: string;
  impact: string;
}

interface AuditResult {
  url: string;
  timestamp: string;
  overall_score: number;
  categories: {
    [key: string]: {
      score: number;
      issues: ComplianceIssue[];
      passed_checks: string[];
    };
  };
  ai_insights?: {
    summary: string;
    key_recommendations: string[];
    implementation_roadmap: {
      immediate: string[];
      short_term: string[];
      long_term: string[];
    };
    risk_assessment: string;
  };
}

const CATEGORY_ICONS = {
  GDPR: ShieldCheckIcon,
  Accessibility: EyeIcon,
  WCAG: CheckCircleIcon,
  SEO: ChartBarIcon,
  Security: ShieldCheckIcon,
} as const;

const PRIORITY_COLORS = {
  high: 'status-high',
  medium: 'status-medium',
  low: 'status-low',
} as const;

const transformCategories = (backendCategories: any) => {
  const transformed: any = {};
  
  if (backendCategories) {
    Object.entries(backendCategories).forEach(([key, category]: [string, any]) => {
      transformed[key] = {
        score: Math.round(category.score || 0),
        issues: (category.issues || []).map((issue: any) => ({
          category: issue.category || key,
          issue: issue.issue || issue.description || '',
          priority: issue.severity?.toLowerCase() || 'medium',
          recommendation: issue.description || '',
          impact: issue.issue || ''
        })),
        passed_checks: category.passed || []
      };
    });
  }
  
  return transformed;
};

export default function Home() {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'categories' | 'ai-insights'>('overview');
  const [progress, setProgress] = useState(0);
  const [showForm, setShowForm] = useState(true);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url) {
      toast.error('Please enter a valid URL');
      return;
    }

    setIsLoading(true);
    setProgress(0);
    setResult(null);

    // Simulate progress for better UX
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 500);

    try {
      const response = await fetch('http://localhost:8000/api/v1/audit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          url,
          enable_ai: true,
          enable_rag: true
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Audit failed');
      }

      setProgress(100);
      setTimeout(() => {
        // Transform backend response to match frontend interface
        const transformedResult: AuditResult = {
          url: data.compliance_results?.url || url,
          timestamp: new Date().toISOString(),
          overall_score: Math.round(data.compliance_results?.score || 0),
          categories: transformCategories(data.compliance_results?.categories || {}),
          ai_insights: data.ai_analysis ? {
            summary: data.ai_analysis.analysis_summary || '',
            key_recommendations: data.ai_analysis.priority_recommendations?.split('\n').filter(Boolean) || [],
            implementation_roadmap: {
              immediate: [],
              short_term: [],
              long_term: []
            },
            risk_assessment: data.ai_analysis.ai_insights || ''
          } : undefined
        };
        setResult(transformedResult);
        toast.success('🚀 Audit completed successfully!');
      }, 500);

    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Audit failed');
    } finally {
      setIsLoading(false);
      clearInterval(progressInterval);
      setTimeout(() => setProgress(0), 1000);
    }
  }, [url]);

  const getTotalIssues = (result: AuditResult) => {
    return Object.values(result.categories).reduce((total, category) => 
      total + category.issues.length, 0
    );
  };

  const getIssuesByPriority = (result: AuditResult) => {
    const issues = Object.values(result.categories).flatMap(category => category.issues);
    return {
      high: issues.filter(issue => issue.priority === 'high').length,
      medium: issues.filter(issue => issue.priority === 'medium').length,
      low: issues.filter(issue => issue.priority === 'low').length,
    };
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="max-w-4xl mx-auto text-center space-y-12">
        {/* Hero Section */}
        <div className="space-y-8 animate-scale-in-center">
          {/* Icon */}
          <div className="flex items-center justify-center mb-8">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-r from-purple-500 via-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-2xl animate-glow">
                <CpuChipIcon className="w-10 h-10 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-orange-400 rounded-full animate-pulse-soft"></div>
            </div>
          </div>
          
          {/* Title with Gradient */}
          <div className="space-y-6">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400">
                AI Compliance
              </span>
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-pink-400 to-purple-400">
                Auditor
              </span>
            </h1>
            
            {/* Subtitle */}
            <p className="text-lg md:text-xl lg:text-2xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
              Advanced AI-powered website analysis for{' '}
              <span className="text-purple-400 font-semibold">GDPR</span>,{' '}
              <span className="text-blue-400 font-semibold">Accessibility</span>,{' '}
              <span className="text-indigo-400 font-semibold">SEO</span>, and{' '}
              <span className="text-pink-400 font-semibold">Security</span> compliance
            </p>
          </div>

          {/* Glassmorphism Feature Buttons */}
          <div className="flex flex-wrap justify-center gap-4 pt-8">
            {[
              { icon: SparklesIcon, text: 'AI-Powered Analysis' },
              { icon: RocketLaunchIcon, text: 'Real-time Results' },
              { icon: BeakerIcon, text: 'Professional Grade' },
            ].map((feature, index) => (
              <div 
                key={index} 
                className="group relative overflow-hidden bg-white/10 backdrop-blur-md border border-white/20 hover:border-purple-400/50 px-6 py-3 rounded-2xl text-white font-medium flex items-center gap-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 hover:bg-white/15 animate-float cursor-default" 
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                {/* Gradient Border Effect */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500 via-blue-500 to-indigo-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                
                {/* Content */}
                <feature.icon className="w-5 h-5 relative z-10" />
                <span className="relative z-10">{feature.text}</span>
                
                {/* Hover glow effect */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-indigo-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Professional Audit Form */}
        <div className="max-w-lg mx-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <label htmlFor="url" className="block text-sm font-medium text-slate-300 text-center">
                Website URL to Audit
              </label>
              <div className="relative">
                <input
                  type="url"
                  id="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Enter website URL"
                  className="w-full px-4 py-3 bg-slate-800/60 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 hover:border-slate-500/50 transition-all duration-300 text-center"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !url}
              className="w-full py-3 text-sm font-semibold bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 hover:from-purple-600 hover:via-pink-600 hover:to-orange-600 text-white rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Analyzing...
                </div>
              ) : (
                "Start Analysis"
              )}
            </button>

            {/* Professional Progress Bar */}
            {isLoading && (
              <div className="space-y-2">
                <div className="w-full bg-slate-700/50 rounded-full h-2 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 transition-all duration-500 relative rounded-full"
                    style={{ width: `${progress}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse rounded-full"></div>
                  </div>
                </div>
                <div className="text-center text-slate-400 text-xs font-medium">
                  Analyzing website... {progress}%
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Results Section */}
        {result && (
          <div className="space-y-8 animate-scale-in-center">
            {/* Results Header */}
            <div className="card-ai">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div>
                  <h2 className="text-3xl font-bold text-gradient-ai mb-2">
                    Audit Results
                  </h2>
                  <p className="text-stone-600 dark:text-stone-300 text-lg">
                    {result.url} • {new Date(result.timestamp).toLocaleString()}
                  </p>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-gradient-ai mb-1">
                      {result.overall_score}%
                    </div>
                    <div className="text-sm text-stone-500 dark:text-stone-400">
                      Overall Score
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-4xl font-bold text-orange-500 mb-1">
                      {getTotalIssues(result)}
                    </div>
                    <div className="text-sm text-stone-500 dark:text-stone-400">
                      Total Issues
                    </div>
                  </div>
                </div>
              </div>

              {/* Priority Summary */}
              <div className="flex flex-wrap gap-3 mt-6">
                {Object.entries(getIssuesByPriority(result)).map(([priority, count]) => (
                  <div key={priority} className={`${PRIORITY_COLORS[priority as keyof typeof PRIORITY_COLORS]} px-4 py-2 rounded-lg font-medium text-sm`}>
                    {count} {priority.charAt(0).toUpperCase() + priority.slice(1)} Priority
                  </div>
                ))}
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex justify-center">
              <div className="glass-card p-2 rounded-2xl">
                <div className="flex space-x-2">
                  {[
                    { key: 'overview', label: 'Overview', icon: ChartBarIcon },
                    { key: 'categories', label: 'Categories', icon: ClockIcon },
                    { key: 'ai-insights', label: 'AI Insights', icon: LightBulbIcon },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key as any)}
                      className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                        activeTab === tab.key
                          ? 'btn-ai-primary text-white'
                          : 'text-stone-600 dark:text-stone-300 hover:bg-white/50 dark:hover:bg-stone-700/50'
                      }`}
                    >
                      <tab.icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Tab Content */}
            <div className="min-h-[600px]">
              {activeTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {Object.entries(result.categories).map(([category, data]) => {
                    const IconComponent = CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS] || CheckCircleIcon;
                    return (
                      <div key={category} className="card-ai hover:scale-105 transition-transform duration-300">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-12 h-12 gradient-ai-primary rounded-xl flex items-center justify-center">
                            <IconComponent className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-stone-800 dark:text-stone-100">
                              {category}
                            </h3>
                            <p className="text-stone-600 dark:text-stone-300">
                              Score: {data.score}%
                            </p>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="progress-ai h-2">
                            <div 
                              className="progress-ai-fill h-full"
                              style={{ width: `${data.score}%` }}
                            />
                          </div>
                          
                          <div className="flex justify-between text-sm">
                            <span className="text-green-600 font-medium">
                              ✓ {data.passed_checks.length} Passed
                            </span>
                            <span className="text-red-600 font-medium">
                              ⚠ {data.issues.length} Issues
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {activeTab === 'categories' && (
                <div className="space-y-6">
                  {Object.entries(result.categories).map(([category, data]) => (
                    <div key={category} className="card-ai">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-14 h-14 gradient-ai-primary rounded-xl flex items-center justify-center">
                          {React.createElement(CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS] || CheckCircleIcon, {
                            className: "w-7 h-7 text-white"
                          })}
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-stone-800 dark:text-stone-100">
                            {category}
                          </h3>
                          <p className="text-stone-600 dark:text-stone-300">
                            Score: {data.score}% • {data.issues.length} issues found
                          </p>
                        </div>
                      </div>

                      {data.issues.length > 0 && (
                        <div className="space-y-4">
                          <h4 className="font-semibold text-stone-700 dark:text-stone-200 flex items-center gap-2">
                            <ExclamationTriangleIcon className="w-5 h-5 text-orange-500" />
                            Issues Found
                          </h4>
                          {data.issues.map((issue, index) => (
                            <div key={index} className="glass-card p-4 rounded-xl">
                              <div className="flex items-start gap-3">
                                <span className={`${PRIORITY_COLORS[issue.priority]} px-2 py-1 rounded-lg text-xs font-bold uppercase shrink-0`}>
                                  {issue.priority}
                                </span>
                                <div className="flex-1">
                                  <h5 className="font-semibold text-stone-800 dark:text-stone-100 mb-2">
                                    {issue.issue}
                                  </h5>
                                  <p className="text-stone-600 dark:text-stone-300 text-sm mb-2">
                                    {issue.recommendation}
                                  </p>
                                  <p className="text-stone-500 dark:text-stone-400 text-xs">
                                    Impact: {issue.impact}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'ai-insights' && result.ai_insights && (
                <div className="space-y-6">
                  <div className="card-ai">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-14 h-14 gradient-ai-primary rounded-xl flex items-center justify-center animate-glow">
                        <SparklesIcon className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-gradient-ai">
                          AI-Powered Analysis
                        </h3>
                        <p className="text-stone-600 dark:text-stone-300">
                          Advanced insights powered by artificial intelligence
                        </p>
                      </div>
                    </div>

                    <div className="prose prose-stone dark:prose-invert max-w-none">
                      <h4 className="text-lg font-semibold mb-3">Executive Summary</h4>
                      <p className="text-stone-700 dark:text-stone-300 leading-relaxed">
                        {result.ai_insights.summary}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="card-ai">
                      <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <CheckCircleIcon className="w-5 h-5 text-green-500" />
                        Key Recommendations
                      </h4>
                      <ul className="space-y-2">
                        {result.ai_insights.key_recommendations.map((rec, index) => (
                          <li key={index} className="flex items-start gap-2 text-stone-700 dark:text-stone-300">
                            <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 shrink-0"></span>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="card-ai">
                      <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <InformationCircleIcon className="w-5 h-5 text-blue-500" />
                        Risk Assessment
                      </h4>
                      <p className="text-stone-700 dark:text-stone-300 leading-relaxed">
                        {result.ai_insights.risk_assessment}
                      </p>
                    </div>
                  </div>

                  {result.ai_insights.implementation_roadmap && (
                    <div className="card-ai">
                      <h4 className="text-lg font-semibold mb-6 flex items-center gap-2">
                        <RocketLaunchIcon className="w-5 h-5 text-orange-500" />
                        Implementation Roadmap
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                          { key: 'immediate', title: 'Immediate Actions', color: 'bg-red-100 dark:bg-red-900/20 border-red-200 dark:border-red-800' },
                          { key: 'short_term', title: 'Short Term (1-3 months)', color: 'bg-orange-100 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800' },
                          { key: 'long_term', title: 'Long Term (3+ months)', color: 'bg-green-100 dark:bg-green-900/20 border-green-200 dark:border-green-800' },
                        ].map((phase) => (
                          <div key={phase.key} className={`${phase.color} border rounded-xl p-4`}>
                            <h5 className="font-semibold mb-3 text-stone-800 dark:text-stone-100">
                              {phase.title}
                            </h5>
                            <ul className="space-y-2">
                              {(result.ai_insights!.implementation_roadmap[phase.key as keyof typeof result.ai_insights.implementation_roadmap] || []).map((item, index) => (
                                <li key={index} className="text-sm text-stone-700 dark:text-stone-300 flex items-start gap-2">
                                  <span className="w-1.5 h-1.5 bg-current rounded-full mt-1.5 shrink-0"></span>
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
