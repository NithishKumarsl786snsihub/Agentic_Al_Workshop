"""
Compliance Scanner Agent - Performs actual technical analysis of websites
for GDPR, ADA, WCAG, and region-specific compliance violations.
"""

import re
from typing import Dict, List, Any, Tuple
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
import requests
from dataclasses import dataclass

@dataclass
class ComplianceViolation:
    type: str
    severity: str  # critical, high, medium, low
    element: str
    description: str
    regulation: str
    xpath: str = ""
    recommendation: str = ""

class ComplianceScanner:
    """Technical compliance scanner that performs actual analysis"""
    
    def __init__(self):
        self.violations = []
        
    def scan_website(self, url: str, html_content: str, website_data: Any) -> List[ComplianceViolation]:
        """Perform comprehensive compliance scanning"""
        self.violations = []
        soup = BeautifulSoup(html_content, 'html.parser')
        
        # Perform all compliance checks
        self._check_gdpr_compliance(soup, url, website_data)
        self._check_wcag_compliance(soup, website_data)
        self._check_ada_compliance(soup, website_data)
        self._check_security_compliance(url, soup)
        self._check_seo_compliance(soup, website_data)
        
        return self.violations
    
    def _check_gdpr_compliance(self, soup: BeautifulSoup, url: str, website_data: Any) -> None:
        """Check GDPR compliance requirements"""
        
        # 1. Cookie Banner Check
        cookie_banner_selectors = [
            '[id*="cookie"]', '[class*="cookie"]', '[id*="consent"]', 
            '[class*="consent"]', '[id*="gdpr"]', '[class*="gdpr"]'
        ]
        
        has_cookie_banner = any(soup.select(selector) for selector in cookie_banner_selectors)
        if not has_cookie_banner:
            self.violations.append(ComplianceViolation(
                type="gdpr_cookie_banner",
                severity="critical",
                element="document",
                description="Missing cookie consent banner required by GDPR Article 7",
                regulation="GDPR Article 7",
                recommendation="Implement cookie consent banner with accept/reject options"
            ))
        
        # 2. Privacy Policy Check
        privacy_links = soup.find_all('a', string=re.compile(r'privacy', re.I))
        privacy_links.extend(soup.find_all('a', href=re.compile(r'privacy', re.I)))
        
        if not privacy_links:
            self.violations.append(ComplianceViolation(
                type="gdpr_privacy_policy",
                severity="high",
                element="navigation",
                description="Missing privacy policy link required by GDPR Article 13",
                regulation="GDPR Article 13",
                recommendation="Add visible privacy policy link in footer or header"
            ))
        
        # 3. Contact Information Check
        contact_elements = soup.find_all(string=re.compile(r'contact|email|phone', re.I))
        if not contact_elements:
            self.violations.append(ComplianceViolation(
                type="gdpr_contact_info",
                severity="medium",
                element="document",
                description="Missing data controller contact information",
                regulation="GDPR Article 13",
                recommendation="Provide clear contact information for data protection queries"
            ))
    
    def _check_wcag_compliance(self, soup: BeautifulSoup, website_data: Any) -> None:
        """Check WCAG 2.1 AA compliance"""
        
        # 1. Image Alt Text Check
        images = soup.find_all('img')
        missing_alt = []
        
        for img in images:
            if not img.get('alt') and not img.get('aria-label'):
                missing_alt.append(img.get('src', 'unknown'))
        
        if missing_alt:
            self.violations.append(ComplianceViolation(
                type="wcag_missing_alt",
                severity="high",
                element=f"{len(missing_alt)} images",
                description=f"Images missing alt text: {len(missing_alt)} violations",
                regulation="WCAG 2.1 Success Criterion 1.1.1",
                recommendation="Add descriptive alt text to all images"
            ))
        
        # 2. Heading Structure Check
        headings = soup.find_all(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'])
        h1_count = len(soup.find_all('h1'))
        
        if h1_count == 0:
            self.violations.append(ComplianceViolation(
                type="wcag_missing_h1",
                severity="high",
                element="document",
                description="Missing main heading (h1) element",
                regulation="WCAG 2.1 Success Criterion 1.3.1",
                recommendation="Add a descriptive h1 heading to the page"
            ))
        elif h1_count > 1:
            self.violations.append(ComplianceViolation(
                type="wcag_multiple_h1",
                severity="medium",
                element="document",
                description=f"Multiple h1 elements found ({h1_count})",
                regulation="WCAG 2.1 Success Criterion 1.3.1",
                recommendation="Use only one h1 element per page"
            ))
        
        # 3. Form Label Check
        inputs = soup.find_all('input', type=['text', 'email', 'password', 'tel', 'url'])
        unlabeled_inputs = []
        
        for input_elem in inputs:
            input_id = input_elem.get('id')
            has_label = False
            
            if input_id:
                has_label = bool(soup.find('label', attrs={'for': input_id}))
            
            if not has_label and not input_elem.get('aria-label') and not input_elem.get('aria-labelledby'):
                unlabeled_inputs.append(input_elem.get('name', 'unnamed'))
        
        if unlabeled_inputs:
            self.violations.append(ComplianceViolation(
                type="wcag_unlabeled_inputs",
                severity="high",
                element=f"{len(unlabeled_inputs)} form inputs",
                description=f"Form inputs without proper labels: {len(unlabeled_inputs)} violations",
                regulation="WCAG 2.1 Success Criterion 1.3.1",
                recommendation="Add proper labels or aria-label attributes to all form inputs"
            ))
        
        # 4. Link Text Check
        links = soup.find_all('a', href=True)
        generic_links = []
        
        for link in links:
            link_text = link.get_text(strip=True).lower()
            if link_text in ['click here', 'read more', 'more', 'here', 'link']:
                generic_links.append(link_text)
        
        if generic_links:
            self.violations.append(ComplianceViolation(
                type="wcag_generic_links",
                severity="medium",
                element=f"{len(generic_links)} links",
                description=f"Links with non-descriptive text: {len(generic_links)} violations",
                regulation="WCAG 2.1 Success Criterion 2.4.4",
                recommendation="Use descriptive link text that indicates the link's purpose"
            ))
    
    def _check_ada_compliance(self, soup: BeautifulSoup, website_data: Any) -> None:
        """Check ADA Title III compliance"""
        
        # 1. Keyboard Navigation Check
        interactive_elements = soup.find_all(['button', 'a', 'input', 'select', 'textarea'])
        missing_keyboard_access = []
        
        for element in interactive_elements:
            if element.name == 'a' and not element.get('href'):
                missing_keyboard_access.append(element.name)
            elif element.get('tabindex') == '-1':
                missing_keyboard_access.append(element.name)
        
        if missing_keyboard_access:
            self.violations.append(ComplianceViolation(
                type="ada_keyboard_access",
                severity="high",
                element=f"{len(missing_keyboard_access)} interactive elements",
                description="Interactive elements not accessible via keyboard",
                regulation="ADA Title III - Keyboard Accessibility",
                recommendation="Ensure all interactive elements are keyboard accessible"
            ))
        
        # 2. ARIA Landmarks Check
        landmarks = soup.find_all(['nav', 'main', 'header', 'footer', 'aside'])
        landmark_roles = soup.find_all(attrs={'role': re.compile(r'navigation|main|banner|contentinfo|complementary')})
        
        total_landmarks = len(landmarks) + len(landmark_roles)
        if total_landmarks < 2:
            self.violations.append(ComplianceViolation(
                type="ada_missing_landmarks",
                severity="medium",
                element="document structure",
                description="Insufficient ARIA landmarks for screen reader navigation",
                regulation="ADA Title III - Screen Reader Accessibility",
                recommendation="Add semantic HTML5 elements or ARIA landmark roles"
            ))
    
    def _check_security_compliance(self, url: str, soup: BeautifulSoup) -> None:
        """Check security compliance"""
        
        # 1. HTTPS Check
        if not url.startswith('https://'):
            self.violations.append(ComplianceViolation(
                type="security_no_https",
                severity="critical",
                element="protocol",
                description="Website not served over HTTPS",
                regulation="Data Protection - Encryption in Transit",
                recommendation="Implement SSL/TLS certificate and redirect HTTP to HTTPS"
            ))
        
        # 2. External Scripts Check
        scripts = soup.find_all('script', src=True)
        external_scripts = []
        
        for script in scripts:
            src = script.get('src')
            if src and (src.startswith('http') and not src.startswith(url)):
                external_scripts.append(src)
        
        if external_scripts:
            self.violations.append(ComplianceViolation(
                type="security_external_scripts",
                severity="medium",
                element=f"{len(external_scripts)} external scripts",
                description="External scripts may pose security risks",
                regulation="Security Best Practices",
                recommendation="Review and validate all external script sources"
            ))
    
    def _check_seo_compliance(self, soup: BeautifulSoup, website_data: Any) -> None:
        """Check SEO and technical compliance"""
        
        # 1. Meta Description Check
        meta_desc = soup.find('meta', attrs={'name': 'description'})
        if not meta_desc or not meta_desc.get('content'):
            self.violations.append(ComplianceViolation(
                type="seo_missing_meta_desc",
                severity="low",
                element="meta tags",
                description="Missing meta description",
                regulation="SEO Best Practices",
                recommendation="Add descriptive meta description (150-160 characters)"
            ))
        
        # 2. Title Tag Check
        title = soup.find('title')
        if not title or not title.get_text(strip=True):
            self.violations.append(ComplianceViolation(
                type="seo_missing_title",
                severity="medium",
                element="title tag",
                description="Missing or empty title tag",
                regulation="SEO Best Practices",
                recommendation="Add descriptive page title"
            ))
    
    def get_violations_by_category(self) -> Dict[str, List[ComplianceViolation]]:
        """Group violations by category"""
        categories = {
            'gdpr': [],
            'wcag': [],
            'ada': [],
            'security': [],
            'seo': []
        }
        
        for violation in self.violations:
            if violation.type.startswith('gdpr'):
                categories['gdpr'].append(violation)
            elif violation.type.startswith('wcag'):
                categories['wcag'].append(violation)
            elif violation.type.startswith('ada'):
                categories['ada'].append(violation)
            elif violation.type.startswith('security'):
                categories['security'].append(violation)
            elif violation.type.startswith('seo'):
                categories['seo'].append(violation)
        
        return categories
    
    def get_severity_breakdown(self) -> Dict[str, int]:
        """Get count of violations by severity"""
        breakdown = {'critical': 0, 'high': 0, 'medium': 0, 'low': 0}
        
        for violation in self.violations:
            breakdown[violation.severity] += 1
        
        return breakdown 