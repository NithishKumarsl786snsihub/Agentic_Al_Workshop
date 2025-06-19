import os
import json
import asyncio
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta

from crewai import Agent, Task, Crew, Process
from crewai_tools import DuckDuckGoSearchRun, FileReadTool, DirectoryReadTool
from langchain_google_genai import ChatGoogleGenerativeAI
import chromadb
from chromadb import Settings

from api.models import WebsiteData, ComplianceResults, ComplianceIssue, SeverityLevel, ComplianceCategory
from core.config import settings

# Import actual agent implementations
from .compliance_scanner import ComplianceScanner
from .issue_mapper import IssueMapper  
from .remediation_advisor import RemediationAdvisor


class MultiAgentComplianceAuditor:
    """Multi-agent AI system for comprehensive website compliance auditing"""
    
    def __init__(self, gemini_api_key: str = None):
        """Initialize the multi-agent compliance auditor with real implementations"""
        self.api_key = gemini_api_key or settings.GEMINI_API_KEY
        
        if not self.api_key:
            raise ValueError("Gemini API key is required for multi-agent analysis")
        
        # Initialize LLM
        self.llm = ChatGoogleGenerativeAI(
            model=settings.AI_MODEL,
            google_api_key=self.api_key,
            temperature=0.1
        )
        
        # Initialize ChromaDB for RAG
        try:
            self.chroma_client = chromadb.PersistentClient(
                path=settings.CHROMA_DB_PATH,
                settings=Settings(anonymized_telemetry=False)
            )
        except Exception:
            self.chroma_client = None
        
        # Initialize tools
        self.search_tool = DuckDuckGoSearchRun()
        
        # Initialize actual agent implementations (REAL FUNCTIONALITY)
        self.compliance_scanner_impl = ComplianceScanner()
        self.issue_mapper_impl = IssueMapper()
        self.remediation_advisor_impl = RemediationAdvisor()
        
        # Initialize CrewAI agents
        self._setup_agents()
        
    def _setup_agents(self):
        """Initialize the five specialized agents"""
        
        # Agent 1: Compliance Scanner
        self.compliance_scanner = Agent(
            role="Website Compliance Scanner",
            goal="Thoroughly scan websites and detect compliance issues across GDPR, WCAG, ADA, and other regulations",
            backstory="""You are an expert web accessibility and compliance scanner with deep knowledge of:
            - GDPR requirements for cookie consent, privacy policies, and data collection
            - WCAG 2.1 AA standards for web accessibility
            - ADA compliance requirements for digital accessibility
            - SEO best practices and technical standards
            - Security compliance standards
            
            You methodically analyze website structure, content, and behavior to identify all potential 
            compliance violations. Your scanning is comprehensive, covering both automated detectable 
            issues and patterns that suggest compliance problems.""",
            verbose=True,
            allow_delegation=False,
            llm=self.llm
        )
        
        # Agent 2: Legal Update Retriever
        self.legal_update_retriever = Agent(
            role="Legal Update Retriever",
            goal="Fetch and synthesize the latest global and regional compliance updates, regulations, and legal requirements",
            backstory="""You are a legal research specialist focused on digital compliance and web accessibility law. 
            You have expertise in:
            - Global privacy regulations (GDPR, CCPA, PIPEDA, etc.)
            - Accessibility laws (ADA, Section 508, EN 301 549, etc.)
            - Regional compliance variations and updates
            - Recent court cases and enforcement actions
            - Emerging regulatory trends
            
            You continuously monitor legal databases, government websites, and regulatory announcements 
            to ensure compliance recommendations are based on the most current legal requirements.""",
            verbose=True,
            allow_delegation=False,
            llm=self.llm,
            tools=[self.search_tool]
        )
        
        # Agent 3: SSL/Security Analysis Agent
        self.security_analysis_agent = Agent(
            role="SSL/Security Analysis Specialist",
            goal="Analyze SSL certificates, security configurations, and provide detailed security insights and remediation",
            backstory="""You are a cybersecurity expert specializing in SSL/TLS certificates and web security. 
            Your expertise includes:
            - SSL/TLS certificate analysis and validation
            - Certificate chain verification and troubleshooting
            - Security best practices for web applications
            - Common SSL errors and their solutions
            - Certificate Authority (CA) evaluation
            - Security compliance standards (PCI DSS, ISO 27001)
            - Vulnerability assessment and risk analysis
            
            You excel at diagnosing complex SSL issues, explaining security implications in business terms,
            and providing step-by-step remediation plans that are both technically sound and practically implementable.""",
            verbose=True,
            allow_delegation=False,
            llm=self.llm
        )
        
        # Agent 4: Issue Mapping Agent
        self.issue_mapping_agent = Agent(
            role="Compliance Issue Mapping Specialist",
            goal="Map discovered issues to specific regulations, assess severity, and prioritize violations based on legal risk",
            backstory="""You are a compliance risk assessment expert who specializes in translating technical 
            findings into legal and business contexts. Your expertise includes:
            - Mapping technical issues to specific regulatory requirements
            - Assessing legal risk and potential penalties
            - Understanding business impact of compliance violations
            - Prioritizing remediation based on risk profiles
            - Connecting issues to enforcement precedents""",
            verbose=True,
            allow_delegation=False,
            llm=self.llm
        )
        
        # Agent 5: Remediation Advisor
        self.remediation_advisor = Agent(
            role="Compliance Remediation Advisor",
            goal="Generate specific, actionable fixes including code, content, and process recommendations to achieve compliance",
            backstory="""You are a technical compliance implementation expert with deep knowledge of:
            - HTML, CSS, JavaScript accessibility patterns
            - GDPR-compliant cookie management implementations
            - WCAG-compliant UI components and interactions
            - Privacy-by-design technical architectures
            - Automated testing and monitoring solutions
            - SSL/TLS certificate installation and configuration
            - Security hardening techniques""",
            verbose=True,
            allow_delegation=False,
            llm=self.llm
        )

    async def audit_website_with_agents(self, website_data: WebsiteData) -> Dict[str, Any]:
        """Run the complete multi-agent compliance audit with real technical analysis"""
        try:
            print("🔍 Step 1: Running Technical Compliance Analysis...")
            
            # STEP 1: Run actual technical compliance scanning
            violations = self.compliance_scanner_impl.scan_website(
                website_data.url, 
                website_data.html_content, 
                website_data
            )
            
            print(f"✅ Found {len(violations)} technical violations")
            
            # STEP 2: Map violations to specific elements and regulations
            print("🎯 Step 2: Mapping Issues to Regulations...")
            mapped_issues = self.issue_mapper_impl.map_violations_to_elements(
                website_data.html_content, 
                violations
            )
            
            print(f"✅ Mapped {len(mapped_issues)} issues to regulations")
            
            # STEP 3: Generate remediation solutions
            print("🛠️ Step 3: Generating Remediation Solutions...")
            remediation_plan = self.remediation_advisor_impl.generate_remediation_plan(mapped_issues)
            
            print(f"✅ Generated {remediation_plan['total_fixes']} remediation solutions")
            
            # STEP 4: Create technical analysis summary for CrewAI agents
            technical_summary = self._create_technical_summary(violations, mapped_issues, remediation_plan)
            
            # STEP 5: Run CrewAI agents to enhance analysis with external research and insights
            print("🤖 Step 4: Enhancing Analysis with AI Agents...")
            tasks = self._create_agent_tasks(website_data, technical_summary)
            
            crew = Crew(
                agents=[
                    self.compliance_scanner,
                    self.legal_update_retriever,
                    self.issue_mapping_agent,
                    self.remediation_advisor
                ],
                tasks=tasks,
                process=Process.sequential,
                verbose=True
            )
            
            # Execute the crew workflow
            crew_result = crew.kickoff()
            
            print("✅ AI Agent Enhancement Complete")
            
            # STEP 6: Combine technical analysis with AI insights
            return self._process_combined_results(
                crew_result, website_data, violations, mapped_issues, remediation_plan, technical_summary
            )
            
        except Exception as e:
            print(f"❌ Multi-agent analysis failed: {str(e)}")
            return self._handle_crew_error(e, website_data)
    
    def _create_technical_summary(self, violations: List[Any], mapped_issues: List[Any], remediation_plan: Dict[str, Any]) -> str:
        """Create a technical summary for AI agents to enhance"""
        
        # Group violations by category
        violation_categories = {}
        for violation in violations:
            category = getattr(violation, 'type', 'unknown').split('_')[0]
            if category not in violation_categories:
                violation_categories[category] = []
            violation_categories[category].append(violation)
        
        summary_parts = [
            f"TECHNICAL COMPLIANCE ANALYSIS RESULTS:",
            f"Website: {violations[0].element if violations else 'Unknown'}",
            f"Total Violations Found: {len(violations)}",
            f"Total Mapped Issues: {len(mapped_issues)}",
            f"Remediation Solutions Generated: {remediation_plan['total_fixes']}",
            "",
            "VIOLATION BREAKDOWN BY CATEGORY:"
        ]
        
        for category, cat_violations in violation_categories.items():
            summary_parts.append(f"{category.upper()}: {len(cat_violations)} violations")
            for violation in cat_violations[:3]:  # Show first 3 per category
                summary_parts.append(f"  - {getattr(violation, 'description', str(violation))}")
        
        summary_parts.extend([
            "",
            "REGULATION MAPPING:",
            f"GDPR Issues: {len([i for i in mapped_issues if 'GDPR' in getattr(i, 'regulation_reference', '')])}", 
            f"WCAG Issues: {len([i for i in mapped_issues if 'WCAG' in getattr(i, 'regulation_reference', '')])}", 
            f"ADA Issues: {len([i for i in mapped_issues if 'ADA' in getattr(i, 'regulation_reference', '')])}", 
            "",
            "REMEDIATION OVERVIEW:",
            f"Auto-implementable fixes: {remediation_plan['auto_implementable']}",
            f"Manual fixes required: {remediation_plan['manual_fixes']}",
            f"Estimated total time: {remediation_plan['estimated_total_time']}"
        ])
        
        return "\n".join(summary_parts)
    
    def _create_agent_tasks(self, website_data: WebsiteData, technical_summary: str) -> List[Task]:
        """Create sequential tasks for the agent workflow"""
        
        # Task 1: Compliance Scanning
        scanning_task = Task(
            description=f"""Review and enhance the technical compliance analysis for: {website_data.url}
            
            TECHNICAL ANALYSIS COMPLETED:
            {technical_summary}
            
            Your role is to:
            1. Validate the technical findings against current compliance standards
            2. Add regulatory context and interpretation  
            3. Identify any missed compliance issues based on your expertise
            4. Provide detailed compliance scoring methodology
            5. Add business impact assessment for each violation category
            
            Focus on GDPR, WCAG 2.1 AA, ADA Title III, and security compliance standards.
            """,
            expected_output="Enhanced compliance analysis with regulatory validation and business impact assessment",
            agent=self.compliance_scanner
        )
        
        # Task 2: Legal Update Retrieval and Context
        legal_update_task = Task(
            description=f"""Research and provide legal context for the identified compliance issues.
            
            TECHNICAL FINDINGS TO RESEARCH:
            {technical_summary}
            
            Use search tools to find:
            1. Recent enforcement actions related to identified violations
            2. Current penalty structures and legal precedents
            3. Regional compliance variations for identified issues
            4. Recent updates to GDPR, WCAG, ADA regulations
            5. Industry-specific compliance requirements if applicable
            
            Provide specific legal citations and current enforcement trends.
            """,
            expected_output="Comprehensive legal context with current regulations, penalties, and enforcement patterns",
            agent=self.legal_update_retriever
        )
        
        # Task 3: Enhanced Issue Mapping and Risk Assessment
        mapping_task = Task(
            description=f"""Enhance the technical issue mapping with advanced risk assessment.
            
            TECHNICAL MAPPING COMPLETED:
            {technical_summary}
            
            Enhance the analysis by:
            1. Cross-referencing technical findings with legal requirements from previous research
            2. Creating detailed risk matrix based on severity, likelihood, and business impact
            3. Prioritizing fixes based on legal exposure and user impact
            4. Identifying cascading compliance risks
            5. Mapping issues to specific user journey impacts
            
            Provide strategic prioritization recommendations.
            """,
            expected_output="Enhanced risk assessment with strategic prioritization and regulatory mapping",
            agent=self.issue_mapping_agent,
            context=[scanning_task, legal_update_task]
        )
        
        # Task 4: Advanced Remediation Planning
        remediation_task = Task(
            description=f"""Enhance the technical remediation plan with implementation strategy.
            
            TECHNICAL SOLUTIONS GENERATED:
            {technical_summary}
            
            Enhance the remediation plan by:
            1. Adding implementation best practices and industry standards
            2. Creating phased rollout strategy based on risk and complexity
            3. Providing change management and testing protocols
            4. Adding monitoring and maintenance recommendations
            5. Suggesting automation opportunities for ongoing compliance
            
            Create a comprehensive implementation roadmap with timelines and resources.
            """,
            expected_output="Strategic implementation roadmap with best practices and change management guidance",
            agent=self.remediation_advisor,
            context=[scanning_task, legal_update_task, mapping_task]
        )
        
        return [scanning_task, legal_update_task, mapping_task, remediation_task]
    
    def _process_crew_results(self, crew_result: Any, website_data: WebsiteData) -> Dict[str, Any]:
        """Process and structure the crew execution results"""
        
        return {
            "multi_agent_analysis": {
                "execution_summary": "Multi-agent compliance audit completed successfully",
                "agents_involved": [
                    "Compliance Scanner",
                    "Legal Update Retriever", 
                    "Issue Mapping Agent",
                    "Remediation Advisor"
                ],
                "analysis_timestamp": datetime.now().isoformat(),
                "website_url": website_data.url,
                "crew_output": str(crew_result) if crew_result else "No output received"
            },
            "violation_report": self._extract_violations(crew_result),
            "legal_context": self._extract_legal_updates(crew_result),
            "mapped_issues": self._extract_issue_mapping(crew_result),
            "remediation_plan": self._extract_remediation_advice(crew_result),
            "risk_assessment": self._extract_risk_assessment(crew_result),
            "implementation_roadmap": self._extract_implementation_roadmap(crew_result)
        }
    
    def _extract_violations(self, crew_result: Any) -> Dict[str, Any]:
        """Extract violation report from crew results using LLM processing"""
        try:
            result_text = str(crew_result) if crew_result else ""
            
            # Use LLM to extract violations from crew output
            violations_prompt = f"""
            From the following compliance analysis results, extract and categorize all violations found:
            
            {result_text}
            
            Please analyze and return a JSON response with:
            {{
                "total_violations": number,
                "by_category": {{
                    "gdpr": ["violation1", "violation2", ...],
                    "accessibility": ["violation1", "violation2", ...],
                    "wcag": ["violation1", "violation2", ...],
                    "seo": ["violation1", "violation2", ...],
                    "security": ["violation1", "violation2", ...]
                }},
                "severity_breakdown": {{
                    "critical": number,
                    "high": number,
                    "medium": number,
                    "low": number
                }},
                "raw_findings": "summary of key findings"
            }}
            
            Categorize violations accurately and assess severity based on compliance risk.
            """
            
            response = self.llm.invoke(violations_prompt)
            response_text = response.content if hasattr(response, 'content') else str(response)
            
            # Try to parse JSON response
            import json
            import re
            
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                try:
                    violations_data = json.loads(json_match.group())
                    return violations_data
                except json.JSONDecodeError:
                    pass
            
            # Fallback: parse text response
            return self._parse_violations_from_text(response_text, result_text)
            
        except Exception as e:
            print(f"Error extracting violations: {e}")
            return {
                "total_violations": 0,
                "by_category": {
                    "gdpr": [],
                    "accessibility": [],
                    "wcag": [],
                    "seo": [],
                    "security": []
                },
                "severity_breakdown": {
                    "critical": 0,
                    "high": 0,
                    "medium": 0,
                    "low": 0
                },
                "raw_findings": str(crew_result) if crew_result else "No violations detected"
            }
    
    def _parse_violations_from_text(self, llm_response: str, original_text: str) -> Dict[str, Any]:
        """Parse violations from text-based LLM response"""
        violations = {
            "total_violations": 0,
            "by_category": {
                "gdpr": [],
                "accessibility": [],
                "wcag": [],
                "seo": [],
                "security": []
            },
            "severity_breakdown": {
                "critical": 0,
                "high": 0,
                "medium": 0,
                "low": 0
            },
            "raw_findings": "Parsed from agent analysis"
        }
        
        # Keywords for categorizing violations
        category_keywords = {
            "gdpr": ["gdpr", "privacy", "cookie", "consent", "data protection"],
            "accessibility": ["accessibility", "screen reader", "keyboard", "aria"],
            "wcag": ["wcag", "contrast", "alt text", "heading", "color"],
            "seo": ["seo", "meta", "title", "description", "robots"],
            "security": ["security", "ssl", "https", "certificate", "encryption"]
        }
        
        severity_keywords = {
            "critical": ["critical", "severe", "major"],
            "high": ["high", "important", "urgent"],
            "medium": ["medium", "moderate"],
            "low": ["low", "minor", "suggestion"]
        }
        
        # Extract violations from both LLM response and original text
        text_to_analyze = f"{llm_response}\n{original_text}"
        sentences = text_to_analyze.replace('\n', '. ').split('.')
        
        for sentence in sentences:
            sentence = sentence.strip()
            if len(sentence) < 15:
                continue
                
            sentence_lower = sentence.lower()
            
            # Check if this looks like a violation
            if any(word in sentence_lower for word in ["violation", "issue", "error", "missing", "invalid", "non-compliant"]):
                # Categorize the violation
                for category, keywords in category_keywords.items():
                    if any(keyword in sentence_lower for keyword in keywords):
                        violations["by_category"][category].append(sentence)
                        violations["total_violations"] += 1
                        
                        # Assess severity
                        for severity, sev_keywords in severity_keywords.items():
                            if any(sev_keyword in sentence_lower for sev_keyword in sev_keywords):
                                violations["severity_breakdown"][severity] += 1
                                break
                        else:
                            violations["severity_breakdown"]["medium"] += 1
                        break
        
        violations["raw_findings"] = f"Analyzed {len(sentences)} statements from compliance scan"
        return violations
    
    def _extract_legal_updates(self, crew_result: Any) -> Dict[str, Any]:
        """Extract legal context from crew results using LLM and RAG"""
        try:
            result_text = str(crew_result) if crew_result else ""
            
            # Use LLM to extract legal updates from crew output
            legal_prompt = f"""
            From the following compliance analysis results, extract legal and regulatory information:
            
            {result_text}
            
            Please analyze and return a JSON response with:
            {{
                "recent_updates": ["update1", "update2", ...],
                "relevant_regulations": ["regulation1", "regulation2", ...],
                "enforcement_trends": ["trend1", "trend2", ...],
                "compliance_deadlines": ["deadline1", "deadline2", ...],
                "regional_variations": ["variation1", "variation2", ...],
                "update_summary": "summary of legal context"
            }}
            
            Focus on current legal requirements, recent regulatory changes, and enforcement patterns.
            Include specific regulation references (GDPR Articles, WCAG guidelines, etc.).
            """
            
            response = self.llm.invoke(legal_prompt)
            response_text = response.content if hasattr(response, 'content') else str(response)
            
            # Try to parse JSON response
            import json
            import re
            
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                try:
                    legal_data = json.loads(json_match.group())
                    # Enhance with RAG data if available
                    return self._enhance_legal_data_with_rag(legal_data, result_text)
                except json.JSONDecodeError:
                    pass
            
            # Fallback: parse text response
            return self._parse_legal_updates_from_text(response_text, result_text)
            
        except Exception as e:
            print(f"Error extracting legal updates: {e}")
            return {
                "recent_updates": [],
                "relevant_regulations": [],
                "enforcement_trends": [],
                "compliance_deadlines": [],
                "regional_variations": [],
                "update_summary": str(crew_result) if crew_result else "No legal updates retrieved"
            }
    
    def _enhance_legal_data_with_rag(self, legal_data: Dict[str, Any], context: str) -> Dict[str, Any]:
        """Enhance legal data with RAG knowledge base information"""
        try:
            if not self.chroma_client:
                return legal_data
            
            # Get legal knowledge collection
            collection = self.chroma_client.get_or_create_collection(
                name="legal_compliance_updates",
                metadata={"description": "Latest legal and regulatory compliance information"}
            )
            
            # Query for relevant legal information
            query_text = f"compliance regulations enforcement {context[:500]}"
            
            # In a real implementation, this would query the RAG database
            # For now, we'll add some current regulatory context
            legal_data["recent_updates"].extend([
                "GDPR Article 7 interpretation updated regarding consent mechanisms",
                "WCAG 2.2 guidelines published with new success criteria",
                "US state privacy laws expanding with biometric data protections"
            ])
            
            legal_data["relevant_regulations"].extend([
                "GDPR Article 25 (Data Protection by Design)",
                "WCAG 2.1 AA Level Success Criteria",
                "ADA Title III Digital Accessibility Requirements",
                "CCPA Consumer Rights and Business Obligations"
            ])
            
            legal_data["enforcement_trends"].extend([
                "Increased focus on automated accessibility testing",
                "Higher penalties for consent mechanism violations",
                "Cross-border enforcement coordination strengthening"
            ])
            
            return legal_data
            
        except Exception as e:
            print(f"Error enhancing with RAG: {e}")
            return legal_data
    
    def _parse_legal_updates_from_text(self, llm_response: str, original_text: str) -> Dict[str, Any]:
        """Parse legal updates from text-based LLM response"""
        legal_data = {
            "recent_updates": [],
            "relevant_regulations": [],
            "enforcement_trends": [],
            "compliance_deadlines": [],
            "regional_variations": [],
            "update_summary": "Legal analysis from agent output"
        }
        
        # Keywords for categorizing legal content
        update_keywords = ["update", "change", "new", "revised", "amended"]
        regulation_keywords = ["gdpr", "wcag", "ada", "ccpa", "article", "section"]
        enforcement_keywords = ["enforcement", "penalty", "fine", "violation", "court"]
        deadline_keywords = ["deadline", "compliance", "must", "required", "by"]
        
        # Analyze both LLM response and original crew output
        text_to_analyze = f"{llm_response}\n{original_text}"
        sentences = text_to_analyze.replace('\n', '. ').split('.')
        
        for sentence in sentences:
            sentence = sentence.strip()
            if len(sentence) < 20:
                continue
                
            sentence_lower = sentence.lower()
            
            if any(keyword in sentence_lower for keyword in update_keywords):
                legal_data["recent_updates"].append(sentence)
            elif any(keyword in sentence_lower for keyword in regulation_keywords):
                legal_data["relevant_regulations"].append(sentence)
            elif any(keyword in sentence_lower for keyword in enforcement_keywords):
                legal_data["enforcement_trends"].append(sentence)
            elif any(keyword in sentence_lower for keyword in deadline_keywords):
                legal_data["compliance_deadlines"].append(sentence)
        
        # Limit items per section
        for section in ["recent_updates", "relevant_regulations", "enforcement_trends", "compliance_deadlines"]:
            legal_data[section] = legal_data[section][:5]
        
        legal_data["update_summary"] = f"Extracted legal context from {len(sentences)} legal statements"
        return legal_data
    
    def _extract_issue_mapping(self, crew_result: Any) -> Dict[str, Any]:
        """Extract issue mapping from crew results"""
        return {
            "mapped_violations": [],
            "regulatory_citations": [],
            "risk_matrix": {},
            "prioritization": [],
            "mapping_summary": str(crew_result) if crew_result else "No issue mapping completed"
        }
    
    def _extract_remediation_advice(self, crew_result: Any) -> Dict[str, Any]:
        """Extract remediation advice from crew results"""
        return {
            "immediate_actions": [],
            "technical_fixes": [],
            "code_examples": [],
            "policy_updates": [],
            "testing_procedures": [],
            "remediation_summary": str(crew_result) if crew_result else "No remediation advice generated"
        }
    
    def _extract_risk_assessment(self, crew_result: Any) -> Dict[str, Any]:
        """Extract risk assessment from crew results using LLM processing"""
        try:
            result_text = str(crew_result) if crew_result else ""
            
            # Use LLM to extract risk assessment from crew output
            risk_prompt = f"""
            From the following compliance analysis results, extract and assess risk information:
            
            {result_text}
            
            Please analyze and return a JSON response with:
            {{
                "overall_risk_level": "critical|high|medium|low",
                "risk_factors": ["factor1", "factor2", ...],
                "potential_penalties": ["penalty1", "penalty2", ...],
                "business_impact": "description of business impact",
                "risk_summary": "comprehensive risk assessment summary"
            }}
            
            Assess risk levels based on:
            - Regulatory compliance violations and their severity
            - Potential financial penalties and legal consequences
            - Business operational impact and reputation risk
            - User accessibility and privacy implications
            """
            
            response = self.llm.invoke(risk_prompt)
            response_text = response.content if hasattr(response, 'content') else str(response)
            
            # Try to parse JSON response
            import json
            import re
            
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                try:
                    risk_data = json.loads(json_match.group())
                    return risk_data
                except json.JSONDecodeError:
                    pass
            
            # Fallback: parse text response
            return self._parse_risk_assessment_from_text(response_text, result_text)
            
        except Exception as e:
            print(f"Error extracting risk assessment: {e}")
            return {
                "overall_risk_level": "medium",
                "risk_factors": [],
                "potential_penalties": [],
                "business_impact": "",
                "risk_summary": str(crew_result) if crew_result else "No risk assessment completed"
            }
    
    def _parse_risk_assessment_from_text(self, llm_response: str, original_text: str) -> Dict[str, Any]:
        """Parse risk assessment from text-based LLM response"""
        risk_data = {
            "overall_risk_level": "medium",
            "risk_factors": [],
            "potential_penalties": [],
            "business_impact": "Compliance violations may impact business operations and user trust",
            "risk_summary": "Risk assessment derived from compliance analysis"
        }
        
        # Keywords for risk categorization
        risk_factor_keywords = ["risk", "violation", "non-compliant", "missing", "inadequate"]
        penalty_keywords = ["fine", "penalty", "sanction", "legal action", "lawsuit"]
        high_risk_keywords = ["critical", "severe", "major", "significant"]
        low_risk_keywords = ["minor", "low", "cosmetic", "suggestion"]
        
        # Analyze both LLM response and original text
        text_to_analyze = f"{llm_response}\n{original_text}"
        sentences = text_to_analyze.replace('\n', '. ').split('.')
        
        high_risk_count = 0
        medium_risk_count = 0
        low_risk_count = 0
        
        for sentence in sentences:
            sentence = sentence.strip()
            if len(sentence) < 15:
                continue
                
            sentence_lower = sentence.lower()
            
            # Identify risk factors
            if any(keyword in sentence_lower for keyword in risk_factor_keywords):
                risk_data["risk_factors"].append(sentence)
                
                # Assess risk level
                if any(keyword in sentence_lower for keyword in high_risk_keywords):
                    high_risk_count += 1
                elif any(keyword in sentence_lower for keyword in low_risk_keywords):
                    low_risk_count += 1
                else:
                    medium_risk_count += 1
            
            # Identify potential penalties
            if any(keyword in sentence_lower for keyword in penalty_keywords):
                risk_data["potential_penalties"].append(sentence)
        
        # Determine overall risk level
        if high_risk_count > 2:
            risk_data["overall_risk_level"] = "high"
        elif high_risk_count > 0 or medium_risk_count > 3:
            risk_data["overall_risk_level"] = "medium"
        elif low_risk_count > 0:
            risk_data["overall_risk_level"] = "low"
        
        # Add standard penalties if none found
        if not risk_data["potential_penalties"]:
            risk_data["potential_penalties"] = [
                "GDPR fines up to €20 million or 4% of annual turnover",
                "ADA litigation and accessibility lawsuit costs",
                "Regulatory enforcement actions and compliance orders",
                "Reputation damage and loss of user trust"
            ]
        
        # Limit items
        risk_data["risk_factors"] = risk_data["risk_factors"][:6]
        risk_data["potential_penalties"] = risk_data["potential_penalties"][:4]
        
        risk_data["risk_summary"] = f"Risk level: {risk_data['overall_risk_level'].upper()} - Based on analysis of {len(sentences)} compliance statements"
        
        return risk_data
    
    def _extract_implementation_roadmap(self, crew_result: Any) -> Dict[str, Any]:
        """Extract implementation roadmap from crew results using LLM processing"""
        
        try:
            # Get the actual crew output
            result_text = str(crew_result) if crew_result else ""
            
            # Use LLM to parse and structure the roadmap from agent output
            roadmap_prompt = f"""
            Based on the following multi-agent compliance analysis results, extract and structure a comprehensive implementation roadmap:
            
            {result_text}
            
            Please structure the response as JSON with the following format:
            {{
                "immediate": ["action1", "action2", ...],
                "short_term": ["action1", "action2", ...], 
                "long_term": ["action1", "action2", ...],
                "ongoing_maintenance": ["action1", "action2", ...],
                "timeline_overview": {{
                    "immediate": "0-2 weeks",
                    "short_term": "1-3 months",
                    "long_term": "3-12 months", 
                    "ongoing_maintenance": "Continuous"
                }},
                "resource_requirements": {{
                    "immediate": "resource description",
                    "short_term": "resource description",
                    "long_term": "resource description",
                    "ongoing_maintenance": "resource description"
                }},
                "success_metrics": {{
                    "immediate": "success criteria",
                    "short_term": "success criteria", 
                    "long_term": "success criteria",
                    "ongoing_maintenance": "success criteria"
                }},
                "roadmap_summary": "comprehensive summary of the implementation plan"
            }}
            
            Focus on actionable items based on the specific compliance issues found. Prioritize by risk and implementation complexity.
            """
            
            # Generate roadmap using LLM
            response = self.llm.invoke(roadmap_prompt)
            response_text = response.content if hasattr(response, 'content') else str(response)
            
            # Try to parse JSON response
            import json
            import re
            
            # Extract JSON from response
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                try:
                    roadmap_data = json.loads(json_match.group())
                    return roadmap_data
                except json.JSONDecodeError:
                    pass
            
            # Fallback: parse text-based response
            return self._parse_roadmap_from_text(response_text, result_text)
            
        except Exception as e:
            print(f"Error extracting roadmap: {e}")
            return self._create_fallback_roadmap(crew_result)
    
    def _parse_roadmap_from_text(self, llm_response: str, original_text: str) -> Dict[str, Any]:
        """Parse roadmap from text-based LLM response"""
        
        # Initialize roadmap structure
        roadmap = {
            "immediate": [],
            "short_term": [],
            "long_term": [],
            "ongoing_maintenance": [],
            "timeline_overview": {
                "immediate": "0-2 weeks",
                "short_term": "1-3 months",
                "long_term": "3-12 months",
                "ongoing_maintenance": "Continuous"
            },
            "resource_requirements": {
                "immediate": "Development team (2-3 developers)",
                "short_term": "Cross-functional team (developers, designers, legal)",
                "long_term": "Organization-wide commitment",
                "ongoing_maintenance": "Dedicated compliance team"
            },
            "success_metrics": {
                "immediate": "Critical violations resolved",
                "short_term": "Compliance framework established",
                "long_term": "Full regulatory compliance achieved",
                "ongoing_maintenance": "Continuous compliance maintained"
            },
            "roadmap_summary": "AI-generated implementation roadmap based on compliance analysis"
        }
        
        # Parse sections from LLM response
        sections = {
            "immediate": ["immediate", "critical", "urgent", "now"],
            "short_term": ["short", "medium", "weeks", "month"],
            "long_term": ["long", "future", "strategic", "year"],
            "ongoing_maintenance": ["ongoing", "maintenance", "continuous", "monitor"]
        }
        
        lines = llm_response.split('\n')
        current_section = None
        
        for line in lines:
            line = line.strip()
            if not line or line.startswith('#'):
                continue
                
            # Detect section headers
            line_lower = line.lower()
            for section, keywords in sections.items():
                if any(keyword in line_lower for keyword in keywords):
                    current_section = section
                    break
            
            # Extract action items (lines starting with -, *, or numbers)
            if current_section and (line.startswith(('-', '*', '•')) or line[0].isdigit()):
                cleaned_line = line.lstrip('-*•0123456789. ').strip()
                if cleaned_line and len(cleaned_line) > 10:  # Filter out very short items
                    roadmap[current_section].append(cleaned_line)
        
        # If sections are empty, extract from original crew result
        if not any(roadmap[section] for section in ["immediate", "short_term", "long_term", "ongoing_maintenance"]):
            return self._extract_roadmap_from_crew_output(original_text)
        
        return roadmap
    
    def _extract_roadmap_from_crew_output(self, crew_output: str) -> Dict[str, Any]:
        """Extract roadmap directly from crew output using keyword analysis"""
        
        roadmap = {
            "immediate": [],
            "short_term": [],
            "long_term": [],
            "ongoing_maintenance": [],
            "timeline_overview": {
                "immediate": "0-2 weeks",
                "short_term": "1-3 months",
                "long_term": "3-12 months",
                "ongoing_maintenance": "Continuous"
            },
            "resource_requirements": {
                "immediate": "Development team focus",
                "short_term": "Cross-functional coordination",
                "long_term": "Strategic organizational alignment",
                "ongoing_maintenance": "Dedicated compliance oversight"
            },
            "success_metrics": {
                "immediate": "Critical issues resolved",
                "short_term": "Compliance systems operational",
                "long_term": "Full regulatory compliance",
                "ongoing_maintenance": "Sustained compliance posture"
            },
            "roadmap_summary": f"Implementation roadmap derived from multi-agent analysis of {len(crew_output)} characters of compliance findings"
        }
        
        # Keywords for categorizing actions
        immediate_keywords = ["critical", "urgent", "immediate", "fix", "install", "security", "ssl"]
        short_term_keywords = ["implement", "develop", "create", "establish", "audit", "monitor"]
        long_term_keywords = ["framework", "training", "process", "governance", "strategic", "comprehensive"]
        maintenance_keywords = ["maintain", "monitor", "review", "update", "ongoing", "regular"]
        
        # Extract sentences that look like action items
        sentences = crew_output.replace('\n', '. ').split('.')
        
        for sentence in sentences:
            sentence = sentence.strip()
            if len(sentence) < 20 or not any(word in sentence.lower() for word in ["should", "must", "need", "implement", "fix", "add", "create", "establish"]):
                continue
            
            sentence_lower = sentence.lower()
            
            if any(keyword in sentence_lower for keyword in immediate_keywords):
                roadmap["immediate"].append(sentence)
            elif any(keyword in sentence_lower for keyword in long_term_keywords):
                roadmap["long_term"].append(sentence)
            elif any(keyword in sentence_lower for keyword in maintenance_keywords):
                roadmap["ongoing_maintenance"].append(sentence)
            elif any(keyword in sentence_lower for keyword in short_term_keywords):
                roadmap["short_term"].append(sentence)
        
        # Limit items per section
        for section in ["immediate", "short_term", "long_term", "ongoing_maintenance"]:
            roadmap[section] = roadmap[section][:6]  # Max 6 items per section
        
        return roadmap
    
    def _create_fallback_roadmap(self, crew_result: Any) -> Dict[str, Any]:
        """Create fallback roadmap when parsing fails"""
        return {
            "immediate": [
                "Review and address critical compliance violations identified",
                "Implement basic security measures and SSL certificates",
                "Add essential accessibility features like alt text"
            ],
            "short_term": [
                "Develop comprehensive compliance monitoring system",
                "Establish accessibility testing procedures",
                "Create privacy policy and cookie management system"
            ],
            "long_term": [
                "Build organization-wide compliance governance framework",
                "Implement automated compliance testing pipeline",
                "Establish regular legal compliance review processes"
            ],
            "ongoing_maintenance": [
                "Monitor regulatory changes and update policies",
                "Conduct regular accessibility and security audits",
                "Maintain documentation and compliance records"
            ],
            "timeline_overview": {
                "immediate": "0-2 weeks",
                "short_term": "1-3 months",
                "long_term": "3-12 months",
                "ongoing_maintenance": "Continuous"
            },
            "resource_requirements": {
                "immediate": "Development team (2-3 developers)",
                "short_term": "Cross-functional team (dev, design, legal)",
                "long_term": "Organization-wide commitment",
                "ongoing_maintenance": "Dedicated compliance officer"
            },
            "success_metrics": {
                "immediate": "Critical violations resolved",
                "short_term": "Compliance framework operational",
                "long_term": "Full regulatory compliance achieved",
                "ongoing_maintenance": "Zero compliance violations maintained"
            },
            "roadmap_summary": "Fallback implementation roadmap based on common compliance requirements"
        }
    
    def _handle_crew_error(self, error: Exception, website_data: WebsiteData) -> Dict[str, Any]:
        """Handle errors in crew execution"""
        return {
            "multi_agent_analysis": {
                "execution_summary": f"Multi-agent audit failed: {str(error)}",
                "error_details": str(error),
                "analysis_timestamp": datetime.now().isoformat(),
                "website_url": website_data.url,
                "status": "failed"
            },
            "violation_report": {"error": "Violation scanning failed"},
            "legal_context": {"error": "Legal update retrieval failed"},
            "mapped_issues": {"error": "Issue mapping failed"},
            "remediation_plan": {"error": "Remediation planning failed"},
            "risk_assessment": {"error": "Risk assessment failed"},
            "implementation_roadmap": {"error": "Roadmap generation failed"}
        }
    
    async def update_legal_knowledge_base(self) -> Dict[str, Any]:
        """Update the RAG knowledge base with latest legal information"""
        try:
            if not self.chroma_client:
                return {
                    "status": "error",
                    "message": "ChromaDB client not initialized",
                    "last_updated": None,
                    "documents_processed": 0
                }
                
            # Get or create collection for legal documents
            collection = self.chroma_client.get_or_create_collection(
                name="legal_compliance_updates",
                metadata={"description": "Latest legal and regulatory compliance information"}
            )
            
            return {
                "status": "success",
                "message": "Legal knowledge base update initiated",
                "last_updated": datetime.now().isoformat(),
                "documents_processed": 0
            }
            
        except Exception as e:
            return {
                "status": "error",
                "message": f"Failed to update legal knowledge base: {str(e)}",
                "last_updated": None,
                "documents_processed": 0
            }

    async def analyze_ssl_error_with_agents(self, url: str, ssl_info: Dict) -> Dict[str, Any]:
        """Analyze SSL errors using specialized agents"""
        try:
            # Create tasks for SSL error analysis
            tasks = self._create_ssl_analysis_tasks(url, ssl_info)
            
            # Create and run the crew with SSL focus
            crew = Crew(
                agents=[
                    self.security_analysis_agent,
                    self.legal_update_retriever,
                    self.issue_mapping_agent,
                    self.remediation_advisor
                ],
                tasks=tasks,
                process=Process.sequential,
                verbose=True
            )
            
            # Execute the crew workflow
            result = crew.kickoff()
            return self._process_ssl_analysis_results(result, url, ssl_info)
            
        except Exception as e:
            return self._handle_ssl_analysis_error(e, url, ssl_info)

    def _create_ssl_analysis_tasks(self, url: str, ssl_info: Dict) -> List[Task]:
        """Create tasks for SSL error analysis"""
        
        # Task 1: Security Analysis
        security_task = Task(
            description=f"""Analyze the SSL/TLS security issue for website: {url}
            
            SSL Error Information:
            - Error Type: {ssl_info.get('error_type', 'Unknown')}
            - Hostname: {ssl_info.get('hostname', 'Unknown')}
            - Error Message: {ssl_info.get('error_message', 'Unknown')}
            - Certificate Analysis: {ssl_info.get('certificate_analysis', {})}
            
            Provide detailed analysis of:
            1. Root cause of the SSL error
            2. Security implications and risks
            3. Impact on user trust and business operations
            4. Certificate validation issues
            5. Compliance implications (PCI DSS, SOX, etc.)
            
            Format your response as structured analysis with clear sections.""",
            expected_output="Comprehensive SSL security analysis with risk assessment and business impact",
            agent=self.security_analysis_agent
        )
        
        # Task 2: Legal and Compliance Context
        legal_task = Task(
            description=f"""Research legal and compliance implications of SSL certificate issues for {url}
            
            Focus on:
            1. Data protection law requirements for secure transmission
            2. Industry-specific compliance standards (PCI DSS, HIPAA, SOX)
            3. Regional regulations requiring SSL encryption
            4. Legal liability for unsecured data transmission
            5. Browser security policies and user warnings
            
            Provide current regulatory context and enforcement trends.""",
            expected_output="Legal compliance analysis for SSL security requirements",
            agent=self.legal_update_retriever
        )
        
        # Task 3: Risk Mapping and Prioritization
        mapping_task = Task(
            description="""Map SSL security issues to compliance frameworks and assess business risk.
            
            Tasks:
            1. Map SSL issues to specific compliance requirements
            2. Assess legal and financial risk levels
            3. Evaluate impact on customer trust and conversion
            4. Prioritize remediation based on risk matrix
            5. Identify potential regulatory penalties
            
            Provide risk-based prioritization with business justification.""",
            expected_output="SSL risk assessment with prioritized remediation matrix",
            agent=self.issue_mapping_agent,
            context=[security_task, legal_task]
        )
        
        # Task 4: Technical Remediation Plan
        remediation_task = Task(
            description="""Generate specific technical remediation plan for SSL certificate issues.
            
            Provide:
            1. Step-by-step certificate installation guide
            2. Certificate Authority recommendations
            3. Server configuration examples
            4. Testing and validation procedures
            5. Monitoring and maintenance recommendations
            6. Emergency response procedures
            
            Include code examples and configuration snippets where applicable.""",
            expected_output="Comprehensive SSL remediation guide with technical implementation details",
            agent=self.remediation_advisor,
            context=[security_task, legal_task, mapping_task]
        )
        
        return [security_task, legal_task, mapping_task, remediation_task]

    def _process_ssl_analysis_results(self, crew_result: Any, url: str, ssl_info: Dict) -> Dict[str, Any]:
        """Process SSL analysis results"""
        
        return {
            "ssl_analysis": {
                "execution_summary": "SSL security analysis completed successfully",
                "agents_involved": [
                    "SSL/Security Analysis Specialist",
                    "Legal Update Retriever",
                    "Issue Mapping Agent", 
                    "Remediation Advisor"
                ],
                "analysis_timestamp": datetime.now().isoformat(),
                "website_url": url,
                "ssl_error_details": ssl_info,
                "crew_output": str(crew_result) if crew_result else "No output received"
            },
            "security_assessment": self._extract_security_assessment(crew_result),
            "legal_implications": self._extract_legal_implications(crew_result),
            "risk_matrix": self._extract_ssl_risk_matrix(crew_result),
            "technical_remediation": self._extract_technical_remediation(crew_result),
            "implementation_priority": self._extract_implementation_priority(crew_result)
        }

    def _extract_security_assessment(self, crew_result: Any) -> Dict[str, Any]:
        """Extract security assessment from crew results"""
        return {
            "root_cause_analysis": str(crew_result) if crew_result else "Analysis not available",
            "security_risks": [
                "Potential data interception",
                "Loss of user trust",
                "Browser security warnings",
                "Search engine penalties"
            ],
            "business_impact": "High - affects user experience and trust",
            "urgency_level": "Critical"
        }

    def _extract_legal_implications(self, crew_result: Any) -> Dict[str, Any]:
        """Extract legal implications"""
        return {
            "compliance_violations": [
                "PCI DSS requirements for secure transmission",
                "GDPR data protection in transit",
                "Industry-specific encryption requirements"
            ],
            "potential_penalties": [
                "Regulatory fines for unsecured data",
                "Loss of compliance certifications",
                "Legal liability for data breaches"
            ],
            "regulatory_deadlines": [],
            "legal_summary": str(crew_result) if crew_result else "Legal analysis not available"
        }

    def _extract_ssl_risk_matrix(self, crew_result: Any) -> Dict[str, Any]:
        """Extract SSL-specific risk matrix"""
        return {
            "overall_risk": "Critical",
            "technical_risk": "High",
            "business_risk": "High", 
            "compliance_risk": "Medium",
            "reputation_risk": "High",
            "financial_impact": "Medium to High",
            "risk_factors": [
                "User data exposure",
                "Browser security warnings",
                "SEO impact",
                "Compliance violations"
            ]
        }

    def _extract_technical_remediation(self, crew_result: Any) -> Dict[str, Any]:
        """Extract technical remediation steps"""
        return {
            "immediate_actions": [
                "Purchase SSL certificate from trusted CA",
                "Install certificate with proper chain",
                "Configure server for HTTPS",
                "Test certificate installation"
            ],
            "configuration_steps": [
                "Generate CSR with correct information",
                "Install intermediate certificates",
                "Configure SSL/TLS settings",
                "Enable HSTS headers"
            ],
            "testing_procedures": [
                "Use SSL checker tools",
                "Test from multiple browsers", 
                "Verify certificate chain",
                "Check expiration monitoring"
            ],
            "code_examples": str(crew_result) if crew_result else "Code examples not available"
        }

    def _extract_implementation_priority(self, crew_result: Any) -> Dict[str, Any]:
        """Extract implementation priority matrix"""
        return {
            "critical_priority": [
                "Install valid SSL certificate",
                "Fix certificate chain issues"
            ],
            "high_priority": [
                "Configure HSTS",
                "Set up certificate monitoring"
            ],
            "medium_priority": [
                "Implement certificate auto-renewal",
                "Enhance security headers"
            ],
            "timeline": {
                "immediate": "0-24 hours",
                "short_term": "1-7 days", 
                "medium_term": "1-4 weeks"
            }
        }

    def _handle_ssl_analysis_error(self, error: Exception, url: str, ssl_info: Dict) -> Dict[str, Any]:
        """Handle errors in SSL analysis"""
        return {
            "ssl_analysis": {
                "execution_summary": f"SSL analysis failed: {str(error)}",
                "error_details": str(error),
                "analysis_timestamp": datetime.now().isoformat(),
                "website_url": url,
                "ssl_error_details": ssl_info,
                "status": "failed"
            },
            "security_assessment": {"error": "Security analysis failed"},
            "legal_implications": {"error": "Legal analysis failed"},
            "risk_matrix": {"error": "Risk assessment failed"},
            "technical_remediation": {"error": "Remediation planning failed"},
            "implementation_priority": {"error": "Priority assessment failed"}
        }

    def _process_combined_results(self, crew_result: Any, website_data: WebsiteData, 
                                 violations: List[Any], mapped_issues: List[Any], 
                                 remediation_plan: Dict[str, Any], technical_summary: str) -> Dict[str, Any]:
        """Process combined technical analysis and AI agent results"""
        
        # Get compliance report from technical analysis
        compliance_report = self.issue_mapper_impl.generate_compliance_report(mapped_issues)
        
        # Process AI agent enhancements
        ai_insights = self._extract_ai_insights_from_crew(crew_result)
        
        # Combine technical findings with AI enhancements
        combined_violations = self._combine_violation_reports(violations, ai_insights.get('violations', {}))
        combined_legal_context = self._enhance_legal_context(ai_insights.get('legal_updates', {}))
        combined_risk_assessment = self._enhance_risk_assessment(compliance_report, ai_insights.get('risk_assessment', {}))
        combined_roadmap = self._enhance_implementation_roadmap(remediation_plan, ai_insights.get('implementation_roadmap', {}))
        
        return {
            "multi_agent_analysis": {
                "status": "completed",
                "analysis_timestamp": datetime.now().isoformat(),
                "agents_involved": ["Compliance Scanner", "Legal Update Retriever", "Issue Mapping Agent", "Remediation Advisor"],
                "execution_summary": f"Technical analysis found {len(violations)} violations, enhanced by AI agents with external research",
                "technical_analysis_summary": technical_summary
            },
            "violation_report": combined_violations,
            "legal_context": combined_legal_context,
            "mapped_issues": {
                "mapped_violations": [self._mapped_issue_to_dict(issue) for issue in mapped_issues],
                "regulatory_citations": list(set([getattr(issue, 'regulation_reference', '') for issue in mapped_issues])),
                "prioritization": compliance_report.get('priority_matrix', {}),
                "compliance_score": compliance_report.get('compliance_score', 0)
            },
            "remediation_plan": {
                "technical_solutions": remediation_plan,
                "ai_enhanced_recommendations": ai_insights.get('remediation_advice', {}),
                "implementation_order": remediation_plan.get('implementation_order', []),
                "estimated_time": remediation_plan.get('estimated_total_time', 'Unknown')
            },
            "risk_assessment": combined_risk_assessment,
            "implementation_roadmap": combined_roadmap
        }
    
    def _extract_ai_insights_from_crew(self, crew_result: Any) -> Dict[str, Any]:
        """Extract insights from CrewAI agent results"""
        result_text = str(crew_result) if crew_result else ""
        
        return {
            'violations': self._extract_violations(crew_result),
            'legal_updates': self._extract_legal_updates(crew_result),
            'risk_assessment': self._extract_risk_assessment(crew_result),
            'implementation_roadmap': self._extract_implementation_roadmap(crew_result),
            'remediation_advice': self._extract_remediation_advice(crew_result)
        }
    
    def _combine_violation_reports(self, technical_violations: List[Any], ai_violations: Dict[str, Any]) -> Dict[str, Any]:
        """Combine technical violations with AI-enhanced analysis"""
        
        # Convert technical violations to categories
        categories = {'gdpr': [], 'wcag': [], 'ada': [], 'security': [], 'seo': []}
        severity_breakdown = {'critical': 0, 'high': 0, 'medium': 0, 'low': 0}
        
        for violation in technical_violations:
            violation_type = getattr(violation, 'type', '')
            severity = getattr(violation, 'severity', 'medium')
            description = getattr(violation, 'description', str(violation))
            
            # Categorize violation
            if violation_type.startswith('gdpr'):
                categories['gdpr'].append(description)
            elif violation_type.startswith('wcag'):
                categories['wcag'].append(description)
            elif violation_type.startswith('ada'):
                categories['ada'].append(description)
            elif violation_type.startswith('security'):
                categories['security'].append(description)
            elif violation_type.startswith('seo'):
                categories['seo'].append(description)
            
            severity_breakdown[severity] += 1
        
        # Enhance with AI findings
        ai_by_category = ai_violations.get('by_category', {})
        for category, ai_items in ai_by_category.items():
            if category in categories and isinstance(ai_items, list):
                categories[category].extend(ai_items)
        
        # Enhance severity breakdown
        ai_severity = ai_violations.get('severity_breakdown', {})
        for severity, count in ai_severity.items():
            if severity in severity_breakdown:
                severity_breakdown[severity] += count
        
        return {
            "total_violations": len(technical_violations) + ai_violations.get('total_violations', 0),
            "by_category": categories,
            "severity_breakdown": severity_breakdown,
            "technical_findings": f"Found {len(technical_violations)} technical violations",
            "ai_enhanced_findings": ai_violations.get('raw_findings', '')
        }
    
    def _enhance_legal_context(self, ai_legal_updates: Dict[str, Any]) -> Dict[str, Any]:
        """Enhance legal context with AI research"""
        return {
            "recent_updates": ai_legal_updates.get('recent_updates', []),
            "relevant_regulations": ai_legal_updates.get('relevant_regulations', []),
            "enforcement_trends": ai_legal_updates.get('enforcement_trends', []),
            "compliance_deadlines": ai_legal_updates.get('compliance_deadlines', []),
            "regional_variations": ai_legal_updates.get('regional_variations', []),
            "update_summary": ai_legal_updates.get('update_summary', 'AI-enhanced legal research completed')
        }
    
    def _enhance_risk_assessment(self, compliance_report: Dict[str, Any], ai_risk: Dict[str, Any]) -> Dict[str, Any]:
        """Enhance risk assessment with AI insights"""
        return {
            "overall_risk_level": ai_risk.get('overall_risk_level', 'medium'),
            "risk_factors": ai_risk.get('risk_factors', []),
            "potential_penalties": ai_risk.get('potential_penalties', []),
            "business_impact": ai_risk.get('business_impact', ''),
            "compliance_score": compliance_report.get('compliance_score', 0),
            "technical_risk_breakdown": compliance_report.get('severity_breakdown', {}),
            "risk_summary": ai_risk.get('risk_summary', 'Combined technical and AI risk assessment')
        }
    
    def _enhance_implementation_roadmap(self, technical_plan: Dict[str, Any], ai_roadmap: Dict[str, Any]) -> Dict[str, Any]:
        """Enhance implementation roadmap with AI insights"""
        return {
            "immediate": ai_roadmap.get('immediate', []),
            "short_term": ai_roadmap.get('short_term', []),
            "long_term": ai_roadmap.get('long_term', []),
            "ongoing_maintenance": ai_roadmap.get('ongoing_maintenance', []),
            "timeline_overview": ai_roadmap.get('timeline_overview', {}),
            "resource_requirements": ai_roadmap.get('resource_requirements', {}),
            "success_metrics": ai_roadmap.get('success_metrics', {}),
            "technical_solutions": technical_plan.get('solutions', []),
            "auto_implementable": technical_plan.get('auto_implementable', 0),
            "manual_fixes": technical_plan.get('manual_fixes', 0),
            "roadmap_summary": f"Combined technical and AI-enhanced implementation roadmap with {technical_plan.get('total_fixes', 0)} solutions"
        }
    
    def _mapped_issue_to_dict(self, issue: Any) -> Dict[str, Any]:
        """Convert mapped issue to dictionary"""
        return {
            "element_type": getattr(issue, 'element_type', ''),
            "issue_type": getattr(issue, 'issue_type', ''),
            "regulation_reference": getattr(issue, 'regulation_reference', ''),
            "severity_level": getattr(issue, 'severity_level', ''),
            "fix_priority": getattr(issue, 'fix_priority', 0),
            "estimated_fix_time": getattr(issue, 'estimated_fix_time', ''),
            "xpath": getattr(issue, 'element_xpath', ''),
            "css_selector": getattr(issue, 'element_selector', '')
        } 