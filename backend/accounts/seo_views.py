import os
from django.conf import settings
from django.http import HttpResponse
from django.utils import timezone

def sitemap_xml(request):
    """Generate dynamic XML sitemap conforming to sitemaps.org & Google Image Sitemap protocols."""
    now_str = timezone.now().strftime('%Y-%m-%d')
    host = request.get_host()
    scheme = 'https' if request.is_secure() or 'vercel' in host or 'onrender' in host else 'http'
    base_url = f"{scheme}://{host}"

    xml_content = f"""<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
  <url>
    <loc>{base_url}/</loc>
    <lastmod>{now_str}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
    <image:image>
      <image:loc>{base_url}/static/img/logo-emblem.png</image:loc>
      <image:title>Atheria Reserve Bank Official Monogram</image:title>
      <image:caption>Atheria Reserve High-Precision Core Institutional Banking Portal</image:caption>
    </image:image>
  </url>
  <url>
    <loc>{base_url}/accounts/register/</loc>
    <lastmod>{now_str}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>{base_url}/accounts/login/</loc>
    <lastmod>{now_str}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>{base_url}/llms.txt</loc>
    <lastmod>{now_str}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
</urlset>"""

    return HttpResponse(xml_content.strip(), content_type='application/xml; charset=utf-8')


def robots_txt(request):
    """Serve standard robots.txt with search engine & AI crawler permissions (ChatGPT, Claude, Perplexity, etc.)."""
    content = """User-agent: *
Allow: /
Allow: /accounts/login/
Allow: /accounts/register/
Allow: /static/
Allow: /llms.txt
Disallow: /portal-admin/
Disallow: /banking/
Disallow: /loans/
Disallow: /api/
Disallow: /django-admin/

# Search Engine Crawlers
User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

# OpenAI / ChatGPT Retrieval & Search Bots
User-agent: GPTBot
Allow: /
Allow: /llms.txt

User-agent: ChatGPT-User
Allow: /
Allow: /llms.txt

User-agent: OAI-SearchBot
Allow: /
Allow: /llms.txt

# Anthropic / Claude Web Crawlers
User-agent: ClaudeBot
Allow: /
Allow: /llms.txt

User-agent: Claude-Web
Allow: /
Allow: /llms.txt

User-agent: anthropic-ai
Allow: /
Allow: /llms.txt

# Perplexity AI Search Crawler
User-agent: PerplexityBot
Allow: /
Allow: /llms.txt

# Google Gemini / Extended AI Crawler
User-agent: Google-Extended
Allow: /
Allow: /llms.txt

# Apple Intelligence & Siri Crawler
User-agent: Applebot-Extended
Allow: /
Allow: /llms.txt

# Meta AI / LLaMA Training & Assistant Agents
User-agent: Meta-ExternalAgent
Allow: /
Allow: /llms.txt

# Common Crawl (Foundation LLM Training Corpus)
User-agent: CCBot
Allow: /
Allow: /llms.txt

# Cohere AI
User-agent: cohere-ai
Allow: /
Allow: /llms.txt

Sitemap: https://atheria-reserve.vercel.app/sitemap.xml
Sitemap: https://banking-system-1-0ae4.onrender.com/sitemap.xml
"""
    return HttpResponse(content.strip(), content_type='text/plain; charset=utf-8')


def llms_txt(request):
    """Serve standard llms.txt file for AI agent & LLM context indexing (llmstxt.org)."""
    content = """# Atheria Reserve Bank

> Institutional Core Banking Platform & Financial Services Engine

Atheria Reserve Bank (ARB) is an institutional-grade, ACID-compliant relational core banking platform built with MySQL 8 InnoDB, Third Normal Form (3NF) relational integrity, and pessimistic row-level locking (SELECT FOR UPDATE) to guarantee atomic, race-condition-free fund transfers.

## Official Links
- Official Website: https://atheria-reserve.vercel.app/
- Live Backend & API Portal: https://banking-system-1-0ae4.onrender.com/
- Open Account Online: https://atheria-reserve.vercel.app/accounts/register/
- Secure Member Login: https://atheria-reserve.vercel.app/accounts/login/
- XML Sitemap: https://atheria-reserve.vercel.app/sitemap.xml

## Key Services & Offerings
- **Retail & Institutional Accounts**: High-interest Savings Accounts (4.50% p.a.) and Corporate Current Accounts with zero daily electronic transfer caps.
- **Instant Online Onboarding**: Digital KYC verification for individuals and corporations across major Indian metropolitan areas (Mumbai, New Delhi, Bengaluru, Hyderabad).
- **Lending Products**:
  - Home Loans from 8.50% p.a. (tenure up to 30 years)
  - Education Loans from 9.25% p.a.
  - Vehicle Loans from 9.75% p.a.
  - Personal Loans from 11.50% p.a.
- **Security Architecture**:
  - Strict ACID transaction isolation using InnoDB transactions
  - Deterministic account ID ordering to mathematically eliminate deadlocks
  - Real-time immutable audit trail logging all login and administrative activities

## Public API Endpoints
- Loan EMI Calculator: `GET /api/loan/emi/?p={principal}&r={annual_rate}&n={tenure_months}`
- Currency: Indian Rupee (INR - ₹)
- Headquarters: Nariman Point Flagship, Mumbai, Maharashtra, India (IFSC: APEX0001001)
"""
    return HttpResponse(content.strip(), content_type='text/plain; charset=utf-8')


def favicon_ico(request):
    """Serve the Atheria Reserve multi-resolution favicon.ico."""
    for s_dir in getattr(settings, 'STATICFILES_DIRS', []):
        ico_path = os.path.join(s_dir, 'img', 'favicon.ico')
        if os.path.exists(ico_path):
            with open(ico_path, 'rb') as f:
                return HttpResponse(f.read(), content_type='image/x-icon')
    ico_path = os.path.join(settings.BASE_DIR, 'static', 'img', 'favicon.ico')
    if os.path.exists(ico_path):
        with open(ico_path, 'rb') as f:
            return HttpResponse(f.read(), content_type='image/x-icon')
    return HttpResponse(b'', content_type='image/x-icon', status=200)


def apple_touch_icon(request):
    """Serve the Atheria Reserve 180x180 Apple Touch Icon."""
    for s_dir in getattr(settings, 'STATICFILES_DIRS', []):
        icon_path = os.path.join(s_dir, 'img', 'apple-touch-icon.png')
        if os.path.exists(icon_path):
            with open(icon_path, 'rb') as f:
                return HttpResponse(f.read(), content_type='image/png')
    icon_path = os.path.join(settings.BASE_DIR, 'static', 'img', 'apple-touch-icon.png')
    if os.path.exists(icon_path):
        with open(icon_path, 'rb') as f:
            return HttpResponse(f.read(), content_type='image/png')
    return HttpResponse(b'', content_type='image/png', status=200)


def security_txt(request):
    """RFC 9116 compliant security disclosure information."""
    content = """Contact: security@atheriareserve.in
Encryption: https://atheriareserve.in/pgp-key.txt
Preferred-Languages: en
Policy: https://atheriareserve.in/security-policy.html
Acknowledgments: https://atheriareserve.in/hall-of-fame.html
Expires: 2027-12-31T23:59:59.000Z
"""
    return HttpResponse(content.strip(), content_type='text/plain; charset=utf-8')
