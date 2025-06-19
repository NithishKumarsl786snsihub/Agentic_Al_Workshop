from bs4 import BeautifulSoup
import re
from typing import Dict, List, Callable
from api.models import (
    WebsiteData, ComplianceResults, ComplianceIssue, 
    ComplianceRecommendation, CategoryResults, SeverityLevel, 
    ComplianceCategory, PriorityLevel
)

class ComplianceChecker:
    """Comprehensive compliance checker for various regulations"""
    
    def __init__(self):
        self.compliance_rules: Dict[str, Callable] = {
            'gdpr': self._check_gdpr_compliance,
            'accessibility': self._check_accessibility_compliance,
            'wcag': self._check_wcag_compliance,
            'seo': self._check_seo_compliance,
            'security': self._check_security_compliance
        }

    async def analyze_compliance(self, website_data: WebsiteData) -> ComplianceResults:
        """Run all compliance checks"""
        results = ComplianceResults(
            url=website_data.url,
            title=website_data.title,
            issues=[],
            recommendations=[],
            score=0.0,
            categories={}
        )

        # Run each compliance check
        for category, check_function in self.compliance_rules.items():
            category_results = check_function(website_data)
            results.categories[category] = category_results
            results.issues.extend(category_results.issues)
            results.recommendations.extend(category_results.recommendations)

        # Calculate overall score
        total_checks = sum(
            len(cat.issues) + len(cat.passed) 
            for cat in results.categories.values()
        )
        passed_checks = sum(len(cat.passed) for cat in results.categories.values())
        results.score = round(
            (passed_checks / total_checks * 100) if total_checks > 0 else 0, 1
        )

        return results

    def _check_gdpr_compliance(self, data: WebsiteData) -> CategoryResults:
        """Check GDPR compliance requirements"""
        issues = []
        recommendations = []
        passed = []

        html_content = data.html_content.lower()

        # Check for cookie consent
        cookie_keywords = ['cookie', 'consent', 'gdpr', 'privacy policy', 'data protection']
        has_cookie_consent = any(keyword in html_content for keyword in cookie_keywords)

        if not has_cookie_consent:
            issues.append(ComplianceIssue(
                severity=SeverityLevel.HIGH,
                category=ComplianceCategory.GDPR,
                issue='Missing cookie consent mechanism',
                description='No cookie consent banner or privacy controls detected'
            ))
            recommendations.append(ComplianceRecommendation(
                category=ComplianceCategory.GDPR,
                recommendation='Add a cookie consent banner that allows users to accept/reject cookies',
                priority=PriorityLevel.HIGH
            ))
        else:
            passed.append('Cookie consent mechanism present')

        # Check for privacy policy
        privacy_links = [
            link for link in data.links 
            if 'privacy' in link.text.lower() or 'privacy' in link.href.lower()
        ]
        if not privacy_links:
            issues.append(ComplianceIssue(
                severity=SeverityLevel.HIGH,
                category=ComplianceCategory.GDPR,
                issue='Missing privacy policy link',
                description='No privacy policy link found on the website'
            ))
            recommendations.append(ComplianceRecommendation(
                category=ComplianceCategory.GDPR,
                recommendation='Add a clearly visible link to your privacy policy',
                priority=PriorityLevel.HIGH
            ))
        else:
            passed.append('Privacy policy link present')

        # Check for data collection forms without consent
        for form in data.forms:
            has_email_input = any(inp.type == 'email' for inp in form.inputs)
            has_consent_checkbox = any(
                'consent' in inp.name.lower() or 'privacy' in inp.name.lower() 
                for inp in form.inputs
            )

            if has_email_input and not has_consent_checkbox:
                issues.append(ComplianceIssue(
                    severity=SeverityLevel.MEDIUM,
                    category=ComplianceCategory.GDPR,
                    issue='Form collecting email without explicit consent',
                    description='Email collection form lacks consent checkbox'
                ))
                recommendations.append(ComplianceRecommendation(
                    category=ComplianceCategory.GDPR,
                    recommendation='Add a consent checkbox to forms collecting personal data',
                    priority=PriorityLevel.MEDIUM
                ))

        return CategoryResults(issues=issues, recommendations=recommendations, passed=passed)

    def _check_accessibility_compliance(self, data: WebsiteData) -> CategoryResults:
        """Check accessibility compliance (ADA/WCAG)"""
        issues = []
        recommendations = []
        passed = []

        # Check for missing alt text
        images_without_alt = [img for img in data.images if not img.alt]
        if images_without_alt:
            issues.append(ComplianceIssue(
                severity=SeverityLevel.HIGH,
                category=ComplianceCategory.ACCESSIBILITY,
                issue=f'{len(images_without_alt)} images missing alt text',
                description='Images without alt text are not accessible to screen readers'
            ))
            recommendations.append(ComplianceRecommendation(
                category=ComplianceCategory.ACCESSIBILITY,
                recommendation='Add descriptive alt text to all images',
                priority=PriorityLevel.HIGH
            ))
        else:
            passed.append('All images have alt text')

        # Check for proper heading structure
        headings = data.headings
        if headings:
            first_heading = min(headings, key=lambda x: x.level)
            if first_heading.level != 1:
                issues.append(ComplianceIssue(
                    severity=SeverityLevel.MEDIUM,
                    category=ComplianceCategory.ACCESSIBILITY,
                    issue='Page does not start with H1',
                    description='Proper heading hierarchy should start with H1'
                ))
                recommendations.append(ComplianceRecommendation(
                    category=ComplianceCategory.ACCESSIBILITY,
                    recommendation='Ensure page has a proper H1 heading as the main title',
                    priority=PriorityLevel.MEDIUM
                ))
            else:
                passed.append('Proper heading structure with H1')

        # Check for form labels
        for form in data.forms:
            inputs_without_labels = [
                inp for inp in form.inputs 
                if not inp.label and inp.type not in ['submit', 'button', 'hidden']
            ]
            if inputs_without_labels:
                issues.append(ComplianceIssue(
                    severity=SeverityLevel.HIGH,
                    category=ComplianceCategory.ACCESSIBILITY,
                    issue='Form inputs without labels detected',
                    description='Form inputs need associated labels for screen readers'
                ))
                recommendations.append(ComplianceRecommendation(
                    category=ComplianceCategory.ACCESSIBILITY,
                    recommendation='Add proper labels to all form inputs',
                    priority=PriorityLevel.HIGH
                ))

        # Check for skip navigation
        soup = BeautifulSoup(data.html_content, 'html.parser')
        skip_nav = soup.find('a', string=re.compile(r'skip.*nav', re.I))
        if not skip_nav:
            issues.append(ComplianceIssue(
                severity=SeverityLevel.MEDIUM,
                category=ComplianceCategory.ACCESSIBILITY,
                issue='Missing skip navigation link',
                description='Skip navigation helps keyboard users bypass repetitive content'
            ))
            recommendations.append(ComplianceRecommendation(
                category=ComplianceCategory.ACCESSIBILITY,
                recommendation='Add a "Skip to main content" link at the beginning of the page',
                priority=PriorityLevel.MEDIUM
            ))
        else:
            passed.append('Skip navigation link present')

        return CategoryResults(issues=issues, recommendations=recommendations, passed=passed)

    def _check_wcag_compliance(self, data: WebsiteData) -> CategoryResults:
        """Check WCAG specific guidelines"""
        issues = []
        recommendations = []
        passed = []

        # Check for language attribute
        soup = BeautifulSoup(data.html_content, 'html.parser')
        html_tag = soup.find('html')
        if not html_tag or not html_tag.get('lang'):
            issues.append(ComplianceIssue(
                severity=SeverityLevel.MEDIUM,
                category=ComplianceCategory.WCAG,
                issue='Missing language attribute',
                description='HTML tag should have a lang attribute for screen readers'
            ))
            recommendations.append(ComplianceRecommendation(
                category=ComplianceCategory.WCAG,
                recommendation='Add lang attribute to HTML tag (e.g., <html lang="en">)',
                priority=PriorityLevel.MEDIUM
            ))
        else:
            passed.append('Language attribute present')

        # Check for page title
        if not data.title or data.title == 'No title':
            issues.append(ComplianceIssue(
                severity=SeverityLevel.HIGH,
                category=ComplianceCategory.WCAG,
                issue='Missing page title',
                description='Page title is essential for screen readers and SEO'
            ))
            recommendations.append(ComplianceRecommendation(
                category=ComplianceCategory.WCAG,
                recommendation='Add a descriptive title tag to the page',
                priority=PriorityLevel.HIGH
            ))
        else:
            passed.append('Page title present')

        # Check for focus indicators
        css_content = ' '.join(data.css_styles).lower()
        has_focus_styles = ':focus' in css_content
        if not has_focus_styles:
            issues.append(ComplianceIssue(
                severity=SeverityLevel.MEDIUM,
                category=ComplianceCategory.WCAG,
                issue='No custom focus indicators detected',
                description='Custom focus styles improve keyboard navigation visibility'
            ))
            recommendations.append(ComplianceRecommendation(
                category=ComplianceCategory.WCAG,
                recommendation='Add visible focus indicators for interactive elements',
                priority=PriorityLevel.MEDIUM
            ))
        else:
            passed.append('Focus indicators present')

        return CategoryResults(issues=issues, recommendations=recommendations, passed=passed)

    def _check_seo_compliance(self, data: WebsiteData) -> CategoryResults:
        """Check basic SEO compliance"""
        issues = []
        recommendations = []
        passed = []

        # Check meta description
        meta_description = data.meta_tags.get('description', '')
        if not meta_description:
            issues.append(ComplianceIssue(
                severity=SeverityLevel.MEDIUM,
                category=ComplianceCategory.SEO,
                issue='Missing meta description',
                description='Meta description helps search engines understand page content'
            ))
            recommendations.append(ComplianceRecommendation(
                category=ComplianceCategory.SEO,
                recommendation='Add a compelling meta description (150-160 characters)',
                priority=PriorityLevel.MEDIUM
            ))
        else:
            passed.append('Meta description present')

        # Check for multiple H1 tags
        h1_count = len([h for h in data.headings if h.level == 1])
        if h1_count > 1:
            issues.append(ComplianceIssue(
                severity=SeverityLevel.LOW,
                category=ComplianceCategory.SEO,
                issue=f'Multiple H1 tags found ({h1_count})',
                description='Multiple H1 tags can confuse search engines'
            ))
            recommendations.append(ComplianceRecommendation(
                category=ComplianceCategory.SEO,
                recommendation='Use only one H1 tag per page',
                priority=PriorityLevel.LOW
            ))
        elif h1_count == 1:
            passed.append('Single H1 tag present')

        return CategoryResults(issues=issues, recommendations=recommendations, passed=passed)

    def _check_security_compliance(self, data: WebsiteData) -> CategoryResults:
        """Check basic security compliance"""
        issues = []
        recommendations = []
        passed = []

        # Check if site is HTTPS
        if not data.url.startswith('https://'):
            issues.append(ComplianceIssue(
                severity=SeverityLevel.HIGH,
                category=ComplianceCategory.SECURITY,
                issue='Site not using HTTPS',
                description='HTTPS is essential for secure data transmission'
            ))
            recommendations.append(ComplianceRecommendation(
                category=ComplianceCategory.SECURITY,
                recommendation='Implement SSL certificate and redirect HTTP to HTTPS',
                priority=PriorityLevel.HIGH
            ))
        else:
            passed.append('HTTPS encryption enabled')

        # Check for mixed content
        soup = BeautifulSoup(data.html_content, 'html.parser')
        http_resources = []
        for tag in soup.find_all(['img', 'script', 'link']):
            src = tag.get('src') or tag.get('href', '')
            if src.startswith('http://'):
                http_resources.append(src)

        if http_resources and data.url.startswith('https://'):
            issues.append(ComplianceIssue(
                severity=SeverityLevel.MEDIUM,
                category=ComplianceCategory.SECURITY,
                issue=f'Mixed content detected ({len(http_resources)} resources)',
                description='HTTP resources on HTTPS pages can cause security warnings'
            ))
            recommendations.append(ComplianceRecommendation(
                category=ComplianceCategory.SECURITY,
                recommendation='Update all resource URLs to use HTTPS',
                priority=PriorityLevel.MEDIUM
            ))

        return CategoryResults(issues=issues, recommendations=recommendations, passed=passed) 