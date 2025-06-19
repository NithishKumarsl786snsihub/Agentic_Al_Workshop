from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
import time
import asyncio
from typing import Optional

from api.models import (
    AuditRequest, AuditResponse, RAGUpdateRequest, 
    RAGUpdateResponse, HealthResponse, MultiAgentResults
)
from services.scraper import WebsiteScraper
from services.compliance import ComplianceChecker
from services.ai_analyzer import AIAnalyzer
from services.multi_agent_auditor import MultiAgentComplianceAuditor
from core.config import settings

# Create router
compliance_router = APIRouter()

# Initialize services
scraper = WebsiteScraper()
compliance_checker = ComplianceChecker()

@compliance_router.post("/audit", response_model=AuditResponse)
async def audit_website(request: AuditRequest):
    """Perform comprehensive website compliance audit with optional multi-agent analysis"""
    start_time = time.time()
    
    try:
        # Step 1: Validate and prepare URL
        url = request.url.strip()
        if not url.startswith(('http://', 'https://')):
            url = 'https://' + url

        # Step 2: Scrape website content with enhanced error handling
        website_data, scraping_error, error_info = await scraper.fetch_website_content(url)
        
        # Handle SSL errors with multi-agent analysis
        ssl_analysis_results = None
        ssl_ai_analysis = None
        if scraping_error and error_info and error_info.get('error_type') == 'ssl_certificate_error':
            # Run SSL-specific multi-agent analysis
            if request.enable_multi_agent:
                try:
                    api_key = request.gemini_api_key or settings.GEMINI_API_KEY
                    if api_key:
                        multi_agent_auditor = MultiAgentComplianceAuditor(api_key)
                        ssl_analysis_results = await multi_agent_auditor.analyze_ssl_error_with_agents(url, error_info)
                except Exception as ssl_analysis_error:
                    print(f"SSL multi-agent analysis failed: {str(ssl_analysis_error)}")
            
            # Run SSL-specific AI analysis
            if request.enable_ai:
                try:
                    api_key = request.gemini_api_key or settings.GEMINI_API_KEY
                    if api_key:
                        ai_analyzer = AIAnalyzer(api_key)
                        ssl_ai_analysis = await ai_analyzer.analyze_ssl_error_with_ai(url, error_info)
                except Exception as ssl_ai_error:
                    print(f"SSL AI analysis failed: {str(ssl_ai_error)}")
            
            # Return detailed SSL error response
            processing_time = round(time.time() - start_time, 2)
            return AuditResponse(
                success=False,
                message=f"SSL Certificate Error: {scraping_error}",
                ssl_error=error_info,
                error_analysis=ssl_analysis_results,
                ai_analysis=ssl_ai_analysis,
                processing_time=processing_time
            )
        elif scraping_error:
            # Handle other scraping errors
            processing_time = round(time.time() - start_time, 2)
            return AuditResponse(
                success=False,
                message=f"Scraping failed: {scraping_error}",
                error_analysis=error_info,
                processing_time=processing_time
            )

        # Step 3: Run compliance checks
        compliance_results = await compliance_checker.analyze_compliance(website_data)

        # Step 4: AI Analysis (if enabled and API key provided)
        ai_analysis = None
        if request.enable_ai:
            try:
                # Use provided API key or fallback to settings
                api_key = request.gemini_api_key or settings.GEMINI_API_KEY
                if api_key:
                    ai_analyzer = AIAnalyzer(api_key)
                    ai_analysis = await ai_analyzer.analyze_website_with_ai(
                        website_data, compliance_results
                    )
                else:
                    ai_analysis = None
            except Exception as e:
                # AI analysis failure shouldn't break the entire audit
                print(f"AI analysis failed: {str(e)}")
                ai_analysis = None

        # Step 5: Multi-Agent Analysis (if enabled)
        multi_agent_results = None
        if request.enable_multi_agent:
            try:
                api_key = request.gemini_api_key or settings.GEMINI_API_KEY
                if api_key:
                    multi_agent_auditor = MultiAgentComplianceAuditor(api_key)
                    multi_agent_output = await multi_agent_auditor.audit_website_with_agents(website_data)
                    
                    # Convert to proper model structure
                    multi_agent_results = MultiAgentResults(
                        multi_agent_analysis=multi_agent_output.get("multi_agent_analysis", {}),
                        violation_report=multi_agent_output.get("violation_report", {}),
                        legal_context=multi_agent_output.get("legal_context", {}),
                        mapped_issues=multi_agent_output.get("mapped_issues", {}),
                        remediation_plan=multi_agent_output.get("remediation_plan", {}),
                        risk_assessment=multi_agent_output.get("risk_assessment", {}),
                        implementation_roadmap=multi_agent_output.get("implementation_roadmap", {})
                    )
                else:
                    print("Multi-agent analysis requires API key")
                    multi_agent_results = None
            except Exception as e:
                print(f"Multi-agent analysis failed: {str(e)}")
                multi_agent_results = None

        # Step 6: RAG Recommendations (if enabled)
        rag_recommendations = None
        if request.enable_rag:
            try:
                # Note: RAG implementation would go here
                # For now, returning None
                rag_recommendations = None
            except Exception as e:
                print(f"RAG recommendations failed: {str(e)}")
                rag_recommendations = None

        # Calculate processing time
        processing_time = round(time.time() - start_time, 2)

        return AuditResponse(
            success=True,
            message="Audit completed successfully",
            website_data=website_data,
            compliance_results=compliance_results,
            ai_analysis=ai_analysis,
            multi_agent_results=multi_agent_results,
            rag_recommendations=rag_recommendations,
            processing_time=processing_time
        )

    except HTTPException:
        raise
    except Exception as e:
        processing_time = round(time.time() - start_time, 2)
        return AuditResponse(
            success=False,
            message=f"Audit failed: {str(e)}",
            processing_time=processing_time
        )

@compliance_router.post("/multi-agent-update")
async def update_multi_agent_knowledge(background_tasks: BackgroundTasks):
    """Update the multi-agent system's legal knowledge base"""
    try:
        # Initialize multi-agent auditor
        multi_agent_auditor = MultiAgentComplianceAuditor()
        
        # Update knowledge base in background
        background_tasks.add_task(multi_agent_auditor.update_legal_knowledge_base)
        
        return {
            "success": True,
            "message": "Multi-agent knowledge base update initiated",
            "status": "processing"
        }
    except Exception as e:
        return {
            "success": False,
            "message": f"Failed to initiate knowledge base update: {str(e)}",
            "status": "failed"
        }

@compliance_router.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        message="Compliance Auditor API is running",
        timestamp=time.strftime('%Y-%m-%d %H:%M:%S'),
        version=settings.APP_VERSION
    )

@compliance_router.post("/update-rag", response_model=RAGUpdateResponse)
async def update_rag_content(request: RAGUpdateRequest, background_tasks: BackgroundTasks):
    """Update RAG regulatory content"""
    start_time = time.time()
    
    try:
        # This would implement RAG content updating
        # For now, returning a mock response
        processing_time = round(time.time() - start_time, 2)
        
        return RAGUpdateResponse(
            success=True,
            message="RAG content update initiated",
            updated_sources=["GDPR", "WCAG", "ADA"],
            processing_time=processing_time
        )
    
    except Exception as e:
        processing_time = round(time.time() - start_time, 2)
        return RAGUpdateResponse(
            success=False,
            message=f"RAG update failed: {str(e)}",
            updated_sources=[],
            processing_time=processing_time
        )

@compliance_router.get("/categories")
async def get_compliance_categories():
    """Get available compliance categories"""
    return {
        "categories": [
            {
                "id": "gdpr",
                "name": "GDPR",
                "description": "General Data Protection Regulation compliance",
                "icon": "🛡️"
            },
            {
                "id": "accessibility",
                "name": "Accessibility",
                "description": "Web accessibility compliance (ADA/WCAG)",
                "icon": "♿"
            },
            {
                "id": "wcag",
                "name": "WCAG",
                "description": "Web Content Accessibility Guidelines",
                "icon": "📋"
            },
            {
                "id": "seo",
                "name": "SEO",
                "description": "Search Engine Optimization best practices",
                "icon": "🔍"
            },
            {
                "id": "security",
                "name": "Security",
                "description": "Basic security compliance checks",
                "icon": "🔒"
            }
        ]
    }

@compliance_router.get("/severity-levels")
async def get_severity_levels():
    """Get available severity levels"""
    return {
        "levels": [
            {
                "id": "High",
                "name": "High Priority",
                "description": "Critical issues requiring immediate attention",
                "color": "#dc2626",
                "icon": "🔴"
            },
            {
                "id": "Medium",
                "name": "Medium Priority", 
                "description": "Important issues that should be addressed soon",
                "color": "#f59e0b",
                "icon": "🟡"
            },
            {
                "id": "Low",
                "name": "Low Priority",
                "description": "Minor issues for future improvement",
                "color": "#16a34a", 
                "icon": "🟢"
            }
        ]
    }

@compliance_router.get("/multi-agent-status")
async def get_multi_agent_status():
    """Get multi-agent system status and capabilities"""
    try:
        # Try to initialize multi-agent system
        multi_agent_auditor = MultiAgentComplianceAuditor()
        return {
            "status": "available",
            "agents": [
                {
                    "name": "Compliance Scanner",
                    "role": "Website scanning and violation detection",
                    "capabilities": ["GDPR scanning", "WCAG analysis", "Accessibility checks"]
                },
                {
                    "name": "Legal Update Retriever",
                    "role": "Legal research and regulatory updates",
                    "capabilities": ["Regulatory monitoring", "Legal database search", "Enforcement tracking"]
                },
                {
                    "name": "Issue Mapping Agent",
                    "role": "Risk assessment and issue prioritization",
                    "capabilities": ["Risk analysis", "Regulatory mapping", "Impact assessment"]
                },
                {
                    "name": "Remediation Advisor",
                    "role": "Technical fix generation and implementation guidance",
                    "capabilities": ["Code generation", "Implementation guides", "Testing procedures"]
                }
            ],
            "features": [
                "Sequential task execution",
                "Context-aware analysis",
                "Comprehensive reporting",
                "Actionable remediation plans"
            ]
        }
    except Exception as e:
        return {
            "status": "unavailable",
            "error": str(e),
            "message": "Multi-agent system requires proper configuration"
        } 