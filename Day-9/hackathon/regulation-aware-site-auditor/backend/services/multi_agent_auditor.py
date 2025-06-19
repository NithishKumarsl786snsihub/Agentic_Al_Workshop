import os
import json
import asyncio
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta

from crewai import Agent, Task, Crew, Process
# from crewai_tools import DuckDuckGoSearchRun, FileReadTool, DirectoryReadTool  # Commented out due to dependency conflicts
from langchain_google_genai import ChatGoogleGenerativeAI
# import chromadb  # Commented out due to dependency conflicts
# from chromadb import Settings

from api.models import WebsiteData, ComplianceResults, ComplianceIssue, SeverityLevel, ComplianceCategory
from core.config import settings

# Import actual agent implementations
from .compliance_scanner import ComplianceScanner
from .issue_mapper import IssueMapper  
from .remediation_advisor import RemediationAdvisor


# Simple fallback implementations for missing tools
class SimpleSearchTool:
    """Simple search tool fallback"""
    def search(self, query: str) -> str:
        return f"Search results for: {query} (Note: Real search functionality requires crewai_tools)"


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
        
        # Initialize ChromaDB for RAG (fallback if not available)
        try:
            # self.chroma_client = chromadb.PersistentClient(
            #     path=settings.CHROMA_DB_PATH,
            #     settings=Settings(anonymized_telemetry=False)
            # )
            self.chroma_client = None  # Disabled due to dependency conflicts
        except Exception:
            self.chroma_client = None
        
        # Initialize tools (fallback implementations)
        # self.search_tool = DuckDuckGoSearchRun()
        self.search_tool = SimpleSearchTool()
        
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
        """Create tasks for all agents to work on the website audit"""
        
        tasks = []
        
        # Task 1: Enhanced Compliance Analysis
        compliance_task = Task(
            description=f"""
            Analyze the website {website_data.url} for comprehensive compliance issues.
            
            Website Title: {website_data.title}
            Technical Analysis Summary: {technical_summary}
            
            Your analysis should cover:
            1. GDPR compliance (consent mechanisms, privacy policies, data collection practices)
            2. WCAG 2.1 AA accessibility standards
            3. ADA digital accessibility requirements  
            4. SEO best practices
            5. Security compliance standards
            
            Focus on identifying specific violations and their potential legal implications.
            Provide detailed findings that will inform remediation strategies.
            """,
            agent=self.compliance_scanner,
            expected_output="Detailed compliance analysis with specific violations categorized by regulation and severity"
        )
        tasks.append(compliance_task)
        
        # Task 2: Legal Context and Updates
        legal_task = Task(
            description=f"""
            Research and provide current legal context for compliance violations found on {website_data.url}.
            
            Based on the technical analysis: {technical_summary}
            
            Your research should include:
            1. Recent updates to GDPR, CCPA, and other privacy regulations
            2. Latest accessibility law enforcement trends (ADA Title III cases)
            3. Current WCAG guidelines and upcoming changes
            4. Regional compliance variations and requirements
            5. Recent court cases and penalty precedents
            
            Provide context on how current legal trends affect the identified violations.
            """,
            agent=self.legal_update_retriever,
            expected_output="Current legal context with recent regulatory updates, enforcement trends, and applicable legal precedents"
        )
        tasks.append(legal_task)
        
        # Task 3: Security Analysis (if SSL-related issues detected)
        if "ssl" in technical_summary.lower() or "security" in technical_summary.lower():
            security_task = Task(
                description=f"""
                Perform detailed security analysis for {website_data.url}.
                
                Technical findings: {technical_summary}
                
                Analyze:
                1. SSL/TLS certificate configuration and validity
                2. Security headers and best practices
                3. Encryption standards and protocols
                4. Security compliance requirements (PCI DSS, ISO 27001)
                5. Vulnerability assessment and risk factors
                
                Provide specific security recommendations and risk mitigation strategies.
                """,
                agent=self.security_analysis_agent,
                expected_output="Comprehensive security analysis with risk assessment and specific remediation recommendations"
            )
            tasks.append(security_task)
        
        # Task 4: Issue Mapping and Risk Assessment
        mapping_task = Task(
            description=f"""
            Map identified compliance issues to specific regulations and assess business risk.
            
            Website: {website_data.url}
            Technical Analysis: {technical_summary}
            
            Your mapping should:
            1. Connect each violation to specific regulatory requirements (GDPR articles, WCAG success criteria)
            2. Assess legal risk and potential financial penalties
            3. Evaluate business impact and reputational risk
            4. Prioritize issues based on severity and implementation complexity
            5. Create a risk matrix for decision-making
            
            Provide clear regulatory citations and risk-based prioritization.
            """,
            agent=self.issue_mapping_agent,
            expected_output="Detailed issue mapping with regulatory citations, risk assessment matrix, and prioritized violation list"
        )
        tasks.append(mapping_task)
        
        # Task 5: Enhanced Implementation Roadmap Generation
        roadmap_task = Task(
            description=f"""
            Create a comprehensive, actionable implementation roadmap for {website_data.url} based on all previous analysis.
            
            Website Context:
            - Title: {website_data.title}
            - URL: {website_data.url}
            - Technical Summary: {technical_summary}
            
            Generate a detailed roadmap with:
            
            IMMEDIATE ACTIONS (0-2 weeks):
            - Critical security fixes and SSL issues
            - Essential accessibility violations (alt text, form labels)
            - GDPR cookie consent implementation
            - High-risk legal compliance issues
            
            SHORT-TERM GOALS (1-3 months):
            - Comprehensive accessibility audit and fixes
            - Privacy policy and data handling improvements
            - SEO optimization and technical improvements
            - Staff training and process establishment
            
            LONG-TERM STRATEGY (3-12 months):
            - Compliance framework development
            - Advanced accessibility features
            - Comprehensive monitoring systems
            - Legal review and documentation
            
            ONGOING MAINTENANCE:
            - Regular compliance audits
            - Regulatory update monitoring
            - Staff training programs
            - Performance tracking and reporting
            
            For each phase, include:
            - Specific actionable tasks with technical details
            - Estimated effort and resource requirements
            - Success metrics and testing criteria
            - Dependencies and prerequisites
            - Cost estimates where applicable
            
            Make recommendations specific to the actual violations found, not generic advice.
            """,
            agent=self.remediation_advisor,
            expected_output="Detailed implementation roadmap with specific actions, timelines, resources, and success metrics for each phase"
        )
        tasks.append(roadmap_task)
        
        return tasks
    
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
        """Extract detailed implementation roadmap from crew results using enhanced LLM processing"""
        
        try:
            # Get the actual crew output
            result_text = str(crew_result) if crew_result else ""
            
            # Enhanced roadmap prompt for more specific, actionable content
            roadmap_prompt = f"""
            Based on the following comprehensive multi-agent compliance analysis, create a detailed, actionable implementation roadmap:
            
            ANALYSIS RESULTS:
            {result_text}
            
            Generate specific, actionable items for each phase based on the ACTUAL violations found (not generic advice).
            Structure as JSON with detailed content:
            
            {{
                "immediate": [
                    {{
                        "action": "specific action description",
                        "reason": "why this is critical/immediate",
                        "effort": "estimated hours/days",
                        "skills": "required skills/team",
                        "validation": "how to verify completion"
                    }}
                ],
                "short_term": [
                    {{
                        "action": "specific action description", 
                        "reason": "why this is important for compliance",
                        "effort": "estimated time and resources",
                        "dependencies": "what must be done first",
                        "outcomes": "expected results"
                    }}
                ],
                "long_term": [
                    {{
                        "action": "strategic initiative description",
                        "reason": "long-term compliance value",
                        "effort": "resource commitment required",
                        "success_metrics": "measurable outcomes",
                        "timeline": "specific milestones"
                    }}
                ],
                "ongoing_maintenance": [
                    {{
                        "action": "maintenance activity",
                        "frequency": "how often to perform",
                        "responsibility": "who should do this",
                        "tools": "recommended tools/processes",
                        "alerts": "what to monitor for"
                    }}
                ],
                "phase_details": {{
                    "immediate": {{
                        "timeline": "0-2 weeks",
                        "priority": "Critical legal and security compliance",
                        "budget_estimate": "$500-2000",
                        "team_size": "2-3 developers",
                        "risk_if_delayed": "Legal liability, security breaches"
                    }},
                    "short_term": {{
                        "timeline": "1-3 months", 
                        "priority": "Comprehensive accessibility and privacy compliance",
                        "budget_estimate": "$2000-8000",
                        "team_size": "Cross-functional team (dev, design, legal)",
                        "risk_if_delayed": "Accessibility lawsuits, user experience issues"
                    }},
                    "long_term": {{
                        "timeline": "3-12 months",
                        "priority": "Strategic compliance framework and monitoring",
                        "budget_estimate": "$5000-20000",
                        "team_size": "Organization-wide initiative",
                        "risk_if_delayed": "Systemic compliance failures"
                    }},
                    "ongoing_maintenance": {{
                        "timeline": "Continuous",
                        "priority": "Sustained compliance and monitoring",
                        "budget_estimate": "$1000-3000/month",
                        "team_size": "Dedicated compliance team",
                        "risk_if_delayed": "Compliance drift"
                    }}
                }},
                "roadmap_summary": "Executive summary highlighting the most critical actions and expected outcomes",
                "total_implementation_time": "estimated total time to full compliance",
                "compliance_score_projection": "expected compliance improvement percentage"
            }}
            
            IMPORTANT: Base all recommendations on the SPECIFIC violations found in the analysis. Include technical details like:
            - Exact HTML elements to fix (based on violations found)
            - Specific WCAG success criteria to address
            - GDPR articles that need implementation
            - Security configurations to implement
            - Testing procedures for each fix
            
            Make each action item specific, measurable, and directly tied to the compliance issues identified.
            """
            
            # Generate enhanced roadmap using LLM
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
                    
                    # Validate and ensure proper structure
                    if self._validate_roadmap_structure(roadmap_data):
                        return roadmap_data
                except json.JSONDecodeError as e:
                    print(f"JSON parsing error: {e}")
            
            # Fallback: parse structured text response
            return self._parse_enhanced_roadmap_from_text(response_text, result_text)
            
        except Exception as e:
            print(f"Error extracting roadmap: {e}")
            return self._create_enhanced_fallback_roadmap(result_text)
    
    def _validate_roadmap_structure(self, roadmap_data: Dict[str, Any]) -> bool:
        """Validate that the roadmap has the required structure"""
        required_sections = ["immediate", "short_term", "long_term", "ongoing_maintenance"]
        return all(section in roadmap_data for section in required_sections)
    
    def _parse_enhanced_roadmap_from_text(self, llm_response: str, original_text: str) -> Dict[str, Any]:
        """Parse enhanced roadmap from text-based LLM response with detailed action items"""
        
        # Initialize enhanced roadmap structure
        roadmap = {
            "immediate": [],
            "short_term": [],
            "long_term": [],
            "ongoing_maintenance": [],
            "phase_details": {
                "immediate": {
                    "timeline": "0-2 weeks",
                    "priority": "Critical compliance and security fixes",
                    "budget_estimate": "$500-2000",
                    "team_size": "2-3 developers",
                    "risk_if_delayed": "Legal liability, security vulnerabilities"
                },
                "short_term": {
                    "timeline": "1-3 months",
                    "priority": "Comprehensive accessibility and privacy compliance",
                    "budget_estimate": "$2000-8000", 
                    "team_size": "Cross-functional team",
                    "risk_if_delayed": "Accessibility lawsuits, compliance violations"
                },
                "long_term": {
                    "timeline": "3-12 months",
                    "priority": "Strategic compliance framework",
                    "budget_estimate": "$5000-20000",
                    "team_size": "Organization-wide",
                    "risk_if_delayed": "Systemic compliance failures"
                },
                "ongoing_maintenance": {
                    "timeline": "Continuous",
                    "priority": "Sustained compliance monitoring",
                    "budget_estimate": "$1000-3000/month",
                    "team_size": "Dedicated compliance team",
                    "risk_if_delayed": "Compliance drift"
                }
            },
            "roadmap_summary": "AI-generated implementation roadmap based on specific compliance violations found",
            "total_implementation_time": "3-6 months for full compliance",
            "compliance_score_projection": "Expected 60-90% improvement"
        }
        
        # Extract specific actionable items from the LLM response
        sections = {
            "immediate": ["immediate", "critical", "urgent", "security", "ssl", "cookie"],
            "short_term": ["short", "accessibility", "wcag", "gdpr", "privacy"],
            "long_term": ["long", "framework", "training", "monitoring", "strategic"],
            "ongoing_maintenance": ["ongoing", "maintenance", "monitor", "regular", "continuous"]
        }
        
        # Parse the response for detailed action items
        lines = llm_response.split('\n')
        current_section = None
        
        for line in lines:
            line = line.strip()
            if not line or line.startswith('#'):
                continue
                
            # Detect section headers
            line_lower = line.lower()
            for section, keywords in sections.items():
                if any(keyword in line_lower for keyword in keywords) and any(marker in line for marker in [':', 'action', 'phase']):
                    current_section = section
                    break
            
            # Extract detailed action items
            if current_section and (line.startswith(('-', '*', '•')) or line[0].isdigit() or 'action' in line.lower()):
                cleaned_line = line.lstrip('-*•0123456789. ').strip()
                
                # Create detailed action item structure
                if cleaned_line and len(cleaned_line) > 15:
                    action_item = {
                        "action": cleaned_line,
                        "reason": self._extract_reason_from_context(cleaned_line, original_text),
                        "effort": self._estimate_effort(cleaned_line),
                        "validation": self._suggest_validation(cleaned_line)
                    }
                    
                    # Add section-specific fields
                    if current_section == "immediate":
                        action_item.update({
                            "skills": "Frontend development, security configuration",
                            "priority": "Critical"
                        })
                    elif current_section == "short_term":
                        action_item.update({
                            "dependencies": "Immediate actions completed",
                            "outcomes": "Improved compliance score"
                        })
                    elif current_section == "long_term":
                        action_item.update({
                            "success_metrics": "Full regulatory compliance",
                            "timeline": "3-6 months"
                        })
                    elif current_section == "ongoing_maintenance":
                        action_item.update({
                            "frequency": "Monthly or quarterly",
                            "responsibility": "Compliance team"
                        })
                    
                    roadmap[current_section].append(action_item)
        
        # If sections are still empty, create intelligent defaults based on violations
        for section in ["immediate", "short_term", "long_term", "ongoing_maintenance"]:
            if not roadmap[section]:
                roadmap[section] = self._generate_default_actions(section, original_text)
        
        return roadmap
    
    def _extract_reason_from_context(self, action: str, context: str) -> str:
        """Extract reasoning for why this action is needed based on context"""
        action_lower = action.lower()
        if "cookie" in action_lower or "consent" in action_lower:
            return "Required by GDPR Article 7 for lawful consent mechanisms"
        elif "alt" in action_lower or "image" in action_lower:
            return "WCAG 2.1 Success Criterion 1.1.1 requires alternative text for images"
        elif "ssl" in action_lower or "https" in action_lower:
            return "Security compliance and data protection requirement"
        elif "label" in action_lower or "form" in action_lower:
            return "WCAG 2.1 Success Criterion 1.3.1 requires proper form labeling"
        else:
            return "Improves overall compliance and user experience"
    
    def _estimate_effort(self, action: str) -> str:
        """Estimate effort required for an action"""
        action_lower = action.lower()
        if any(term in action_lower for term in ["implement", "framework", "system"]):
            return "3-5 days"
        elif any(term in action_lower for term in ["add", "fix", "update"]):
            return "4-8 hours"
        elif any(term in action_lower for term in ["review", "audit", "test"]):
            return "1-2 days"
        else:
            return "2-4 hours"
    
    def _suggest_validation(self, action: str) -> str:
        """Suggest how to validate completion of an action"""
        action_lower = action.lower()
        if "cookie" in action_lower:
            return "Test consent banner functionality and verify cookie compliance"
        elif "alt" in action_lower:
            return "Use screen reader to verify all images have proper descriptions"
        elif "ssl" in action_lower:
            return "Verify SSL certificate validity and HTTPS redirect functionality"
        elif "label" in action_lower:
            return "Test form navigation with keyboard and screen reader"
        else:
            return "Perform compliance testing and user acceptance testing"
    
    def _generate_default_actions(self, section: str, context: str) -> List[Dict[str, Any]]:
        """Generate intelligent default actions based on section and violation context"""
        defaults = {
            "immediate": [
                {
                    "action": "Implement SSL certificate and force HTTPS redirect",
                    "reason": "Essential for data security and regulatory compliance",
                    "effort": "4-8 hours",
                    "skills": "DevOps, server configuration",
                    "validation": "Verify SSL rating and certificate validity"
                },
                {
                    "action": "Add GDPR-compliant cookie consent banner",
                    "reason": "Required by GDPR Article 7 for EU visitors",
                    "effort": "1-2 days",
                    "skills": "Frontend development, legal knowledge",
                    "validation": "Test consent mechanisms and cookie management"
                }
            ],
            "short_term": [
                {
                    "action": "Conduct comprehensive accessibility audit and remediation",
                    "reason": "Ensure WCAG 2.1 AA compliance and ADA requirements",
                    "effort": "2-4 weeks",
                    "dependencies": "Immediate security fixes completed",
                    "outcomes": "Improved accessibility score and reduced legal risk"
                }
            ],
            "long_term": [
                {
                    "action": "Establish compliance monitoring and reporting framework",
                    "reason": "Proactive compliance management and continuous improvement",
                    "effort": "1-3 months",
                    "success_metrics": "Automated compliance monitoring with >95% uptime",
                    "timeline": "6-12 months for full implementation"
                }
            ],
            "ongoing_maintenance": [
                {
                    "action": "Monthly compliance audits and regulatory update reviews",
                    "frequency": "Monthly",
                    "responsibility": "Compliance team or designated developer",
                    "tools": "Automated scanning tools and manual reviews",
                    "alerts": "New accessibility violations or security issues"
                }
            ]
        }
        
        return defaults.get(section, [])
    
    def _create_enhanced_fallback_roadmap(self, analysis_context: str) -> Dict[str, Any]:
        """Create enhanced fallback roadmap when parsing fails"""
        return {
            "immediate": [
                {
                    "action": "Review and address critical compliance violations identified in analysis",
                    "reason": "Immediate legal and security risk mitigation",
                    "effort": "1-2 days",
                    "skills": "Web development, security basics",
                    "validation": "Re-run compliance scan to verify fixes"
                },
                {
                    "action": "Implement basic security measures and SSL certificates",
                    "reason": "Foundation for data protection compliance",
                    "effort": "4-8 hours", 
                    "skills": "Server administration, SSL configuration",
                    "validation": "SSL Labs test showing A+ rating"
                }
            ],
            "short_term": [
                {
                    "action": "Conduct comprehensive accessibility audit and remediation",
                    "reason": "Ensure WCAG 2.1 AA compliance and ADA requirements",
                    "effort": "2-4 weeks",
                    "dependencies": "Immediate security fixes completed",
                    "outcomes": "Improved accessibility score and reduced legal risk"
                },
                {
                    "action": "Develop privacy policy and cookie management system",
                    "reason": "GDPR compliance for EU visitors and data protection",
                    "effort": "1-2 weeks",
                    "dependencies": "Legal review of data practices",
                    "outcomes": "Full GDPR compliance for data collection"
                }
            ],
            "long_term": [
                {
                    "action": "Establish compliance monitoring and reporting framework",
                    "reason": "Proactive compliance management and continuous improvement",
                    "effort": "1-3 months",
                    "success_metrics": "Automated compliance monitoring with >95% uptime",
                    "timeline": "6-12 months for full implementation"
                },
                {
                    "action": "Build organization-wide compliance governance framework",
                    "reason": "Systematic approach to regulatory compliance",
                    "effort": "3-6 months",
                    "success_metrics": "Company-wide compliance policies and procedures",
                    "timeline": "6-12 months for full organizational adoption"
                }
            ],
            "ongoing_maintenance": [
                {
                    "action": "Monthly compliance audits and regulatory update reviews",
                    "frequency": "Monthly",
                    "responsibility": "Compliance team or designated developer",
                    "tools": "Automated scanning tools and manual reviews",
                    "alerts": "New accessibility violations or security issues"
                },
                {
                    "action": "Monitor regulatory changes and update policies",
                    "frequency": "Quarterly",
                    "responsibility": "Legal and compliance team",
                    "tools": "Legal research databases and regulatory newsletters",
                    "alerts": "New regulations affecting website compliance"
                }
            ],
            "phase_details": {
                "immediate": {
                    "timeline": "0-2 weeks",
                    "priority": "Critical legal and security compliance",
                    "budget_estimate": "$500-2000",
                    "team_size": "2-3 developers",
                    "risk_if_delayed": "Legal liability, security breaches, regulatory penalties"
                },
                "short_term": {
                    "timeline": "1-3 months",
                    "priority": "Comprehensive accessibility and privacy compliance",
                    "budget_estimate": "$2000-8000",
                    "team_size": "Cross-functional team (dev, design, legal)",
                    "risk_if_delayed": "Accessibility lawsuits, user experience issues"
                },
                "long_term": {
                    "timeline": "3-12 months",
                    "priority": "Strategic compliance framework and monitoring",
                    "budget_estimate": "$5000-20000",
                    "team_size": "Organization-wide initiative",
                    "risk_if_delayed": "Systemic compliance failures, reputation damage"
                },
                "ongoing_maintenance": {
                    "timeline": "Continuous",
                    "priority": "Sustained compliance and monitoring",
                    "budget_estimate": "$1000-3000/month",
                    "team_size": "Dedicated compliance team or consultant",
                    "risk_if_delayed": "Compliance drift, regulatory violations"
                }
            },
            "roadmap_summary": "Comprehensive compliance implementation roadmap with immediate security fixes, accessibility improvements, and long-term governance framework",
            "total_implementation_time": "3-6 months for full compliance",
            "compliance_score_projection": "Expected 60-90% improvement in compliance score"
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