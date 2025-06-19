#!/usr/bin/env python3
"""
Multi-Agent Compliance Auditor Demo Script

This script demonstrates the four specialized agents working together 
to provide comprehensive website compliance auditing.

Agents:
1. Compliance Scanner - Detects compliance issues
2. Legal Update Retriever - Fetches latest regulations
3. Issue Mapping Agent - Maps issues to regulations
4. Remediation Advisor - Provides actionable fixes

Usage:
    python demo_multi_agent.py --url https://example.com --api-key YOUR_GEMINI_API_KEY
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
from services.scraper import WebsiteScraper
from api.models import WebsiteData


class MultiAgentDemo:
    """Demo class for the multi-agent compliance auditor"""
    
    def __init__(self, api_key: str):
        self.auditor = MultiAgentComplianceAuditor(api_key)
        self.scraper = WebsiteScraper()
        
    async def run_demo(self, url: str) -> Dict[str, Any]:
        """Run a comprehensive multi-agent demo"""
        print(f"🚀 Starting Multi-Agent Compliance Audit for: {url}")
        print("=" * 60)
        
        try:
            # Step 1: Scrape website
            print("📊 Step 1: Scraping website content...")
            website_data, error, error_info = await self.scraper.fetch_website_content(url)
            
            if error:
                print(f"❌ Error scraping website: {error}")
                return {}
            
            print(f"✅ Successfully scraped: {website_data.title}")
            print(f"   - Images: {len(website_data.images)}")
            print(f"   - Forms: {len(website_data.forms)}")
            print(f"   - Links: {len(website_data.links)}")
            print()
            
            # Step 2: Run multi-agent analysis
            print("🤖 Step 2: Running Multi-Agent Analysis...")
            print("   This may take 60-120 seconds as agents work sequentially...")
            
            results = await self.auditor.audit_website_with_agents(website_data)
            
            # Step 3: Display results
            print("\n🎯 Step 3: Analysis Results")
            print("=" * 60)
            
            self._display_comprehensive_results(results)
            
            return results
            
        except Exception as e:
            print(f"❌ Demo failed with error: {str(e)}")
            import traceback
            traceback.print_exc()
            return {}
    
    def _display_comprehensive_results(self, results: Dict[str, Any]) -> None:
        """Display comprehensive multi-agent results"""
        
        # Multi-agent analysis summary
        if "multi_agent_analysis" in results:
            analysis = results["multi_agent_analysis"]
            print("🧠 Multi-Agent Analysis Summary:")
            print(f"   Status: {analysis.get('status', 'Unknown')}")
            print(f"   Agents: {', '.join(analysis.get('agents_involved', []))}")
            print(f"   Timestamp: {analysis.get('analysis_timestamp', 'Unknown')}")
            print()
        
        # Violation report
        if "violation_report" in results:
            violations = results["violation_report"]
            print(f"⚠️  Violations Found: {violations.get('total_violations', 0)}")
            
            by_category = violations.get('by_category', {})
            for category, issues in by_category.items():
                if issues:
                    print(f"   {category.upper()}: {len(issues)} issues")
                    for issue in issues[:2]:  # Show first 2
                        print(f"     - {issue}")
            
            severity = violations.get('severity_breakdown', {})
            if severity:
                print(f"   Severity: Critical={severity.get('critical', 0)}, High={severity.get('high', 0)}, Medium={severity.get('medium', 0)}, Low={severity.get('low', 0)}")
            print()

        # Legal context
        if "legal_context" in results:
            legal = results["legal_context"]
            print(f"⚖️  Legal Context:")
            updates = legal.get('recent_updates', [])
            if updates:
                print(f"   Recent Updates: {len(updates)} found")
                for update in updates[:3]:  # Show first 3
                    print(f"     - {update}")
            
            regulations = legal.get('relevant_regulations', [])
            if regulations:
                print(f"   Relevant Regulations: {len(regulations)} identified")
                for reg in regulations[:3]:  # Show first 3
                    print(f"     - {reg}")
            print()
        
        # Risk assessment
        if "risk_assessment" in results:
            risk = results["risk_assessment"]
            print(f"⚠️  Risk Assessment:")
            print(f"   Overall Risk Level: {risk.get('overall_risk_level', 'Unknown').title()}")
            
            factors = risk.get('risk_factors', [])
            if factors:
                print(f"   Risk Factors: {len(factors)} identified")
                for factor in factors[:3]:  # Show first 3
                    print(f"     - {factor}")
            
            penalties = risk.get('potential_penalties', [])
            if penalties:
                print(f"   Potential Penalties: {len(penalties)} identified")
                for penalty in penalties[:2]:  # Show first 2
                    print(f"     - {penalty}")
            print()

        # Implementation roadmap (NEW ENHANCED DISPLAY)
        if "implementation_roadmap" in results:
            roadmap = results["implementation_roadmap"]
            print("🗺️  Implementation Roadmap:")
            print("-" * 40)
            
            phases = [
                ("immediate", "🚨 Immediate Actions (0-2 weeks)"),
                ("short_term", "⚡ Short-term Goals (1-3 months)"), 
                ("long_term", "🎯 Long-term Strategy (3-12 months)"),
                ("ongoing_maintenance", "🔄 Ongoing Maintenance")
            ]
            
            for phase_key, phase_title in phases:
                actions = roadmap.get(phase_key, [])
                if actions:
                    print(f"\n{phase_title}:")
                    for i, action in enumerate(actions[:4], 1):  # Show first 4
                        print(f"   {i}. {action}")
            
            # Show additional roadmap details
            if roadmap.get('timeline_overview'):
                print(f"\n📅 Timeline Overview:")
                for phase, timeline in roadmap['timeline_overview'].items():
                    print(f"   {phase.replace('_', ' ').title()}: {timeline}")
            
            if roadmap.get('resource_requirements'):
                print(f"\n👥 Resource Requirements:")
                for phase, resources in roadmap['resource_requirements'].items():
                    print(f"   {phase.replace('_', ' ').title()}: {resources}")
            
            if roadmap.get('roadmap_summary'):
                print(f"\n📋 Summary: {roadmap['roadmap_summary']}")
            
            print()


async def main():
    """Main demo function"""
    parser = argparse.ArgumentParser(description="Multi-Agent Compliance Auditor Demo")
    parser.add_argument("--url", required=True, help="Website URL to audit")
    parser.add_argument("--api-key", required=True, help="Google Gemini API key")
    
    args = parser.parse_args()
    
    print("🤖 Multi-Agent Compliance Auditor Demo")
    print("=" * 50)
    print(f"URL: {args.url}")
    print(f"API Key: {'*' * (len(args.api_key) - 8) + args.api_key[-8:]}")
    print()
    
    demo = MultiAgentDemo(args.api_key)
    results = await demo.run_demo(args.url)
    
    if results:
        print("\n✅ Demo completed successfully!")
        print(f"📊 Total findings processed by LLM-powered extraction")
        print(f"🔍 External resources fetched via search tools")
        print(f"📈 Real-time analysis with {len(str(results))} characters of agent output")
    else:
        print("\n❌ Demo failed - check logs above")


if __name__ == "__main__":
    asyncio.run(main()) 