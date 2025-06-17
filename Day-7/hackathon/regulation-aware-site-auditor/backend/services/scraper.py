import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
import validators
import warnings
import re
from typing import Dict, List, Optional, Tuple
import time

from core.config import settings
from api.models import (
    WebsiteData, ImageInfo, FormInfo, LinkInfo, 
    ScriptInfo, HeadingInfo, InputInfo
)

warnings.filterwarnings('ignore')

class WebsiteScraper:
    """Website content scraper and analyzer"""
    
    def __init__(self):
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        self.timeout = settings.REQUEST_TIMEOUT
        self.max_content_length = settings.MAX_CONTENT_LENGTH

    async def fetch_website_content(self, url: str) -> Tuple[Optional[WebsiteData], Optional[str]]:
        """Fetch and parse website content"""
        try:
            # Validate URL
            if not validators.url(url):
                return None, "Invalid URL format"

            # Make request
            response = requests.get(url, headers=self.headers, timeout=self.timeout)
            response.raise_for_status()

            # Parse HTML
            soup = BeautifulSoup(response.text, 'html.parser')

            # Extract key elements
            website_data = WebsiteData(
                url=url,
                title=self._extract_title(soup),
                html_content=str(soup),
                meta_tags=self._extract_meta_tags(soup),
                images=self._extract_images(soup, url),
                forms=self._extract_forms(soup),
                links=self._extract_links(soup, url),
                scripts=self._extract_scripts(soup),
                css_styles=self._extract_css_styles(soup),
                headings=self._extract_headings(soup),
                content_text=soup.get_text()[:self.max_content_length]
            )

            return website_data, None

        except requests.RequestException as e:
            return None, f"Error fetching website: {str(e)}"
        except Exception as e:
            return None, f"Error parsing website: {str(e)}"

    def _extract_title(self, soup: BeautifulSoup) -> str:
        """Extract page title"""
        title_tag = soup.find('title')
        return title_tag.get_text().strip() if title_tag else 'No title'

    def _extract_meta_tags(self, soup: BeautifulSoup) -> Dict[str, str]:
        """Extract meta tags information"""
        meta_tags = {}
        for meta in soup.find_all('meta'):
            name = meta.get('name') or meta.get('property') or meta.get('http-equiv')
            content = meta.get('content')
            if name and content:
                meta_tags[name] = content
        return meta_tags

    def _extract_images(self, soup: BeautifulSoup, base_url: str) -> List[ImageInfo]:
        """Extract image information"""
        images = []
        for img in soup.find_all('img'):
            image_info = ImageInfo(
                src=urljoin(base_url, img.get('src', '')),
                alt=img.get('alt', ''),
                title=img.get('title', ''),
                width=img.get('width', ''),
                height=img.get('height', '')
            )
            images.append(image_info)
        return images

    def _extract_forms(self, soup: BeautifulSoup) -> List[FormInfo]:
        """Extract form information"""
        forms = []
        for form in soup.find_all('form'):
            form_inputs = []
            for input_tag in form.find_all(['input', 'textarea', 'select']):
                input_info = InputInfo(
                    type=input_tag.get('type', 'text'),
                    name=input_tag.get('name', ''),
                    required=input_tag.has_attr('required'),
                    label=self._find_label_for_input(soup, input_tag)
                )
                form_inputs.append(input_info)
            
            form_info = FormInfo(
                action=form.get('action', ''),
                method=form.get('method', 'GET'),
                inputs=form_inputs
            )
            forms.append(form_info)
        return forms

    def _find_label_for_input(self, soup: BeautifulSoup, input_tag) -> str:
        """Find associated label for input field"""
        input_id = input_tag.get('id')
        if input_id:
            label = soup.find('label', {'for': input_id})
            if label:
                return label.get_text().strip()
        return ''

    def _extract_links(self, soup: BeautifulSoup, base_url: str) -> List[LinkInfo]:
        """Extract link information"""
        links = []
        for link in soup.find_all('a', href=True):
            link_info = LinkInfo(
                href=urljoin(base_url, link['href']),
                text=link.get_text().strip(),
                title=link.get('title', ''),
                target=link.get('target', '')
            )
            links.append(link_info)
        return links

    def _extract_scripts(self, soup: BeautifulSoup) -> List[ScriptInfo]:
        """Extract script information"""
        scripts = []
        for script in soup.find_all('script'):
            script_info = ScriptInfo(
                src=script.get('src', ''),
                type=script.get('type', ''),
                content=script.string[:200] if script.string else ''
            )
            scripts.append(script_info)
        return scripts

    def _extract_css_styles(self, soup: BeautifulSoup) -> List[str]:
        """Extract CSS style information"""
        styles = []
        for style in soup.find_all('style'):
            if style.string:
                styles.append(style.string[:500])  # Limit to 500 chars
        return styles

    def _extract_headings(self, soup: BeautifulSoup) -> List[HeadingInfo]:
        """Extract heading structure"""
        headings = []
        for level in range(1, 7):
            for heading in soup.find_all(f'h{level}'):
                heading_info = HeadingInfo(
                    level=level,
                    text=heading.get_text().strip(),
                    id=heading.get('id', '')
                )
                headings.append(heading_info)
        return headings 