import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://royalblue-parrot-186916.hostingersite.com';
  const now = new Date();

  return [
    '',
    '/about-us',
    '/contact-us',
    '/faq',
    '/privacy-policy',
    '/terms-and-conditions',
    '/cookie-policy',
    '/disclaimer',
    '/account-settings',
    '/delete-account-data-request',
    '/support-help-center',
    '/404',
  ].map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: path === '' ? 1 : 0.7,
  }));
}
