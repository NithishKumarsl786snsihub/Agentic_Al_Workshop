from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
import time
import asyncio
from typing import Optional

from api.models import (
    AuditRequest, AuditResponse, RAGUpdateRequest, 
    RAGUpdateResponse, HealthResponse
)
from services.scraper import WebsiteScraper
from services.compliance import ComplianceChecker
from services.ai_analyzer import AIAnalyzer
from core.config import settings

# Create router
compliance_router = APIRouter()

# Initialize services
scraper = WebsiteScraper()
compliance_checker = ComplianceChecker()

@compliance_router.post("/audit", response_model=AuditResponse)
async def audit_website(request: AuditRequest):
    """Perform comprehensive website compliance audit"""
    start_time = time.time()
    
    try:
        # Step 1: Validate and prepare URL
        url = request.url.strip()
        if not url.startswith(('http://', 'https://')):
            url = 'https://' + url

        # Step 2: Scrape website content
        website_data, scraping_error = await scraper.fetch_website_content(url)
        if scraping_error:
            raise HTTPException(status_code=400, detail=f"Scraping failed: {scraping_error}")

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

        # Step 5: RAG Recommendations (if enabled)
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