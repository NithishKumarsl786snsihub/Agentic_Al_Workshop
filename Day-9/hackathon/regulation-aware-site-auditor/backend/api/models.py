from pydantic import BaseModel, HttpUrl, Field
from typing import List, Dict, Optional, Any, Union
from enum import Enum

class SeverityLevel(str, Enum):
    """Severity levels for compliance issues"""
    HIGH = "High"
    MEDIUM = "Medium"
    LOW = "Low"

class ComplianceCategory(str, Enum):
    """Compliance categories"""
    GDPR = "GDPR"
    ACCESSIBILITY = "Accessibility"
    WCAG = "WCAG"
    SEO = "SEO"
    SECURITY = "Security"

class PriorityLevel(str, Enum):
    """Priority levels for recommendations"""
    HIGH = "High"
    MEDIUM = "Medium"
    LOW = "Low"

class AuditRequest(BaseModel):
    """Request model for website audit"""
    url: str = Field(..., description="Website URL to audit")
    enable_ai: bool = Field(default=True, description="Enable AI-powered insights")
    enable_rag: bool = Field(default=True, description="Enable regulatory guidance")
    enable_multi_agent: bool = Field(default=False, description="Enable multi-agent analysis")
    gemini_api_key: Optional[str] = Field(default=None, description="Optional Gemini API key")
    
    class Config:
        json_schema_extra = {
            "example": {
                "url": "https://example.com",
                "enable_ai": True,
                "enable_rag": True,
                "enable_multi_agent": True,
                "gemini_api_key": "your-api-key-here"
            }
        }

class MetaTag(BaseModel):
    """Meta tag information"""
    name: str
    content: str

class ImageInfo(BaseModel):
    """Image information"""
    src: str
    alt: str = ""
    title: str = ""
    width: str = ""
    height: str = ""

class InputInfo(BaseModel):
    """Form input information"""
    type: str = "text"
    name: str = ""
    required: bool = False
    label: str = ""

class FormInfo(BaseModel):
    """Form information"""
    action: str = ""
    method: str = "GET"
    inputs: List[InputInfo] = []

class LinkInfo(BaseModel):
    """Link information"""
    href: str
    text: str = ""
    title: str = ""
    target: str = ""

class ScriptInfo(BaseModel):
    """Script information"""
    src: str = ""
    type: str = ""
    content: str = ""

class HeadingInfo(BaseModel):
    """Heading information"""
    level: int
    text: str
    id: str = ""

class SSLError(BaseModel):
    """SSL/TLS error information"""
    error_type: str
    hostname: str
    port: int
    error_message: str
    certificate_analysis: Dict[str, Any] = {}
    security_implications: List[str] = []
    remediation_suggestions: List[str] = []

class SecurityIssue(BaseModel):
    """Security issue information"""
    issue_type: str
    severity: str
    description: str
    impact: List[str] = []
    recommendations: List[str] = []

class WebsiteData(BaseModel):
    """Website content data"""
    url: str
    title: str
    html_content: str
    meta_tags: Dict[str, str] = {}
    images: List[ImageInfo] = []
    forms: List[FormInfo] = []
    links: List[LinkInfo] = []
    scripts: List[ScriptInfo] = []
    css_styles: List[str] = []
    headings: List[HeadingInfo] = []
    content_text: str = ""
    ssl_info: Optional[Dict[str, Any]] = None

class ComplianceIssue(BaseModel):
    """Individual compliance issue"""
    severity: SeverityLevel
    category: ComplianceCategory
    issue: str
    description: str

class ComplianceRecommendation(BaseModel):
    """Compliance recommendation"""
    category: ComplianceCategory
    recommendation: str
    priority: PriorityLevel

class CategoryResults(BaseModel):
    """Results for a specific compliance category"""
    issues: List[ComplianceIssue] = []
    recommendations: List[ComplianceRecommendation] = []
    passed: List[str] = []

class ComplianceResults(BaseModel):
    """Overall compliance results"""
    url: str
    title: str
    issues: List[ComplianceIssue] = []
    recommendations: List[ComplianceRecommendation] = []
    score: float = 0.0
    categories: Dict[str, CategoryResults] = {}

class AIInsights(BaseModel):
    """AI-generated insights"""
    ai_insights: str = ""
    priority_recommendations: str = ""
    improvement_suggestions: str = ""
    analysis_summary: str = ""

class RegulatoryGuidance(BaseModel):
    """Regulatory guidance from RAG"""
    content: str
    source: str
    category: str
    relevance_score: float

class ContextualRecommendation(BaseModel):
    """Contextual recommendation with regulatory guidance"""
    issue: str
    category: str
    regulatory_guidance: List[RegulatoryGuidance] = []
    implementation_priority: SeverityLevel

# Multi-Agent System Models
class ViolationReport(BaseModel):
    """Violation report from compliance scanner agent"""
    total_violations: int = 0
    by_category: Dict[str, List[str]] = {}
    severity_breakdown: Dict[str, int] = {}
    raw_findings: str = ""

class LegalContext(BaseModel):
    """Legal context from legal update retriever agent"""
    recent_updates: List[str] = []
    relevant_regulations: List[str] = []
    enforcement_trends: List[str] = []
    compliance_deadlines: List[str] = []
    regional_variations: List[str] = []
    update_summary: str = ""

class MappedIssues(BaseModel):
    """Mapped issues from issue mapping agent"""
    mapped_violations: List[Dict[str, Any]] = []
    regulatory_citations: List[str] = []
    risk_matrix: Dict[str, Any] = {}
    prioritization: List[str] = []
    mapping_summary: str = ""

class RemediationPlan(BaseModel):
    """Remediation plan from remediation advisor agent"""
    immediate_actions: List[str] = []
    technical_fixes: List[str] = []
    code_examples: List[str] = []
    policy_updates: List[str] = []
    testing_procedures: List[str] = []
    remediation_summary: str = ""

class RiskAssessment(BaseModel):
    """Risk assessment from multi-agent analysis"""
    overall_risk_level: str = "medium"
    risk_factors: List[str] = []
    potential_penalties: List[str] = []
    business_impact: str = ""
    risk_summary: str = ""

class ImplementationRoadmap(BaseModel):
    """Implementation roadmap from multi-agent analysis"""
    immediate: List[str] = []
    short_term: List[str] = []
    long_term: List[str] = []
    ongoing_maintenance: List[str] = []
    timeline_overview: Optional[Dict[str, str]] = None
    resource_requirements: Optional[Dict[str, str]] = None
    success_metrics: Optional[Dict[str, str]] = None
    roadmap_summary: str = ""

class MultiAgentAnalysis(BaseModel):
    """Multi-agent analysis results"""
    execution_summary: str = ""
    agents_involved: List[str] = []
    analysis_timestamp: str = ""
    website_url: str = ""
    crew_output: str = ""
    status: str = "completed"

class MultiAgentResults(BaseModel):
    """Complete multi-agent system results"""
    multi_agent_analysis: MultiAgentAnalysis
    violation_report: ViolationReport
    legal_context: LegalContext
    mapped_issues: MappedIssues
    remediation_plan: RemediationPlan
    risk_assessment: RiskAssessment
    implementation_roadmap: ImplementationRoadmap

class ReportData(BaseModel):
    """Comprehensive report data"""
    executive_summary: str = ""
    detailed_findings: str = ""
    priority_matrix: str = ""
    implementation_roadmap: str = ""
    technical_details: str = ""
    ai_insights: Optional[AIInsights] = None
    regulatory_guidance: Optional[List[ContextualRecommendation]] = None

class AuditResponse(BaseModel):
    """Response model for website audit"""
    success: bool
    message: str = ""
    website_data: Optional[WebsiteData] = None
    compliance_results: Optional[ComplianceResults] = None
    ai_analysis: Optional[AIInsights] = None
    multi_agent_results: Optional[MultiAgentResults] = None
    rag_recommendations: Optional[List[ContextualRecommendation]] = None
    report_data: Optional[ReportData] = None
    ssl_error: Optional[Dict[str, Any]] = None
    error_analysis: Optional[Dict[str, Any]] = None
    processing_time: float = 0.0
    
    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "message": "Audit completed successfully",
                "compliance_results": {
                    "url": "https://example.com",
                    "title": "Example Site",
                    "score": 85.5,
                    "issues": [],
                    "recommendations": [],
                    "categories": {}
                },
                "processing_time": 12.5
            }
        }

class RAGUpdateRequest(BaseModel):
    """Request to update RAG content"""
    force_update: bool = Field(default=False, description="Force update even if recent")

class RAGUpdateResponse(BaseModel):
    """Response for RAG content update"""
    success: bool
    message: str
    updated_sources: List[str] = []
    processing_time: float = 0.0

class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    message: str
    timestamp: str
    version: str 