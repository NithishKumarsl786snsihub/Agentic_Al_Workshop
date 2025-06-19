#!/usr/bin/env python3
"""
SSL Error Analysis Demo Script

This script demonstrates the enhanced SSL error handling and multi-agent analysis 
for websites with SSL certificate issues.

Features:
- Detailed SSL certificate analysis
- Multi-agent SSL error diagnosis
- AI-powered insights and recommendations
- Comprehensive remediation guidance

Usage:
    python demo_ssl_analysis.py --url https://workplace.snsihub.ai/courses/ --api-key YOUR_GEMINI_API_KEY
"""

import asyncio
import json
import sys
import argparse
from typing import Dict, Any
from datetime import datetime

# Add the services directory to the path
sys.path.append('.')

from services.multi_agent_auditor import MultiAgentComplianceAuditor
from services.ai_analyzer import AIAnalyzer
from services.scraper import WebsiteScraper


class SSLAnalysisDemo:
    """Demo class for SSL error analysis"""
    
    def __init__(self, gemini_api_key: str):
        self.gemini_api_key = gemini_api_key
        self.scraper = WebsiteScraper()
        
    async def run_ssl_demo(self, url: str) -> Dict[str, Any]:
        """Run the complete SSL error analysis demo"""
        print(f"🔒 Starting SSL Error Analysis for: {url}")
        print("="*60)
        
        # Step 1: Attempt to scrape website and capture SSL error
        print("📊 Step 1: Analyzing website SSL configuration...")
        website_data, error, ssl_info = await self.scraper.fetch_website_content(url)
        
        if not error:
            print(f"✅ No SSL errors detected - website loaded successfully")
            print(f"   - Title: {website_data.title}")
            print(f"   - SSL Info: {ssl_info or 'Standard SSL configuration'}")
            return {"message": "No SSL errors to analyze"}
        
        if not ssl_info or ssl_info.get('error_type') != 'ssl_certificate_error':
            print(f"❌ Error detected but not SSL-related: {error}")
            return {"error": error, "type": "non_ssl_error"}
        
        print(f"🚨 SSL Error Detected!")
        print(f"   - Error Type: {ssl_info.get('error_type', 'Unknown')}")
        print(f"   - Hostname: {ssl_info.get('hostname', 'Unknown')}")
        print(f"   - Error Message: {ssl_info.get('error_message', 'Unknown')}")
        print()
        
        # Step 2: Display SSL certificate analysis
        self._display_ssl_certificate_info(ssl_info)
        
        # Step 3: Run AI analysis
        print("🤖 Step 2: Running AI-Powered SSL Analysis...")
        ai_results = None
        try:
            ai_analyzer = AIAnalyzer(self.gemini_api_key)
            ai_results = await ai_analyzer.analyze_ssl_error_with_ai(url, ssl_info)
            print("✅ AI analysis completed")
        except Exception as e:
            print(f"❌ AI analysis failed: {e}")
        
        # Step 4: Run multi-agent analysis
        print("\n🚀 Step 3: Running Multi-Agent SSL Analysis...")
        multi_agent_results = None
        try:
            multi_agent_auditor = MultiAgentComplianceAuditor(self.gemini_api_key)
            multi_agent_results = await multi_agent_auditor.analyze_ssl_error_with_agents(url, ssl_info)
            print("✅ Multi-agent analysis completed")
        except Exception as e:
            print(f"❌ Multi-agent analysis failed: {e}")
        
        print()
        
        # Step 5: Display comprehensive results
        self._display_comprehensive_results(ssl_info, ai_results, multi_agent_results)
        
        return {
            "ssl_error": ssl_info,
            "ai_analysis": ai_results,
            "multi_agent_analysis": multi_agent_results
        }
    
    def _display_ssl_certificate_info(self, ssl_info: Dict[str, Any]) -> None:
        """Display SSL certificate information"""
        print("📋 SSL Certificate Analysis:")
        print("-" * 40)
        
        cert_analysis = ssl_info.get('certificate_analysis', {})
        if cert_analysis.get('error'):
            print(f"   ❌ Certificate retrieval failed: {cert_analysis['error']}")
        else:
            subject = cert_analysis.get('subject', {})
            issuer = cert_analysis.get('issuer', {})
            
            print(f"   📄 Subject: {subject.get('commonName', 'Unknown')}")
            print(f"   🏢 Issuer: {issuer.get('organizationName', 'Unknown')}")
            print(f"   📅 Valid From: {cert_analysis.get('not_before', 'Unknown')}")
            print(f"   📅 Valid Until: {cert_analysis.get('not_after', 'Unknown')}")
            print(f"   🔏 Self-Signed: {'Yes' if cert_analysis.get('is_self_signed') else 'No'}")
        
        print()
        
        # Security implications
        implications = ssl_info.get('security_implications', [])
        if implications:
            print("⚠️  Security Implications:")
            for implication in implications:
                print(f"   • {implication}")
            print()
        
        # Remediation suggestions
        suggestions = ssl_info.get('remediation_suggestions', [])
        if suggestions:
            print("🛠️  Immediate Remediation Steps:")
            for i, suggestion in enumerate(suggestions, 1):
                print(f"   {i}. {suggestion}")
            print()
    
    def _display_comprehensive_results(self, ssl_info: Dict, ai_results: Any, multi_agent_results: Dict) -> None:
        """Display comprehensive analysis results"""
        print("📊 COMPREHENSIVE SSL ERROR ANALYSIS RESULTS")
        print("="*60)
        
        # AI Analysis Results
        if ai_results:
            print("🤖 AI-Powered Analysis:")
            print("-" * 30)
            print("💡 Key Insights:")
            print(ai_results.ai_insights[:500] + "..." if len(ai_results.ai_insights) > 500 else ai_results.ai_insights)
            print()
            
            print("📋 Priority Recommendations:")
            print(ai_results.priority_recommendations[:500] + "..." if len(ai_results.priority_recommendations) > 500 else ai_results.priority_recommendations)
            print()
        
        # Multi-Agent Analysis Results
        if multi_agent_results:
            print("🔍 Multi-Agent Analysis:")
            print("-" * 30)
            
            # Security Assessment
            security = multi_agent_results.get('security_assessment', {})
            print("🛡️  Security Assessment:")
            print(f"   Business Impact: {security.get('business_impact', 'Unknown')}")
            print(f"   Urgency Level: {security.get('urgency_level', 'Unknown')}")
            
            risks = security.get('security_risks', [])
            if risks:
                print("   Security Risks:")
                for risk in risks[:3]:  # Show first 3
                    print(f"     • {risk}")
            print()
            
            # Risk Matrix
            risk_matrix = multi_agent_results.get('risk_matrix', {})
            print("📊 Risk Assessment Matrix:")
            print(f"   Overall Risk: {risk_matrix.get('overall_risk', 'Unknown')}")
            print(f"   Technical Risk: {risk_matrix.get('technical_risk', 'Unknown')}")
            print(f"   Business Risk: {risk_matrix.get('business_risk', 'Unknown')}")
            print(f"   Compliance Risk: {risk_matrix.get('compliance_risk', 'Unknown')}")
            print()
            
            # Technical Remediation
            remediation = multi_agent_results.get('technical_remediation', {})
            immediate = remediation.get('immediate_actions', [])
            if immediate:
                print("⚡ Immediate Actions Required:")
                for action in immediate:
                    print(f"   1. {action}")
            
            config_steps = remediation.get('configuration_steps', [])
            if config_steps:
                print("\n🔧 Configuration Steps:")
                for i, step in enumerate(config_steps, 1):
                    print(f"   {i}. {step}")
            print()
            
            # Implementation Priority
            priority = multi_agent_results.get('implementation_priority', {})
            timeline = priority.get('timeline', {})
            if timeline:
                print("⏰ Implementation Timeline:")
                print(f"   Immediate (Critical): {timeline.get('immediate', 'Not specified')}")
                print(f"   Short-term (High): {timeline.get('short_term', 'Not specified')}")
                print(f"   Medium-term (Medium): {timeline.get('medium_term', 'Not specified')}")
            print()
        
        # Summary and Next Steps
        print("🎯 EXECUTIVE SUMMARY")
        print("="*30)
        print("SSL Certificate Issue Detected:")
        print(f"• Error Type: {ssl_info.get('error_type', 'Unknown')}")
        print(f"• Affected Domain: {ssl_info.get('hostname', 'Unknown')}")
        print(f"• Business Impact: Critical - Immediate attention required")
        print()
        print("Recommended Actions:")
        print("1. 🚨 URGENT: Install valid SSL certificate within 24 hours")
        print("2. 🔧 Configure proper certificate chain and server settings")
        print("3. 🧪 Test installation across all major browsers")
        print("4. 📊 Set up monitoring for certificate expiration")
        print("5. 📋 Document incident and create prevention procedures")
        print()
        print("🔒 Security Note: Until resolved, user data is at risk and")
        print("   browsers will display security warnings to visitors.")


async def main():
    """Main demo function"""
    parser = argparse.ArgumentParser(description='SSL Error Analysis Demo')
    parser.add_argument('--url', required=True, help='Website URL with SSL issues to analyze')
    parser.add_argument('--api-key', required=True, help='Gemini API key')
    parser.add_argument('--output', help='Output file for results (JSON)')
    
    args = parser.parse_args()
    
    print("🔒 SSL ERROR ANALYSIS DEMO")
    print("="*60)
    print("This demo analyzes SSL certificate errors and provides:")
    print("1. 🔍 Detailed certificate analysis")
    print("2. 🤖 AI-powered insights and recommendations")
    print("3. 🚀 Multi-agent security analysis")
    print("4. 🛠️  Step-by-step remediation guidance")
    print()
    
    demo = SSLAnalysisDemo(args.api_key)
    results = await demo.run_ssl_demo(args.url)
    
    if args.output:
        with open(args.output, 'w') as f:
            json.dump(results, f, indent=2, default=str)
        print(f"📄 Results saved to: {args.output}")


if __name__ == '__main__':
    asyncio.run(main()) 