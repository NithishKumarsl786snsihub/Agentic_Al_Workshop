"""
Remediation Advisor - Generates specific, actionable fixes for compliance violations
"""

from typing import Dict, List, Any
from dataclasses import dataclass

@dataclass
class RemediationFix:
    issue_type: str
    fix_description: str
    code_example: str
    implementation_steps: List[str]
    testing_instructions: str
    estimated_time: str

class RemediationAdvisor:
    """Generates actionable remediation plans for compliance violations"""
    
    def __init__(self):
        self.fix_templates = {
            'gdpr_cookie_banner': self._generate_cookie_banner_fix,
            'wcag_missing_alt': self._generate_alt_text_fix,
            'wcag_unlabeled_inputs': self._generate_form_label_fix,
            'ada_keyboard_access': self._generate_keyboard_access_fix,
            'security_no_https': self._generate_https_fix,
            'seo_missing_meta': self._generate_meta_tags_fix
        }
    
    def generate_remediation_plan(self, mapped_issues: List[Any]) -> Dict[str, Any]:
        """Generate comprehensive remediation plan with specific fixes"""
        fixes = []
        total_estimated_time = 0
        
        for issue in mapped_issues:
            issue_type = getattr(issue, 'issue_type', str(issue))
            fix = self._generate_specific_fix(issue_type, issue)
            if fix:
                fixes.append(fix)
                # Extract hours from estimated time string
                time_str = fix.estimated_time
                if 'hour' in time_str:
                    hours = int(time_str.split()[0]) if time_str.split()[0].isdigit() else 2
                    total_estimated_time += hours
                elif 'day' in time_str:
                    days = int(time_str.split()[0]) if time_str.split()[0].isdigit() else 1
                    total_estimated_time += days * 8  # 8 hours per day
        
        return {
            'fixes': fixes,
            'total_fixes': len(fixes),
            'estimated_total_time': f"{total_estimated_time} hours",
            'priority_order': self._prioritize_fixes(fixes),
            'implementation_roadmap': self._create_implementation_roadmap(fixes)
        }
    
    def _generate_specific_fix(self, issue_type: str, issue: Any) -> RemediationFix:
        """Generate a specific fix for an issue type"""
        for pattern, fix_generator in self.fix_templates.items():
            if pattern in issue_type:
                return fix_generator(issue)
        
        # Generic fix for unknown issues
        return RemediationFix(
            issue_type=issue_type,
            fix_description="General compliance improvement needed",
            code_example="<!-- Review and update this element for compliance -->",
            implementation_steps=["Review issue details", "Apply appropriate fix", "Test implementation"],
            testing_instructions="Verify compliance using accessibility testing tools",
            estimated_time="2 hours"
        )
    
    def _generate_cookie_banner_fix(self, issue: Any) -> RemediationFix:
        """Generate GDPR cookie banner implementation"""
        return RemediationFix(
            issue_type="GDPR Cookie Consent Banner",
            fix_description="Implement GDPR-compliant cookie consent banner with accept/reject options",
            code_example="""<!-- Add to your HTML head -->
<script src="https://cdn.jsdelivr.net/gh/orestbida/cookieconsent@v3.0.0/dist/cookieconsent.umd.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orestbida/cookieconsent@v3.0.0/dist/cookieconsent.css">

<!-- Initialize cookie consent -->
<script>
CookieConsent.run({
    guiOptions: {
        consentModal: {
            layout: "box",
            position: "bottom left"
        }
    },
    categories: {
        necessary: {
            readOnly: true
        },
        analytics: {}
    },
    language: {
        default: "en",
        translations: {
            en: {
                consentModal: {
                    title: "We use cookies",
                    description: "This website uses cookies to ensure you get the best experience.",
                    acceptAllBtn: "Accept all",
                    acceptNecessaryBtn: "Accept necessary only",
                    showPreferencesBtn: "Manage preferences"
                }
            }
        }
    }
});
</script>""",
            implementation_steps=[
                "Add cookie consent library to your HTML",
                "Configure consent categories (necessary, analytics, marketing)",
                "Customize banner text and styling",
                "Implement cookie setting/getting functions",
                "Update privacy policy with cookie information",
                "Test accept/reject functionality"
            ],
            testing_instructions="Test banner appearance, accept/reject functionality, and verify cookies are set correctly",
            estimated_time="4 hours"
        )
    
    def _generate_alt_text_fix(self, issue: Any) -> RemediationFix:
        """Generate alt text fix for images"""
        return RemediationFix(
            issue_type="Image Alt Text",
            fix_description="Add descriptive alt text to all images for screen reader accessibility",
            code_example="""<!-- Before -->
<img src="product-image.jpg">

<!-- After -->
<img src="product-image.jpg" alt="Blue wireless headphones with noise cancellation feature">

<!-- For decorative images -->
<img src="decorative-border.jpg" alt="" role="presentation">

<!-- For complex images -->
<img src="sales-chart.jpg" alt="Sales increased 25% from Q1 to Q2" longdesc="#chart-description">
<div id="chart-description">
    <p>Detailed description: Sales data shows...</p>
</div>""",
            implementation_steps=[
                "Audit all images on the website",
                "Identify decorative vs informative images",
                "Write descriptive alt text for informative images",
                "Use empty alt=\"\" for decorative images",
                "Add longdesc for complex images like charts",
                "Test with screen reader software"
            ],
            testing_instructions="Use NVDA or JAWS screen reader to verify alt text is read correctly",
            estimated_time="3 hours"
        )
    
    def _generate_form_label_fix(self, issue: Any) -> RemediationFix:
        """Generate form label fix"""
        return RemediationFix(
            issue_type="Form Input Labels",
            fix_description="Add proper labels to all form inputs for accessibility",
            code_example="""<!-- Method 1: Explicit labels -->
<label for="email">Email Address (required)</label>
<input type="email" id="email" name="email" required>

<!-- Method 2: Implicit labels -->
<label>
    Phone Number
    <input type="tel" name="phone">
</label>

<!-- Method 3: ARIA labels -->
<input type="search" aria-label="Search products" placeholder="Search...">

<!-- Method 4: ARIA labelledby -->
<div id="billing-title">Billing Address</div>
<input type="text" aria-labelledby="billing-title" name="billing-street">""",
            implementation_steps=[
                "Identify all form inputs without labels",
                "Add explicit labels using for/id attributes",
                "Use aria-label for inputs without visible labels",
                "Group related inputs with fieldset/legend",
                "Add required field indicators",
                "Test tab navigation and screen reader compatibility"
            ],
            testing_instructions="Navigate form using only keyboard and verify all fields are properly announced by screen readers",
            estimated_time="2 hours"
        )
    
    def _generate_keyboard_access_fix(self, issue: Any) -> RemediationFix:
        """Generate keyboard accessibility fix"""
        return RemediationFix(
            issue_type="Keyboard Accessibility",
            fix_description="Ensure all interactive elements are accessible via keyboard navigation",
            code_example="""<!-- Add proper href to links -->
<a href="#main-content" class="skip-link">Skip to main content</a>

<!-- Ensure buttons are focusable -->
<button type="button" onclick="toggleMenu()">Menu</button>

<!-- Add tabindex for custom interactive elements -->
<div role="button" tabindex="0" onkeypress="handleKeyPress(event)" onclick="customAction()">
    Custom Button
</div>

<!-- CSS for focus indicators -->
<style>
.skip-link:focus,
button:focus,
[role="button"]:focus {
    outline: 2px solid #0066cc;
    outline-offset: 2px;
}
</style>

<script>
function handleKeyPress(event) {
    if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        customAction();
    }
}
</script>""",
            implementation_steps=[
                "Add skip navigation links",
                "Ensure all interactive elements have proper href or tabindex",
                "Implement keyboard event handlers for custom elements",
                "Add visible focus indicators",
                "Test complete keyboard navigation flow",
                "Verify logical tab order"
            ],
            testing_instructions="Navigate entire site using only Tab, Enter, Space, and Arrow keys",
            estimated_time="4 hours"
        )
    
    def _generate_https_fix(self, issue: Any) -> RemediationFix:
        """Generate HTTPS implementation fix"""
        return RemediationFix(
            issue_type="HTTPS Security",
            fix_description="Implement HTTPS with proper SSL certificate",
            code_example="""<!-- Server configuration (Apache) -->
<VirtualHost *:443>
    ServerName yourdomain.com
    DocumentRoot /var/www/html
    
    SSLEngine on
    SSLCertificateFile /path/to/certificate.crt
    SSLCertificateKeyFile /path/to/private.key
    SSLCertificateChainFile /path/to/certificate_chain.crt
    
    # Security headers
    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
    Header always set X-Content-Type-Options nosniff
    Header always set X-Frame-Options DENY
</VirtualHost>

<!-- Redirect HTTP to HTTPS -->
<VirtualHost *:80>
    ServerName yourdomain.com
    Redirect permanent / https://yourdomain.com/
</VirtualHost>""",
            implementation_steps=[
                "Obtain SSL certificate from trusted CA or Let's Encrypt",
                "Install certificate on web server",
                "Configure server to redirect HTTP to HTTPS",
                "Update all internal links to use HTTPS",
                "Add security headers (HSTS, CSP)",
                "Test certificate installation with SSL checker"
            ],
            testing_instructions="Use SSL Labs SSL Test to verify certificate installation and security grade",
            estimated_time="1 day"
        )
    
    def _generate_meta_tags_fix(self, issue: Any) -> RemediationFix:
        """Generate SEO meta tags fix"""
        return RemediationFix(
            issue_type="SEO Meta Tags",
            fix_description="Add proper meta tags for SEO optimization",
            code_example="""<!-- Essential meta tags -->
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Descriptive Page Title - Brand Name</title>
<meta name="description" content="Compelling description under 160 characters that includes target keywords">

<!-- Open Graph tags for social media -->
<meta property="og:title" content="Page Title">
<meta property="og:description" content="Page description">
<meta property="og:image" content="https://yourdomain.com/image.jpg">
<meta property="og:url" content="https://yourdomain.com/page">

<!-- Twitter Card tags -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Page Title">
<meta name="twitter:description" content="Page description">
<meta name="twitter:image" content="https://yourdomain.com/image.jpg">""",
            implementation_steps=[
                "Add unique, descriptive title tags to all pages",
                "Write compelling meta descriptions under 160 characters",
                "Implement Open Graph tags for social sharing",
                "Add Twitter Card meta tags",
                "Include canonical URLs to prevent duplicate content",
                "Test social media preview appearance"
            ],
            testing_instructions="Use Facebook Sharing Debugger and Twitter Card Validator to test social media previews",
            estimated_time="3 hours"
        )
    
    def _prioritize_fixes(self, fixes: List[RemediationFix]) -> List[str]:
        """Prioritize fixes based on compliance risk and implementation complexity"""
        priority_order = [
            "GDPR Cookie Consent Banner",
            "HTTPS Security", 
            "Image Alt Text",
            "Form Input Labels",
            "Keyboard Accessibility",
            "SEO Meta Tags"
        ]
        
        prioritized = []
        for priority_type in priority_order:
            for fix in fixes:
                if priority_type in fix.issue_type and fix.issue_type not in prioritized:
                    prioritized.append(fix.issue_type)
        
        # Add any remaining fixes
        for fix in fixes:
            if fix.issue_type not in prioritized:
                prioritized.append(fix.issue_type)
        
        return prioritized
    
    def _create_implementation_roadmap(self, fixes: List[RemediationFix]) -> Dict[str, List[str]]:
        """Create phased implementation roadmap"""
        roadmap = {
            'phase_1_critical': [],
            'phase_2_high': [],
            'phase_3_medium': []
        }
        
        critical_fixes = ["GDPR Cookie Consent Banner", "HTTPS Security"]
        high_fixes = ["Image Alt Text", "Form Input Labels", "Keyboard Accessibility"]
        
        for fix in fixes:
            if any(critical in fix.issue_type for critical in critical_fixes):
                roadmap['phase_1_critical'].append(fix.issue_type)
            elif any(high in fix.issue_type for high in high_fixes):
                roadmap['phase_2_high'].append(fix.issue_type)
            else:
                roadmap['phase_3_medium'].append(fix.issue_type)
        
        return roadmap 