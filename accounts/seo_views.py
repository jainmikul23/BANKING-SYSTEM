from django.http import HttpResponse
from django.utils import timezone

def sitemap_xml(request):
    """Generate dynamic XML sitemap conforming to sitemaps.org protocol."""
    now_str = timezone.now().strftime('%Y-%m-%d')
    base_url = request.build_absolute_uri('/').rstrip('/')

    xml_content = f"""<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>{base_url}/</loc>
    <lastmod>{now_str}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>{base_url}/accounts/login/</loc>
    <lastmod>{now_str}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>{base_url}/accounts/register/</loc>
    <lastmod>{now_str}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>"""

    return HttpResponse(xml_content, content_type='application/xml')


def robots_txt(request):
    """Serve standard robots.txt prohibiting indexing of authenticated financial routes."""
    base_url = request.build_absolute_uri('/').rstrip('/')
    content = f"""User-agent: *
Allow: /
Allow: /accounts/login/
Allow: /accounts/register/
Allow: /static/
Disallow: /portal-admin/
Disallow: /banking/
Disallow: /loans/
Disallow: /api/
Disallow: /django-admin/

Sitemap: {base_url}/sitemap.xml
"""
    return HttpResponse(content, content_type='text/plain')


def security_txt(request):
    """RFC 9116 compliant security disclosure information."""
    content = """Contact: security@apexbank.in
Encryption: https://apexbank.in/pgp-key.txt
Preferred-Languages: en
Policy: https://apexbank.in/security-policy.html
Acknowledgments: https://apexbank.in/hall-of-fame.html
Expires: 2027-12-31T23:59:59.000Z
"""
    return HttpResponse(content, content_type='text/plain')

