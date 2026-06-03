import { getPermalink } from './utils/permalinks';

export const headerData = {
  links: [
    { text: 'About', href: getPermalink('/about') },
    { text: 'FAQ', href: getPermalink('/faq') },
  ],
  actions: [
    {
      text: 'Access My Lessons',
      href: getPermalink('/lessons'),
      variant: 'secondary',
    },
    {
      text: 'Get the Pack',
      href: '#buy',
      variant: 'primary',
    },
  ],
};

export const footerData = {
  links: [
    {
      title: 'Product',
      links: [
        { text: 'About', href: getPermalink('/about') },
        { text: 'FAQ', href: getPermalink('/faq') },
        { text: 'Go Pro / VIP', href: getPermalink('/upgrade') },
      ],
    },
    {
      title: 'Help',
      links: [
        { text: 'Support', href: getPermalink('/support') },
        { text: 'Privacy Policy', href: getPermalink('/privacy') },
        { text: 'Terms', href: getPermalink('/terms') },
      ],
    },
  ],
  secondaryLinks: [
    { text: 'Privacy Policy', href: getPermalink('/privacy') },
    { text: 'Terms', href: getPermalink('/terms') },
  ],
  socialLinks: [
    { ariaLabel: 'TikTok', icon: 'tabler:brand-tiktok', href: '#' },
    { ariaLabel: 'Instagram', icon: 'tabler:brand-instagram', href: '#' },
  ],
  footNote: `© ${new Date().getFullYear()} AI Hustle Starter Pack. All rights reserved.`,
};
