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
</urlset>"""

    return HttpResponse(xml_content.strip(), content_type='application/xml; charset=utf-8')


def robots_txt(request):
    """Serve standard robots.txt with search crawler directives and sitemap declarations."""
    content = """User-agent: *
Allow: /
Allow: /accounts/login/
Allow: /accounts/register/
Allow: /static/
Disallow: /portal-admin/
Disallow: /banking/
Disallow: /loans/
Disallow: /api/
Disallow: /django-admin/

User-agent: Googlebot
Allow: /
Allow: /accounts/login/
Allow: /accounts/register/
Allow: /static/

Sitemap: https://atheria-reserve.vercel.app/sitemap.xml
Sitemap: https://banking-system-1-0ae4.onrender.com/sitemap.xml
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
