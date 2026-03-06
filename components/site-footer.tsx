import Link from 'next/link';

const footerLinks = [
  { href: '/about', label: 'About Us' },
  { href: '/contact', label: 'Contact Us' },
  { href: '/faq', label: 'FAQ' },
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/terms', label: 'Terms & Conditions' },
  { href: '/cookies', label: 'Cookie Policy' },
  { href: '/disclaimer', label: 'Disclaimer' },
  { href: '/account', label: 'Account Settings' },
  { href: '/delete-account', label: 'Delete Account / Data Request' },
  { href: '/support', label: 'Support / Help Center' },
  { href: '/404', label: '404 Page' },
  { href: '/sitemap.xml', label: 'Sitemap' },
];

export default function SiteFooter() {
  return (
    <footer className="mt-8 border-t border-border bg-card/40">
      <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-3 sm:text-sm lg:grid-cols-4">
          {footerLinks.map((link) => (
            <Link key={link.href} href={link.href} className="underline underline-offset-4">
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
