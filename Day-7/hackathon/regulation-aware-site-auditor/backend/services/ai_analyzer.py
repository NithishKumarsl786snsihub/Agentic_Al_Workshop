import google.generativeai as genai
import json
from typing import Optional, Dict, Any
from core.config import settings
from api.models import WebsiteData, ComplianceResults, AIInsights

class AIAnalyzer:
    """AI-powered website analysis using Google Gemini"""
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.GEMINI_API_KEY
        if not self.api_key:
            raise ValueError("Gemini API key is required")
        
        genai.configure(api_key=self.api_key)
        self.model = genai.GenerativeModel(settings.AI_MODEL)

    async def analyze_website_with_ai(
        self, 
        website_data: WebsiteData, 
        compliance_results: ComplianceResults
    ) -> AIInsights:
        """Use Gemini to provide intelligent analysis and recommendations"""
        try:
            # Prepare context for AI analysis
            context = self._prepare_analysis_context(website_data, compliance_results)

            # Generate AI analysis components
            ai_insights = await self._generate_ai_insights(context)
            priority_recommendations = await self._generate_priority_recommendations(context)
            improvement_suggestions = await self._generate_improvement_suggestions(context)
            analysis_summary = self._generate_analysis_summary(compliance_results)

            return AIInsights(
                ai_insights=ai_insights,
                priority_recommendations=priority_recommendations,
                improvement_suggestions=improvement_suggestions,
                analysis_summary=analysis_summary
            )

        except Exception as e:
            return AIInsights(
                ai_insights=f"AI analysis failed: {str(e)}",
                priority_recommendations="AI recommendations unavailable",
                improvement_suggestions="AI suggestions unavailable",
                analysis_summary="AI analysis unavailable"
            )

    def _prepare_analysis_context(
        self, 
        website_data: WebsiteData, 
        compliance_results: ComplianceResults
    ) -> Dict[str, Any]:
        """Prepare context for AI analysis"""
        context = {
            'url': website_data.url,
            'title': website_data.title,
            'total_issues': len(compliance_results.issues),
            'compliance_score': compliance_results.score,
            'issues_by_category': {},
            'website_structure': {
                'images_count': len(website_data.images),
                'forms_count': len(website_data.forms),
                'links_count': len(website_data.links),
                'headings_count': len(website_data.headings)
            }
        }

        # Group issues by category and severity
        for issue in compliance_results.issues:
            category = issue.category
            if category not in context['issues_by_category']:
                context['issues_by_category'][category] = {'High': 0, 'Medium': 0, 'Low': 0}
            context['issues_by_category'][category][issue.severity] += 1

        return context

    async def _generate_ai_insights(self, context: Dict[str, Any]) -> str:
        """Generate AI-powered insights about the website"""
        prompt = f"""
        Analyze this website compliance audit data and provide intelligent insights:

        Website: {context['url']}
        Title: {context['title']}
        Compliance Score: {context['compliance_score']}%
        Total Issues: {context['total_issues']}

        Issues by Category:
        {json.dumps(context['issues_by_category'], indent=2)}

        Website Structure:
        - Images: {context['website_structure']['images_count']}
        - Forms: {context['website_structure']['forms_count']}
        - Links: {context['website_structure']['links_count']}
        - Headings: {context['website_structure']['headings_count']}

        Provide 3-4 key insights about the website's compliance status, focusing on:
        1. Overall compliance health
        2. Most critical areas needing attention
        3. Positive aspects that are working well
        4. Business impact of current issues

        Keep insights concise and actionable.
        """

        try:
            response = self.model.generate_content(prompt)
            return response.text
        except Exception as e:
            return f"Failed to generate AI insights: {str(e)}"

    async def _generate_priority_recommendations(self, context: Dict[str, Any]) -> str:
        """Generate prioritized recommendations"""
        prompt = f"""
        Based on this website compliance audit, provide the top 5 priority recommendations:

        Website: {context['url']}
        Compliance Score: {context['compliance_score']}%
        Total Issues: {context['total_issues']}

        Issues by Category:
        {json.dumps(context['issues_by_category'], indent=2)}

        Provide exactly 5 recommendations in order of priority, considering:
        1. Legal compliance risk
        2. User experience impact
        3. Implementation difficulty
        4. Business impact

        Format each recommendation as:
        - Priority X: [Brief title] - [Concise description and why it's important]

        Focus on actionable items that can be implemented quickly.
        """

        try:
            response = self.model.generate_content(prompt)
            return response.text
        except Exception as e:
            return f"Failed to generate priority recommendations: {str(e)}"

    async def _generate_improvement_suggestions(self, context: Dict[str, Any]) -> str:
        """Generate specific improvement suggestions"""
        prompt = f"""
        Provide specific, technical improvement suggestions for this website:

        Website: {context['url']}
        Compliance Score: {context['compliance_score']}%

        Issues by Category:
        {json.dumps(context['issues_by_category'], indent=2)}

        Provide concrete, implementable suggestions with code examples where appropriate.
        Focus on:
        1. GDPR compliance improvements
        2. Accessibility enhancements
        3. Technical implementation tips
        4. Tools and resources that can help

        Keep suggestions practical and include specific HTML/CSS examples when relevant.
        """

        try:
            response = self.model.generate_content(prompt)
            return response.text
        except Exception as e:
            return f"Failed to generate improvement suggestions: {str(e)}"

    def _generate_analysis_summary(self, compliance_results: ComplianceResults) -> str:
        """Generate a summary of the analysis"""
        total_issues = len(compliance_results.issues)
        high_severity = len([i for i in compliance_results.issues if i.severity == "High"])
        medium_severity = len([i for i in compliance_results.issues if i.severity == "Medium"])
        low_severity = len([i for i in compliance_results.issues if i.severity == "Low"])

        summary = f"""
📊 **Analysis Summary**

**Overall Score:** {compliance_results.score}%
**Total Issues Found:** {total_issues}

**Issue Breakdown:**
- 🔴 High Priority: {high_severity} issues
- 🟡 Medium Priority: {medium_severity} issues
- 🟢 Low Priority: {low_severity} issues

**Categories Analyzed:**
- GDPR Compliance
- Accessibility (ADA/WCAG)
- SEO Optimization
- Security Best Practices
        """

        return summary 