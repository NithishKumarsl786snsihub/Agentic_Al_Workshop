"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
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
  enableMultiAgent: boolean;
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
  multi_agent_results?: {
    multi_agent_analysis: {
      execution_summary: string;
      agents_involved: string[];
      analysis_timestamp: string;
      status: string;
    };
    violation_report: {
      total_violations: number;
      by_category: Record<string, string[]>;
      severity_breakdown: Record<string, number>;
      raw_findings: string;
    };
    legal_context: {
      recent_updates: string[];
      relevant_regulations: string[];
      enforcement_trends: string[];
      update_summary: string;
    };
    mapped_issues: {
      mapped_violations: any[];
      regulatory_citations: string[];
      prioritization: string[];
      mapping_summary: string;
    };
    remediation_plan: {
      immediate_actions: string[];
      technical_fixes: string[];
      code_examples: string[];
      policy_updates: string[];
      remediation_summary: string;
    };
    risk_assessment: {
      overall_risk_level: string;
      risk_factors: string[];
      potential_penalties: string[];
      business_impact: string;
    };
    implementation_roadmap: {
      immediate: Array<string | ActionItem>;
      short_term: Array<string | ActionItem>;
      long_term: Array<string | ActionItem>;
      ongoing_maintenance: Array<string | ActionItem>;
      phase_details?: {
        immediate?: PhaseDetails;
        short_term?: PhaseDetails;
        long_term?: PhaseDetails;
        ongoing_maintenance?: PhaseDetails;
      };
      roadmap_summary?: string;
      total_implementation_time?: string;
      compliance_score_projection?: string;
    };
  };
}

interface ActionItem {
  action: string;
  reason: string;
  effort: string;
  validation: string;
  skills?: string;
  priority?: string;
  dependencies?: string;
  outcomes?: string;
  success_metrics?: string;
  timeline?: string;
  frequency?: string;
  responsibility?: string;
  tools?: string;
  alerts?: string;
}

interface PhaseDetails {
  timeline: string;
  priority: string;
  budget_estimate: string;
  team_size: string;
  risk_if_delayed: string;
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

// Utility function to clean markdown formatting
const cleanMarkdownText = (text: string | undefined | null): string => {
  if (!text) return '';
  return text
    .replace(/[*#]/g, '') // Remove asterisks and hash symbols
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim();
};

const transformCategories = (backendCategories: any) => {
  const transformed: any = {};
  
  if (backendCategories && Object.keys(backendCategories).length > 0) {
    Object.entries(backendCategories).forEach(([key, category]: [string, any]) => {
      // Calculate individual category score based on passed checks vs total checks
      const passedCount = (category.passed || []).length;
      const issuesCount = (category.issues || []).length;
      const totalChecks = passedCount + issuesCount;
      const categoryScore = totalChecks > 0 ? Math.round((passedCount / totalChecks) * 100) : 0;
      
      // Debug: Log category calculation
      console.log(`Category ${key}:`, {
        passed: passedCount,
        issues: issuesCount,
        total: totalChecks,
        score: categoryScore,
        categoryData: category
      });
      
      transformed[key] = {
        score: categoryScore,
        issues: (category.issues || []).map((issue: any) => ({
          category: issue.category || key,
          issue: cleanMarkdownText(issue.issue || issue.description || ''),
          priority: issue.severity?.toLowerCase() || 'medium',
          recommendation: cleanMarkdownText(issue.description || ''),
          impact: cleanMarkdownText(issue.issue || '')
        })),
        passed_checks: category.passed || []
      };
    });
  } else {
    // Fallback: If no backend data, provide default categories with 0% scores
    console.warn('No backend category data received, using fallback');
    const defaultCategories = ['gdpr', 'accessibility', 'wcag', 'seo', 'security'];
    defaultCategories.forEach(category => {
      transformed[category] = {
        score: 0,
        issues: [],
        passed_checks: []
      };
    });
  }
  
  return transformed;
};

export default function Home() {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'categories' | 'ai-insights' | 'multi-agent'>('overview');
  const [progress, setProgress] = useState(0);
  const [showForm, setShowForm] = useState(true);
  const [enableMultiAgent, setEnableMultiAgent] = useState(false);

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
          enable_rag: true,
          enable_multi_agent: true
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Audit failed');
      }

      // Debug: Log the backend response structure (remove in production)
      console.log('Backend response:', data);
      console.log('Compliance categories:', data.compliance_results?.categories);

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
          } : undefined,
          multi_agent_results: data.multi_agent_results ? {
            ...data.multi_agent_results,
            // Ensure proper structure for implementation_roadmap
            implementation_roadmap: {
              ...data.multi_agent_results.implementation_roadmap,
              immediate: Array.isArray(data.multi_agent_results.implementation_roadmap?.immediate) 
                ? data.multi_agent_results.implementation_roadmap.immediate 
                : [],
              short_term: Array.isArray(data.multi_agent_results.implementation_roadmap?.short_term) 
                ? data.multi_agent_results.implementation_roadmap.short_term 
                : [],
              long_term: Array.isArray(data.multi_agent_results.implementation_roadmap?.long_term) 
                ? data.multi_agent_results.implementation_roadmap.long_term 
                : [],
              ongoing_maintenance: Array.isArray(data.multi_agent_results.implementation_roadmap?.ongoing_maintenance) 
                ? data.multi_agent_results.implementation_roadmap.ongoing_maintenance 
                : []
            }
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
                    ...(result.multi_agent_results ? [{ key: 'multi-agent', label: 'Multi-Agent', icon: CpuChipIcon }] : []),
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
                              style={{ 
                                width: `${Math.max(data.score, 0)}%`,
                                minWidth: data.score > 0 ? `${data.score}%` : '0%'
                              }}
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
                          
                          {/* Debug score display */}
                          <div className="text-xs text-gray-500 opacity-75">
                            Debug: {data.score}% ({data.passed_checks.length} passed, {data.issues.length} issues)
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
                      <div className="text-stone-700 dark:text-stone-300 leading-relaxed">
                        {cleanMarkdownText(result.ai_insights.summary)
                          .split('\n')
                          .filter(line => line.trim())
                          .map((line, index) => (
                            <p key={index} className="mb-3 last:mb-0 text-justify">
                              {line.trim()}
                            </p>
                          ))
                        }
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="card-ai">
                      <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <CheckCircleIcon className="w-5 h-5 text-green-500" />
                        Key Recommendations
                      </h4>
                      <ul className="space-y-3">
                        {result.ai_insights.key_recommendations.map((rec, index) => (
                          <li key={index} className="flex items-start gap-3 text-stone-700 dark:text-stone-300">
                            <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 shrink-0"></span>
                            <span className="text-justify leading-relaxed">
                              {cleanMarkdownText(rec)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="card-ai">
                      <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <InformationCircleIcon className="w-5 h-5 text-blue-500" />
                        Risk Assessment
                      </h4>
                      <ul className="space-y-3">
                        {cleanMarkdownText(result.ai_insights.risk_assessment)
                          .split(/[.\n]/) // Split by periods and newlines
                          .map(point => point.trim())
                          .filter(point => point.length > 10) // Filter out very short fragments
                          .map((point, index) => (
                            <li key={index} className="flex items-start gap-3 text-stone-700 dark:text-stone-300">
                              <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 shrink-0"></span>
                              <span className="text-justify leading-relaxed">
                                {point.endsWith('.') ? point : `${point}.`}
                              </span>
                            </li>
                          ))
                        }
                      </ul>
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
                                <li key={index} className="text-sm text-stone-700 dark:text-stone-300 flex items-start gap-3">
                                  <span className="w-1.5 h-1.5 bg-current rounded-full mt-2 shrink-0"></span>
                                  <span className="text-justify leading-relaxed">
                                    {cleanMarkdownText(item)}
                                  </span>
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

              {activeTab === 'multi-agent' && result.multi_agent_results && (
                <div className="space-y-8">
                  {/* Multi-Agent Analysis Header */}
                  <div className="card-ai">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-14 h-14 gradient-ai-primary rounded-xl flex items-center justify-center animate-glow">
                        <CpuChipIcon className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-gradient-ai">
                          Multi-Agent Analysis
                        </h3>
                        <p className="text-stone-600 dark:text-stone-300">
                          Advanced AI agents working together for comprehensive compliance analysis
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl">
                        <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                          {result.multi_agent_results.multi_agent_analysis.agents_involved?.length || 4}
                        </div>
                        <div className="text-sm text-stone-600 dark:text-stone-400">Active Agents</div>
                      </div>
                      <div className="text-center p-4 bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 rounded-xl">
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {result.multi_agent_results.violation_report.total_violations || 0}
                        </div>
                        <div className="text-sm text-stone-600 dark:text-stone-400">Violations Found</div>
                      </div>
                      <div className="text-center p-4 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl">
                        <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                          {result.multi_agent_results.risk_assessment.overall_risk_level?.toUpperCase() || 'MEDIUM'}
                        </div>
                        <div className="text-sm text-stone-600 dark:text-stone-400">Risk Level</div>
                      </div>
                    </div>
                  </div>

                  {/* Professional Implementation Roadmap */}
                  <div className="card-ai">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-14 h-14 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center">
                        <RocketLaunchIcon className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-stone-800 dark:text-stone-100">
                          Implementation Roadmap
                        </h3>
                        <p className="text-stone-600 dark:text-stone-300">
                          Strategic compliance implementation plan with phased approach
                        </p>
                      </div>
                    </div>

                    <div className="space-y-8">
                      {/* Roadmap Phases */}
                      {[
                        { 
                          key: 'immediate', 
                          title: 'Immediate Actions', 
                          subtitle: '0-2 weeks',
                          color: 'bg-red-500',
                          bgColor: 'bg-red-50 dark:bg-red-900/20',
                          borderColor: 'border-red-200 dark:border-red-800',
                          icon: '🚨',
                          description: 'Critical fixes requiring immediate attention'
                        },
                        { 
                          key: 'short_term', 
                          title: 'Short-term Goals', 
                          subtitle: '1-3 months',
                          color: 'bg-orange-500',
                          bgColor: 'bg-orange-50 dark:bg-orange-900/20',
                          borderColor: 'border-orange-200 dark:border-orange-800',
                          icon: '⚡',
                          description: 'Enhanced compliance and monitoring systems'
                        },
                        { 
                          key: 'long_term', 
                          title: 'Long-term Strategy', 
                          subtitle: '3-12 months',
                          color: 'bg-green-500',
                          bgColor: 'bg-green-50 dark:bg-green-900/20',
                          borderColor: 'border-green-200 dark:border-green-800',
                          icon: '🎯',
                          description: 'Advanced compliance governance and frameworks'
                        },
                        { 
                          key: 'ongoing_maintenance', 
                          title: 'Ongoing Maintenance', 
                          subtitle: 'Continuous',
                          color: 'bg-blue-500',
                          bgColor: 'bg-blue-50 dark:bg-blue-900/20',
                          borderColor: 'border-blue-200 dark:border-blue-800',
                          icon: '🔄',
                          description: 'Continuous monitoring and improvement'
                        },
                      ].map((phase, index) => (
                        <div key={phase.key} className={`${phase.bgColor} ${phase.borderColor} border-2 rounded-2xl p-6 relative overflow-hidden`}>
                          {/* Phase Header */}
                          <div className="flex items-center gap-4 mb-6">
                            <div className={`w-12 h-12 ${phase.color} rounded-xl flex items-center justify-center text-white font-bold text-xl`}>
                              {index + 1}
                            </div>
                            <div>
                              <div className="flex items-center gap-3">
                                <span className="text-2xl">{phase.icon}</span>
                                <h4 className="text-xl font-bold text-stone-800 dark:text-stone-100">
                                  {phase.title}
                                </h4>
                                <span className={`px-3 py-1 ${phase.color} text-white text-sm font-semibold rounded-full`}>
                                  {phase.subtitle}
                                </span>
                              </div>
                              <p className="text-stone-600 dark:text-stone-400 mt-1">
                                {phase.description}
                              </p>
                            </div>
                          </div>

                          {/* Action Items */}
                          <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
                            <div>
                              <h5 className="font-semibold text-stone-700 dark:text-stone-200 mb-4 flex items-center gap-2">
                                <CheckCircleIcon className="w-5 h-5 text-green-500" />
                                Action Items ({(result.multi_agent_results?.implementation_roadmap[phase.key as keyof typeof result.multi_agent_results.implementation_roadmap] as Array<string | ActionItem>)?.length || 0})
                              </h5>
                              <div className="space-y-4">
                                {(result.multi_agent_results?.implementation_roadmap[phase.key as keyof typeof result.multi_agent_results.implementation_roadmap] as Array<string | ActionItem> || []).map((item: string | ActionItem, itemIndex: number) => {
                                  // Handle both string and object formats for backward compatibility
                                  const isActionItem = typeof item === 'object' && item !== null;
                                  const actionText = isActionItem ? (item as ActionItem).action : (item as string);
                                  const actionItem = isActionItem ? item as ActionItem : null;

                                  return (
                                    <div key={itemIndex} className="bg-white/60 dark:bg-stone-800/60 rounded-xl p-4 border border-stone-200/50 dark:border-stone-700/50">
                                      {/* Main Action */}
                                      <div className="flex items-start gap-3 mb-3">
                                        <span className={`w-6 h-6 ${phase.color} rounded-full flex items-center justify-center text-white text-sm font-bold mt-0.5 shrink-0`}>
                                          {itemIndex + 1}
                                        </span>
                                        <div className="flex-1">
                                          <h6 className="font-semibold text-stone-800 dark:text-stone-100 leading-tight mb-2">
                                            {cleanMarkdownText(actionText)}
                                          </h6>
                                          
                                          {/* Action Details Grid */}
                                          {actionItem && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
                                              
                                              {/* Reason */}
                                              {actionItem.reason && (
                                                <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-3">
                                                  <div className="flex items-center gap-2 mb-1">
                                                    <LightBulbIcon className="w-4 h-4 text-blue-500" />
                                                    <span className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wide">Why</span>
                                                  </div>
                                                  <p className="text-sm text-blue-800 dark:text-blue-200">{actionItem.reason}</p>
                                                </div>
                                              )}

                                              {/* Effort */}
                                              {actionItem.effort && (
                                                <div className="bg-orange-50 dark:bg-orange-900/30 rounded-lg p-3">
                                                  <div className="flex items-center gap-2 mb-1">
                                                    <ClockIcon className="w-4 h-4 text-orange-500" />
                                                    <span className="text-xs font-semibold text-orange-700 dark:text-orange-300 uppercase tracking-wide">Effort</span>
                                                  </div>
                                                  <p className="text-sm text-orange-800 dark:text-orange-200">{actionItem.effort}</p>
                                                </div>
                                              )}

                                              {/* Validation */}
                                              {actionItem.validation && (
                                                <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-3">
                                                  <div className="flex items-center gap-2 mb-1">
                                                    <CheckCircleIcon className="w-4 h-4 text-green-500" />
                                                    <span className="text-xs font-semibold text-green-700 dark:text-green-300 uppercase tracking-wide">Validation</span>
                                                  </div>
                                                  <p className="text-sm text-green-800 dark:text-green-200">{actionItem.validation}</p>
                                                </div>
                                              )}

                                              {/* Skills */}
                                              {actionItem.skills && (
                                                <div className="bg-purple-50 dark:bg-purple-900/30 rounded-lg p-3">
                                                  <div className="flex items-center gap-2 mb-1">
                                                    <CpuChipIcon className="w-4 h-4 text-purple-500" />
                                                    <span className="text-xs font-semibold text-purple-700 dark:text-purple-300 uppercase tracking-wide">Skills</span>
                                                  </div>
                                                  <p className="text-sm text-purple-800 dark:text-purple-200">{actionItem.skills}</p>
                                                </div>
                                              )}

                                              {/* Dependencies */}
                                              {actionItem.dependencies && (
                                                <div className="bg-yellow-50 dark:bg-yellow-900/30 rounded-lg p-3">
                                                  <div className="flex items-center gap-2 mb-1">
                                                    <ExclamationTriangleIcon className="w-4 h-4 text-yellow-500" />
                                                    <span className="text-xs font-semibold text-yellow-700 dark:text-yellow-300 uppercase tracking-wide">Dependencies</span>
                                                  </div>
                                                  <p className="text-sm text-yellow-800 dark:text-yellow-200">{actionItem.dependencies}</p>
                                                </div>
                                              )}

                                              {/* Outcomes */}
                                              {actionItem.outcomes && (
                                                <div className="bg-teal-50 dark:bg-teal-900/30 rounded-lg p-3">
                                                  <div className="flex items-center gap-2 mb-1">
                                                    <ChartBarIcon className="w-4 h-4 text-teal-500" />
                                                    <span className="text-xs font-semibold text-teal-700 dark:text-teal-300 uppercase tracking-wide">Outcomes</span>
                                                  </div>
                                                  <p className="text-sm text-teal-800 dark:text-teal-200">{actionItem.outcomes}</p>
                                                </div>
                                              )}

                                              {/* Frequency (for maintenance items) */}
                                              {actionItem.frequency && (
                                                <div className="bg-indigo-50 dark:bg-indigo-900/30 rounded-lg p-3">
                                                  <div className="flex items-center gap-2 mb-1">
                                                    <ClockIcon className="w-4 h-4 text-indigo-500" />
                                                    <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 uppercase tracking-wide">Frequency</span>
                                                  </div>
                                                  <p className="text-sm text-indigo-800 dark:text-indigo-200">{actionItem.frequency}</p>
                                                </div>
                                              )}

                                              {/* Responsibility */}
                                              {actionItem.responsibility && (
                                                <div className="bg-rose-50 dark:bg-rose-900/30 rounded-lg p-3">
                                                  <div className="flex items-center gap-2 mb-1">
                                                    <GlobeAltIcon className="w-4 h-4 text-rose-500" />
                                                    <span className="text-xs font-semibold text-rose-700 dark:text-rose-300 uppercase tracking-wide">Responsibility</span>
                                                  </div>
                                                  <p className="text-sm text-rose-800 dark:text-rose-200">{actionItem.responsibility}</p>
                                                </div>
                                              )}

                                              {/* Priority */}
                                              {actionItem.priority && (
                                                <div className="bg-red-50 dark:bg-red-900/30 rounded-lg p-3">
                                                  <div className="flex items-center gap-2 mb-1">
                                                    <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />
                                                    <span className="text-xs font-semibold text-red-700 dark:text-red-300 uppercase tracking-wide">Priority</span>
                                                  </div>
                                                  <p className="text-sm text-red-800 dark:text-red-200">{actionItem.priority}</p>
                                                </div>
                                              )}

                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Phase Details from Backend */}
                            {result.multi_agent_results?.implementation_roadmap.phase_details?.[phase.key as keyof typeof result.multi_agent_results.implementation_roadmap.phase_details] && (
                              <div className="mt-6">
                                <h5 className="font-semibold text-stone-700 dark:text-stone-200 mb-4 flex items-center gap-2">
                                  <InformationCircleIcon className="w-5 h-5 text-blue-500" />
                                  Phase Overview
                                </h5>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {/* Timeline */}
                                  <div className="bg-white/50 dark:bg-stone-800/50 rounded-xl p-4">
                                    <h6 className="font-semibold text-stone-700 dark:text-stone-200 mb-2 flex items-center gap-2">
                                      <ClockIcon className="w-4 h-4" />
                                      Timeline
                                    </h6>
                                    <p className="text-stone-600 dark:text-stone-400">
                                      {result.multi_agent_results.implementation_roadmap.phase_details[phase.key as keyof typeof result.multi_agent_results.implementation_roadmap.phase_details]?.timeline || phase.subtitle}
                                    </p>
                                  </div>

                                  {/* Budget */}
                                  <div className="bg-white/50 dark:bg-stone-800/50 rounded-xl p-4">
                                    <h6 className="font-semibold text-stone-700 dark:text-stone-200 mb-2 flex items-center gap-2">
                                      <ChartBarIcon className="w-4 h-4" />
                                      Budget Estimate
                                    </h6>
                                    <p className="text-stone-600 dark:text-stone-400 text-sm">
                                      {result.multi_agent_results.implementation_roadmap.phase_details[phase.key as keyof typeof result.multi_agent_results.implementation_roadmap.phase_details]?.budget_estimate || 'Budget TBD'}
                                    </p>
                                  </div>

                                  {/* Team Size */}
                                  <div className="bg-white/50 dark:bg-stone-800/50 rounded-xl p-4">
                                    <h6 className="font-semibold text-stone-700 dark:text-stone-200 mb-2 flex items-center gap-2">
                                      <Cog6ToothIcon className="w-4 h-4" />
                                      Team Size
                                    </h6>
                                    <p className="text-stone-600 dark:text-stone-400 text-sm">
                                      {result.multi_agent_results.implementation_roadmap.phase_details[phase.key as keyof typeof result.multi_agent_results.implementation_roadmap.phase_details]?.team_size || 'Team resources required'}
                                    </p>
                                  </div>

                                  {/* Risk if Delayed */}
                                  <div className="bg-white/50 dark:bg-stone-800/50 rounded-xl p-4">
                                    <h6 className="font-semibold text-stone-700 dark:text-stone-200 mb-2 flex items-center gap-2">
                                      <ExclamationTriangleIcon className="w-4 h-4 text-orange-500" />
                                      Risk if Delayed
                                    </h6>
                                    <p className="text-stone-600 dark:text-stone-400 text-sm">
                                      {result.multi_agent_results.implementation_roadmap.phase_details[phase.key as keyof typeof result.multi_agent_results.implementation_roadmap.phase_details]?.risk_if_delayed || 'Potential compliance issues'}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Progress Indicator */}
                          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
                        </div>
                      ))}
                    </div>

                    {/* Roadmap Summary */}
                    <div className="mt-8 p-6 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
                      <h4 className="text-lg font-semibold text-stone-800 dark:text-stone-100 mb-3 flex items-center gap-2">
                        <InformationCircleIcon className="w-5 h-5 text-purple-500" />
                        Implementation Overview
                      </h4>
                      
                      {/* Summary Text */}
                      <p className="text-stone-700 dark:text-stone-300 leading-relaxed mb-6">
                        {result.multi_agent_results.implementation_roadmap.roadmap_summary || 'Comprehensive implementation plan for achieving regulatory compliance'}
                      </p>

                      {/* Key Metrics */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Total Implementation Time */}
                        {result.multi_agent_results.implementation_roadmap.total_implementation_time && (
                          <div className="bg-white/60 dark:bg-stone-800/60 rounded-lg p-4 text-center">
                            <div className="flex items-center justify-center gap-2 mb-2">
                              <ClockIcon className="w-5 h-5 text-blue-500" />
                              <span className="font-semibold text-stone-700 dark:text-stone-200">Total Timeline</span>
                            </div>
                            <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                              {result.multi_agent_results.implementation_roadmap.total_implementation_time}
                            </p>
                          </div>
                        )}

                        {/* Compliance Score Projection */}
                        {result.multi_agent_results.implementation_roadmap.compliance_score_projection && (
                          <div className="bg-white/60 dark:bg-stone-800/60 rounded-lg p-4 text-center">
                            <div className="flex items-center justify-center gap-2 mb-2">
                              <ChartBarIcon className="w-5 h-5 text-green-500" />
                              <span className="font-semibold text-stone-700 dark:text-stone-200">Expected Improvement</span>
                            </div>
                            <p className="text-lg font-bold text-green-600 dark:text-green-400">
                              {result.multi_agent_results.implementation_roadmap.compliance_score_projection}
                            </p>
                          </div>
                        )}

                        {/* Total Action Items */}
                        <div className="bg-white/60 dark:bg-stone-800/60 rounded-lg p-4 text-center">
                          <div className="flex items-center justify-center gap-2 mb-2">
                            <RocketLaunchIcon className="w-5 h-5 text-purple-500" />
                            <span className="font-semibold text-stone-700 dark:text-stone-200">Total Actions</span>
                          </div>
                          <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
                            {[
                              ...(result.multi_agent_results.implementation_roadmap.immediate || []),
                              ...(result.multi_agent_results.implementation_roadmap.short_term || []),
                              ...(result.multi_agent_results.implementation_roadmap.long_term || []),
                              ...(result.multi_agent_results.implementation_roadmap.ongoing_maintenance || [])
                            ].length} Items
                          </p>
                        </div>
                      </div>

                      {/* Implementation Tips */}
                      <div className="mt-6 p-4 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-lg border border-blue-200 dark:border-blue-700">
                        <h5 className="font-semibold text-stone-800 dark:text-stone-100 mb-2 flex items-center gap-2">
                          <BeakerIcon className="w-4 h-4 text-blue-500" />
                          Implementation Tips
                        </h5>
                        <ul className="text-sm text-stone-700 dark:text-stone-300 space-y-1">
                          <li className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 shrink-0"></span>
                            Start with immediate actions to address critical security and legal compliance issues
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 shrink-0"></span>
                            Each action item includes specific validation steps to ensure proper completion
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 shrink-0"></span>
                            Track progress and re-run compliance audits after each phase completion
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Risk Assessment from Multi-Agent */}
                  {result.multi_agent_results.risk_assessment && (
                    <div className="card-ai">
                      <h4 className="text-lg font-semibold mb-6 flex items-center gap-2">
                        <ExclamationTriangleIcon className="w-5 h-5 text-orange-500" />
                        Multi-Agent Risk Assessment
                      </h4>
                      
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>
                          <h5 className="font-semibold text-stone-700 dark:text-stone-200 mb-3">Risk Factors</h5>
                          <ul className="space-y-2">
                            {(result.multi_agent_results.risk_assessment.risk_factors || []).map((factor, index) => (
                              <li key={index} className="flex items-start gap-2 text-stone-700 dark:text-stone-300">
                                <ExclamationTriangleIcon className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
                                {cleanMarkdownText(factor)}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <h5 className="font-semibold text-stone-700 dark:text-stone-200 mb-3">Potential Penalties</h5>
                          <ul className="space-y-2">
                            {(result.multi_agent_results.risk_assessment.potential_penalties || []).map((penalty, index) => (
                              <li key={index} className="flex items-start gap-2 text-stone-700 dark:text-stone-300">
                                <XCircleIcon className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                                {cleanMarkdownText(penalty)}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="mt-6 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-200 dark:border-orange-800">
                        <h5 className="font-semibold text-orange-800 dark:text-orange-200 mb-2">Business Impact</h5>
                        <p className="text-orange-700 dark:text-orange-300">
                          {result.multi_agent_results.risk_assessment.business_impact || 'Impact assessment not available'}
                        </p>
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
