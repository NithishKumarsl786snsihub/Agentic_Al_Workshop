"""
Issue Mapping Agent - Identifies specific non-compliant elements and maps them to regulations
"""

from typing import Dict, List, Any, Tuple
from dataclasses import dataclass
from bs4 import BeautifulSoup
import re

@dataclass
class MappedIssue:
    element_type: str
    element_xpath: str
    element_selector: str
    issue_type: str
    regulation_reference: str
    severity_level: str
    business_impact: str
    fix_priority: int
    estimated_fix_time: str

class IssueMapper:
    """Maps compliance violations to specific regulations and elements"""
    
    def __init__(self):
        self.regulation_map = {
            'GDPR': {
                'Article 7': 'Consent mechanisms and cookie banners',
                'Article 13': 'Information to be provided where data collected from data subject',
                'Article 25': 'Data protection by design and by default',
                'Article 32': 'Security of processing'
            },
            'WCAG 2.1': {
                '1.1.1': 'Non-text Content (Alternative text)',
                '1.3.1': 'Info and Relationships (Headings, labels)',
                '1.4.3': 'Contrast (Minimum)',
                '2.1.1': 'Keyboard navigation',
                '2.4.4': 'Link Purpose (In Context)',
                '3.3.2': 'Labels or Instructions',
                '4.1.2': 'Name, Role, Value (ARIA)'
            },
            'ADA Title III': {
                'Section 508': 'Electronic accessibility standards',
                'DOJ Guidelines': 'Digital accessibility requirements'
            }
        }
        
        self.business_impact_levels = {
            'critical': 'Legal liability, potential lawsuits, immediate compliance action required',
            'high': 'Significant user accessibility barriers, compliance violations',
            'medium': 'User experience issues, potential compliance gaps',
            'low': 'Minor usability issues, best practice improvements'
        }
    
    def map_violations_to_elements(self, html_content: str, violations: List[Any]) -> List[MappedIssue]:
        """Map violations to specific DOM elements with regulation references"""
        soup = BeautifulSoup(html_content, 'html.parser')
        mapped_issues = []
        
        for violation in violations:
            mapped_issue = self._create_mapped_issue(soup, violation)
            if mapped_issue:
                mapped_issues.append(mapped_issue)
        
        # Sort by priority (critical first)
        mapped_issues.sort(key=lambda x: x.fix_priority)
        
        return mapped_issues
    
    def _create_mapped_issue(self, soup: BeautifulSoup, violation: Any) -> MappedIssue:
        """Create a mapped issue from a violation"""
        
        issue_type = getattr(violation, 'type', str(violation))
        severity = getattr(violation, 'severity', 'medium')
        
        # Map issue to specific elements and regulations
        if 'gdpr_cookie' in issue_type:
            return self._map_cookie_consent_issue(soup, violation)
        elif 'wcag_missing_alt' in issue_type:
            return self._map_alt_text_issues(soup, violation)
        elif 'wcag_unlabeled_inputs' in issue_type:
            return self._map_form_label_issues(soup, violation)
        elif 'ada_keyboard' in issue_type:
            return self._map_keyboard_access_issues(soup, violation)
        elif 'security_no_https' in issue_type:
            return self._map_security_issues(soup, violation)
        else:
            return self._map_generic_issue(soup, violation)
    
    def _map_cookie_consent_issue(self, soup: BeautifulSoup, violation: Any) -> MappedIssue:
        """Map GDPR cookie consent issues"""
        return MappedIssue(
            element_type="Cookie Consent Banner",
            element_xpath="//body",
            element_selector="body",
            issue_type="Missing GDPR-compliant cookie consent mechanism",
            regulation_reference="GDPR Article 7 - Conditions for consent",
            severity_level="critical",
            business_impact=self.business_impact_levels['critical'],
            fix_priority=1,
            estimated_fix_time="1-2 days"
        )
    
    def _map_alt_text_issues(self, soup: BeautifulSoup, violation: Any) -> MappedIssue:
        """Map image alt text issues to specific images"""
        images_without_alt = soup.find_all('img', alt='')
        images_without_alt.extend(soup.find_all('img', lambda value: value is None if value != 'alt' else False))
        
        # Get first image without alt for specific mapping
        first_image = images_without_alt[0] if images_without_alt else soup.find('img')
        
        if first_image:
            xpath = self._get_element_xpath(first_image)
            selector = self._get_css_selector(first_image)
        else:
            xpath = "//img[not(@alt)]"
            selector = "img:not([alt])"
        
        return MappedIssue(
            element_type="Image Elements",
            element_xpath=xpath,
            element_selector=selector,
            issue_type=f"Missing alternative text for {len(images_without_alt)} images",
            regulation_reference="WCAG 2.1 Success Criterion 1.1.1 - Non-text Content",
            severity_level="high",
            business_impact=self.business_impact_levels['high'],
            fix_priority=2,
            estimated_fix_time="2-4 hours"
        )
    
    def _map_form_label_issues(self, soup: BeautifulSoup, violation: Any) -> MappedIssue:
        """Map form label issues to specific form elements"""
        unlabeled_inputs = []
        inputs = soup.find_all('input', type=['text', 'email', 'password', 'tel', 'url'])
        
        for input_elem in inputs:
            input_id = input_elem.get('id')
            has_label = False
            
            if input_id:
                has_label = bool(soup.find('label', attrs={'for': input_id}))
            
            if not has_label and not input_elem.get('aria-label'):
                unlabeled_inputs.append(input_elem)
        
        first_input = unlabeled_inputs[0] if unlabeled_inputs else soup.find('input')
        
        if first_input:
            xpath = self._get_element_xpath(first_input)
            selector = self._get_css_selector(first_input)
        else:
            xpath = "//input[not(@aria-label) and not(@id) or @id and not(//label[@for=current()/@id])]"
            selector = "input:not([aria-label]):not([id]), input[id]:not([id]:has(~ label[for]))"
        
        return MappedIssue(
            element_type="Form Input Elements",
            element_xpath=xpath,
            element_selector=selector,
            issue_type=f"Form inputs without proper labels: {len(unlabeled_inputs)} violations",
            regulation_reference="WCAG 2.1 Success Criterion 1.3.1 - Info and Relationships",
            severity_level="high",
            business_impact=self.business_impact_levels['high'],
            fix_priority=3,
            estimated_fix_time="1-3 hours"
        )
    
    def _map_keyboard_access_issues(self, soup: BeautifulSoup, violation: Any) -> MappedIssue:
        """Map keyboard accessibility issues"""
        return MappedIssue(
            element_type="Interactive Elements",
            element_xpath="//a[not(@href)] | //*[@tabindex='-1']",
            element_selector="a:not([href]), [tabindex='-1']",
            issue_type="Interactive elements not accessible via keyboard",
            regulation_reference="WCAG 2.1 Success Criterion 2.1.1 - Keyboard",
            severity_level="high",
            business_impact=self.business_impact_levels['high'],
            fix_priority=4,
            estimated_fix_time="2-6 hours"
        )
    
    def _map_security_issues(self, soup: BeautifulSoup, violation: Any) -> MappedIssue:
        """Map security-related issues"""
        return MappedIssue(
            element_type="Protocol Security",
            element_xpath="//html",
            element_selector="html",
            issue_type="Website not served over HTTPS",
            regulation_reference="GDPR Article 32 - Security of processing",
            severity_level="critical",
            business_impact=self.business_impact_levels['critical'],
            fix_priority=1,
            estimated_fix_time="1 day (SSL certificate setup)"
        )
    
    def _map_generic_issue(self, soup: BeautifulSoup, violation: Any) -> MappedIssue:
        """Map generic compliance issues"""
        return MappedIssue(
            element_type="General Compliance",
            element_xpath="//body",
            element_selector="body",
            issue_type=getattr(violation, 'description', 'Compliance issue detected'),
            regulation_reference=getattr(violation, 'regulation', 'General compliance requirements'),
            severity_level=getattr(violation, 'severity', 'medium'),
            business_impact=self.business_impact_levels.get(
                getattr(violation, 'severity', 'medium'), 
                'Compliance issue may affect user experience'
            ),
            fix_priority=5,
            estimated_fix_time="Variable"
        )
    
    def _get_element_xpath(self, element) -> str:
        """Generate XPath for a specific element"""
        if not element:
            return ""
        
        components = []
        child = element if element.name else element.parent
        
        for parent in child.parents:
            if parent.name == '[document]':
                break
            
            siblings = parent.find_all(child.name, recursive=False)
            if len(siblings) > 1:
                index = siblings.index(child) + 1
                components.append(f"{child.name}[{index}]")
            else:
                components.append(child.name)
            child = parent
        
        components.reverse()
        return "//" + "/".join(components)
    
    def _get_css_selector(self, element) -> str:
        """Generate CSS selector for a specific element"""
        if not element:
            return ""
        
        if element.get('id'):
            return f"#{element['id']}"
        
        if element.get('class'):
            classes = '.'.join(element['class'])
            return f"{element.name}.{classes}"
        
        return element.name
    
    def create_remediation_priority_matrix(self, mapped_issues: List[MappedIssue]) -> Dict[str, Any]:
        """Create a priority matrix for remediation"""
        matrix = {
            'critical_immediate': [],
            'high_priority': [],
            'medium_priority': [],
            'low_priority': []
        }
        
        for issue in mapped_issues:
            if issue.severity_level == 'critical':
                matrix['critical_immediate'].append(issue)
            elif issue.severity_level == 'high':
                matrix['high_priority'].append(issue)
            elif issue.severity_level == 'medium':
                matrix['medium_priority'].append(issue)
            else:
                matrix['low_priority'].append(issue)
        
        return matrix
    
    def generate_compliance_report(self, mapped_issues: List[MappedIssue]) -> Dict[str, Any]:
        """Generate a comprehensive compliance report"""
        total_issues = len(mapped_issues)
        severity_counts = {'critical': 0, 'high': 0, 'medium': 0, 'low': 0}
        
        for issue in mapped_issues:
            severity_counts[issue.severity_level] += 1
        
        # Calculate compliance score (inverted from violations)
        max_possible_score = 100
        critical_penalty = 30
        high_penalty = 20
        medium_penalty = 10
        low_penalty = 5
        
        total_penalty = (
            severity_counts['critical'] * critical_penalty +
            severity_counts['high'] * high_penalty +
            severity_counts['medium'] * medium_penalty +
            severity_counts['low'] * low_penalty
        )
        
        compliance_score = max(0, max_possible_score - total_penalty)
        
        return {
            'total_issues': total_issues,
            'severity_breakdown': severity_counts,
            'compliance_score': compliance_score,
            'regulation_coverage': {
                'gdpr': len([i for i in mapped_issues if 'GDPR' in i.regulation_reference]),
                'wcag': len([i for i in mapped_issues if 'WCAG' in i.regulation_reference]),
                'ada': len([i for i in mapped_issues if 'ADA' in i.regulation_reference])
            },
            'estimated_fix_time': self._calculate_total_fix_time(mapped_issues),
            'priority_matrix': self.create_remediation_priority_matrix(mapped_issues)
        }
    
    def _calculate_total_fix_time(self, mapped_issues: List[MappedIssue]) -> str:
        """Calculate estimated total fix time"""
        # Simple estimation based on issue count and complexity
        critical_issues = len([i for i in mapped_issues if i.severity_level == 'critical'])
        high_issues = len([i for i in mapped_issues if i.severity_level == 'high'])
        medium_issues = len([i for i in mapped_issues if i.severity_level == 'medium'])
        low_issues = len([i for i in mapped_issues if i.severity_level == 'low'])
        
        total_hours = (critical_issues * 8) + (high_issues * 4) + (medium_issues * 2) + (low_issues * 1)
        
        if total_hours <= 8:
            return f"{total_hours} hours"
        elif total_hours <= 40:
            return f"{total_hours // 8} days"
        else:
            return f"{total_hours // 40} weeks" 