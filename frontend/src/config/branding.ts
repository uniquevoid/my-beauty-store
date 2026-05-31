export type NavLink = {
  label: string;
  href: string;
  external?: boolean;
};

export type FooterLegalLinkKey =
  | 'cookieNotice'
  | 'ethics'
  | 'legal'
  | 'privacyNotice';

export type FooterSocialPlatform =
  | 'instagram'
  | 'twitter'
  | 'linkedin'
  | 'facebook'
  | 'glassdoor'
  | 'youtube';

export type FooterConfig = {
  /** Override the default copyright line. Use `{year}` for the current year. */
  copyright?: string;
  /** External URLs on the customer's corporate site. Omit or leave blank to hide a link. */
  legalLinks: Partial<Record<FooterLegalLinkKey, string>>;
  /** External social profile URLs. Omit or leave blank to hide an icon. */
  socialLinks: Partial<Record<FooterSocialPlatform, string>>;
};

export type CoreValueIcon =
  | 'smile'
  | 'sparkles'
  | 'handshake'
  | 'move'
  | 'refresh-cw'
  | 'heart';

export type BrandingTypography = {
  fontFamilySans: string;
  fontFamilyHeading?: string;
  googleFontsUrl?: string;
  headingStyle?: 'uppercase' | 'normal';
};

export type BrandingTheme = {
  heroOverlay: string;
  background: string;
  text: string;
  footerBackground: string;
  footerAccentBorder?: string;
  borderRadius?: string;
  boxShadow?: string;
};

export type BrandingComponents = {
  header: { background: string; text: string; borderColor?: string };
  primaryButton: { background: string; text: string; borderRadius?: string };
  hero?: { minHeight?: string; overlayOpacity?: number };
};

export type BrandingAssets = {
  heroBackgroundImageUrl?: string;
  heroVideoUrl?: string;
  faviconUrl?: string;
};

export type BrandingSource = {
  url: string;
  extractedAt: string;
  method: 'playwright' | 'fetch-fallback';
};

export type BrandingLanguageOption = {
  code: string;
  label: string;
};

export type BrandingLanguages = {
  default: 'en';
  options: BrandingLanguageOption[];
};

export type BrandingConfig = {
  companyName: string;
  logoUrl?: string;
  logoAlt: string;
  metaDescription: string;
  colors: {
    primary: string;
    primaryForeground: string;
    mutedOnPrimary?: string;
    heroOverlay: string;
    heroTextForeground?: string;
    accent: string;
    accentForeground: string;
    highlight: string;
    navLink: string;
    background: string;
    text: string;
    footerBackground: string;
    footerAccentBorder: string;
    surface?: string;
    surfaceText?: string;
  };
  hero: {
    badgeText: string;
    headline: string;
    subheadline?: string;
    backgroundImageUrl?: string;
  };
  typography?: BrandingTypography;
  theme?: BrandingTheme;
  components?: BrandingComponents;
  assets?: BrandingAssets;
  source?: BrandingSource;
  languages?: BrandingLanguages;
  navLinks: NavLink[];
  footer: FooterConfig;
  landing: {
    sections?: {
      about?: boolean;
      customers?: boolean;
      technology?: boolean;
      coreValues?: boolean;
      lifeAt?: boolean;
      testimonials?: boolean;
      cultureSpotlight?: boolean;
      jobAlerts?: boolean;
    };
    about: {
      heading: string;
      body: string;
      stats: { value: string; label: string }[];
      ctaLabel: string;
      ctaHref?: string;
    };
    customers: {
      heading: string;
      logos: { name: string; imageUrl?: string }[];
    };
    technology: {
      heading: string;
      body: string;
      imageUrl?: string;
      ctaLabel: string;
      ctaHref?: string;
    };
    coreValues: {
      heading: string;
      values: { icon: CoreValueIcon; label: string }[];
    };
    lifeAt: {
      heading: string;
      subheading: string;
      leftImageUrl?: string;
      rightImageUrl?: string;
      ctaLabel: string;
      ctaHref?: string;
    };
    testimonials: {
      items: { quote: string; name: string; role: string; avatarUrl?: string }[];
    };
    cultureSpotlight?: {
      heading: string;
      body: string;
      ctaLabel: string;
      articleUrl: string;
      articleTitle?: string;
      imageUrl?: string;
    };
    jobAlerts: {
      headingLead: string;
      headingTrail: string;
      body: string[];
      ctaLabel: string;
      imageUrl?: string;
      background?: string;
    };
  };
};

export const branding: BrandingConfig = {
  companyName: 'Careers',
  logoAlt: 'Careers',
  metaDescription:
    'Explore open roles and apply in minutes. Upload your resume and let our assistant pre-fill your application.',
  colors: {
    primary: '#0066CC',
    primaryForeground: '#FFFFFF',
    mutedOnPrimary: 'rgba(255, 255, 255, 0.85)',
    heroOverlay:
      'linear-gradient(135deg, rgba(0, 40, 100, 0.92) 0%, rgba(0, 80, 160, 0.75) 50%, rgba(0, 102, 204, 0.4) 100%)',
    accent: '#FFD100',
    accentForeground: '#1A1A1A',
    highlight: '#E91E8C',
    navLink: '#0066CC',
    background: '#FAF7F2',
    text: '#2B2B2B',
    footerBackground: '#0B1A33',
    footerAccentBorder:
      'linear-gradient(90deg, #0066CC 0%, #7B2FBE 50%, #E91E8C 100%)',
    surface: '#F4F4F5',
    surfaceText: '#2B2B2B',
  },
  hero: {
    badgeText: "We're hiring!",
    headline: 'A global tech company that\u2019s all about people.',
    subheadline:
      'Find your next role. Search by keyword or location to explore opportunities across our teams.',
    backgroundImageUrl:
      'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1600&q=80',
  },
  navLinks: [
    { label: 'Open Positions', href: '/jobs' },
    { label: 'Life at Company', href: '/#life-at' },
    { label: 'Our Technology', href: '/#technology' },
  ],
  languages: {
    default: 'en',
    options: [
      { code: 'en', label: 'English' },
      { code: 'es', label: 'Español' },
    ],
  },
  footer: {
    copyright: 'Copyright © {year} Careers. All Rights Reserved.',
    legalLinks: {
      cookieNotice: 'https://example.com/cookie-notice',
      ethics: 'https://example.com/ethics',
      legal: 'https://example.com/legal',
      privacyNotice: 'https://example.com/privacy-notice',
    },
    socialLinks: {
      instagram: 'https://instagram.com/example',
      twitter: 'https://x.com/example',
      linkedin: 'https://linkedin.com/company/example',
      facebook: 'https://facebook.com/example',
      glassdoor: 'https://glassdoor.com/example',
      youtube: 'https://youtube.com/@example',
    },
  },
  landing: {
    about: {
      heading: 'About us',
      body: 'We build enterprise software that helps organizations manage talent and acquisition at scale. Our platform connects people with opportunities and gives teams the tools to hire with confidence.',
      stats: [
        { value: '110', label: 'Fortune 500 customers' },
        { value: '4', label: 'of the Big 4 accounting firms' },
        { value: '110', label: 'countries' },
        { value: '33', label: 'languages' },
      ],
      ctaLabel: 'Find out more',
    },
    customers: {
      heading: 'Our customers',
      logos: [
        { name: 'Accenture' },
        { name: 'Danone' },
        { name: 'Cisco' },
        { name: 'European Central Bank' },
        { name: 'Deutsche Bahn' },
        { name: 'Microsoft' },
        { name: 'Siemens' },
        { name: 'Unilever' },
        { name: 'Volkswagen' },
        { name: 'Nestlé' },
      ],
    },
    technology: {
      heading: 'Our Technology',
      body: 'Our configurable platform is built by a global engineering organization focused on reliability, security, and continuous innovation. Teams ship features that scale with the needs of the world\u2019s largest employers.',
      imageUrl:
        'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80',
      ctaLabel: 'Read more',
    },
    coreValues: {
      heading: 'Our team is...',
      values: [
        { icon: 'smile', label: 'People first' },
        { icon: 'sparkles', label: 'Free' },
        { icon: 'handshake', label: 'Collaborative' },
        { icon: 'move', label: 'Flexible' },
        { icon: 'refresh-cw', label: 'Always evolving' },
        { icon: 'heart', label: 'Engaging' },
      ],
    },
    lifeAt: {
      heading: 'Life at our company',
      subheading: 'Our team loves sharing ideas and experiences.',
      leftImageUrl:
        'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=600&q=80',
      rightImageUrl:
        'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=600&q=80',
      ctaLabel: 'Read our blog',
    },
    testimonials: {
      items: [
        {
          quote:
            'My favorite thing about working here is collaborating with people from a wide range of backgrounds, but all with a great sense of curiosity and a passion for sharing their knowledge.',
          name: 'Bárbara Engelen',
          role: 'Internal Training Manager',
        },
        {
          quote:
            'The culture here encourages you to take ownership and grow. Every project is a chance to learn something new from colleagues around the world.',
          name: 'James Chen',
          role: 'Senior Software Engineer',
        },
        {
          quote:
            'What stands out is how much the company invests in people. From day one I felt supported and challenged in equal measure.',
          name: 'Sarah Mitchell',
          role: 'Product Manager',
        },
        {
          quote:
            'I love the flexibility and trust. It lets me do my best work while staying connected with a team that genuinely cares.',
          name: 'Alex Rivera',
          role: 'Customer Success Lead',
        },
        {
          quote:
            'Working in training means I get to see people take their first steps into an environment that really lets them grow.',
          name: 'Priya Sharma',
          role: 'Learning & Development Specialist',
        },
      ],
    },
    jobAlerts: {
      headingLead: "Let's stay",
      headingTrail: 'connected',
      body: [
        'Things move pretty fast around here. New tech, new products, new ideas — and new opportunities for talented people like you.',
        "So, create a tailored job alert, and we'll let you know as soon as your dream role's ready for you.",
      ],
      ctaLabel: 'Create Job Alert',
    },
  },
};

const BRANDING_FONT_LINK_ID = 'branding-google-fonts';

export function applyBrandingCssVars(config: BrandingConfig = branding) {
  const root = document.documentElement;
  root.style.setProperty('--brand-primary', config.colors.primary);
  root.style.setProperty('--brand-primary-foreground', config.colors.primaryForeground);
  root.style.setProperty(
    '--brand-muted-on-primary',
    config.colors.mutedOnPrimary ?? 'rgba(255, 255, 255, 0.85)',
  );
  root.style.setProperty('--brand-hero-overlay', config.colors.heroOverlay);
  root.style.setProperty(
    '--brand-hero-text',
    config.colors.heroTextForeground ?? '#FFFFFF',
  );
  root.style.setProperty('--brand-accent', config.colors.accent);
  root.style.setProperty('--brand-accent-foreground', config.colors.accentForeground);
  root.style.setProperty('--brand-highlight', config.colors.highlight);
  root.style.setProperty('--brand-nav-link', config.colors.navLink);
  root.style.setProperty('--brand-background', config.colors.background);
  root.style.setProperty('--brand-text', config.colors.text);
  root.style.setProperty('--brand-footer-background', config.colors.footerBackground);
  root.style.setProperty('--brand-footer-accent-border', config.colors.footerAccentBorder);
  root.style.setProperty('--brand-surface', config.colors.surface ?? '#F4F4F5');
  root.style.setProperty('--brand-surface-text', config.colors.surfaceText ?? config.colors.text);
}

export function applyBrandingTheme(config: BrandingConfig = branding) {
  applyBrandingCssVars(config);

  const root = document.documentElement;
  const theme = config.theme;
  const typography = config.typography;
  const components = config.components;

  if (theme?.background) {
    root.style.setProperty('--brand-background', theme.background);
  }
  if (theme?.text) {
    root.style.setProperty('--brand-text', theme.text);
  }
  if (theme?.heroOverlay) {
    root.style.setProperty('--brand-hero-overlay', theme.heroOverlay);
  }
  if (theme?.footerBackground) {
    root.style.setProperty('--brand-footer-background', theme.footerBackground);
  }
  if (theme?.footerAccentBorder) {
    root.style.setProperty('--brand-footer-accent-border', theme.footerAccentBorder);
  }
  if (theme?.borderRadius) {
    root.style.setProperty('--brand-radius', theme.borderRadius);
  }

  const fontSans =
    typography?.fontFamilySans ?? 'system-ui, sans-serif';
  const fontHeading = typography?.fontFamilyHeading ?? fontSans;
  root.style.setProperty('--brand-font-sans', fontSans);
  root.style.setProperty('--brand-font-heading', fontHeading);

  const header = components?.header;
  if (header) {
    root.style.setProperty('--brand-header-bg', header.background);
    root.style.setProperty('--brand-header-text', header.text);
    if (header.borderColor) {
      root.style.setProperty('--brand-header-border', header.borderColor);
    }
  }

  const btn = components?.primaryButton;
  if (btn) {
    root.style.setProperty('--brand-btn-bg', btn.background);
    root.style.setProperty('--brand-btn-text', btn.text);
    if (btn.borderRadius) {
      root.style.setProperty('--brand-btn-radius', btn.borderRadius);
    }
  }

  if (typeof document !== 'undefined' && typography?.googleFontsUrl) {
    let link = document.getElementById(BRANDING_FONT_LINK_ID) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.id = BRANDING_FONT_LINK_ID;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
    if (link.href !== typography.googleFontsUrl) {
      link.href = typography.googleFontsUrl;
    }
  }

  if (typeof document !== 'undefined') {
    document.body.style.fontFamily = fontSans;
    document.documentElement.style.fontFamily = fontSans;
  }

  if (config.assets?.faviconUrl) {
    let favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!favicon) {
      favicon = document.createElement('link');
      favicon.rel = 'icon';
      document.head.appendChild(favicon);
    }
    favicon.href = config.assets.faviconUrl;
  }
}

export function getHeroHeadingClassName(config: BrandingConfig = branding) {
  return config.typography?.headingStyle === 'uppercase' ? 'uppercase tracking-wide' : '';
}

const footerLegalLinkLabels: Record<FooterLegalLinkKey, string> = {
  cookieNotice: 'Cookie Notice',
  ethics: 'Ethics',
  legal: 'Legal',
  privacyNotice: 'Privacy Notice',
};

export function getFooterLegalLinks(footer: FooterConfig = branding.footer) {
  return (Object.entries(footerLegalLinkLabels) as [FooterLegalLinkKey, string][])
    .map(([key, label]) => ({ key, label, href: footer.legalLinks[key] }))
    .filter((link): link is { key: FooterLegalLinkKey; label: string; href: string } =>
      Boolean(link.href),
    );
}

export function getFooterSocialLinks(footer: FooterConfig = branding.footer) {
  const order: FooterSocialPlatform[] = [
    'instagram',
    'twitter',
    'linkedin',
    'facebook',
    'glassdoor',
    'youtube',
  ];

  return order
    .map((platform) => ({ platform, href: footer.socialLinks[platform] }))
    .filter((link): link is { platform: FooterSocialPlatform; href: string } => Boolean(link.href));
}

export function getFooterCopyrightText(
  config: BrandingConfig = branding,
  year = new Date().getFullYear(),
) {
  const template =
    config.footer.copyright ??
    `Copyright © {year} ${config.companyName}. All Rights Reserved.`;

  return template.replace('{year}', String(year));
}

export function isHashNavLink(href: string) {
  return href.includes('#');
}
