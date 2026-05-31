/** Shared prospect branding contract (stored in tenants.branding_json). */



export type BrandingSourceMethod = 'playwright' | 'fetch-fallback';



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

  /** Raster marketing photos harvested from the corporate site (extraction only). */
  marketingPhotoUrls?: string[];

};



export type BrandingSource = {

  url: string;

  extractedAt: string;

  method: BrandingSourceMethod;

};



export type LandingSectionKey =

  | 'about'

  | 'customers'

  | 'technology'

  | 'coreValues'

  | 'lifeAt'

  | 'testimonials'

  | 'cultureSpotlight'

  | 'jobAlerts';



export type LandingSectionsMap = Partial<Record<LandingSectionKey, boolean>>;



export type LandingAbout = {

  heading: string;

  body: string;

  stats: { value: string; label: string }[];

  ctaLabel: string;

  ctaHref?: string;

};



export type LandingCustomers = {

  heading: string;

  logos: { name: string; imageUrl?: string }[];

};



export type LandingTechnology = {

  heading: string;

  body: string;

  imageUrl?: string;

  ctaLabel: string;

  ctaHref?: string;

};



export type LandingCoreValues = {

  heading: string;

  values: { icon: string; label: string }[];

};



export type LandingLifeAt = {

  heading: string;

  subheading: string;

  leftImageUrl?: string;

  rightImageUrl?: string;

  ctaLabel: string;

  ctaHref?: string;

};



export type LandingTestimonials = {

  items: { quote: string; name: string; role: string; avatarUrl?: string }[];

};



export type LandingJobAlerts = {

  headingLead: string;

  headingTrail: string;

  body: string[];

  ctaLabel: string;

  imageUrl?: string;

  background?: string;

};



export type LandingCultureSpotlight = {

  heading: string;

  body: string;

  ctaLabel: string;

  articleUrl: string;

  articleTitle?: string;

  imageUrl?: string;

};



export type ProspectLanding = {

  sections?: LandingSectionsMap;

  about?: LandingAbout;

  customers?: LandingCustomers;

  technology?: LandingTechnology;

  coreValues?: LandingCoreValues;

  lifeAt?: LandingLifeAt;

  testimonials?: LandingTestimonials;

  cultureSpotlight?: LandingCultureSpotlight;

  jobAlerts?: LandingJobAlerts;

};



export type ProspectBrandingJson = {

  companyName: string;

  logoUrl?: string;

  logoAlt: string;

  metaDescription: string;

  colors: {

    primary: string;

    primaryForeground: string;

    mutedOnPrimary?: string;

    heroOverlay?: string;

    heroTextForeground?: string;

    accent: string;

    accentForeground: string;

    highlight?: string;

    navLink: string;

    background?: string;

    text?: string;

    footerBackground?: string;

    footerAccentBorder?: string;

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

  landing?: ProspectLanding;

  navLinks?: { label: string; href: string; external?: boolean }[];

  footer?: {
    copyright?: string;
    legalLinks?: Partial<Record<'cookieNotice' | 'ethics' | 'legal' | 'privacyNotice', string>>;
    socialLinks?: Partial<
      Record<'instagram' | 'twitter' | 'linkedin' | 'facebook' | 'glassdoor' | 'youtube', string>
    >;
  };

  languages?: {
    default: 'en';
    options: { code: string; label: string }[];
  };

  [key: string]: unknown;

};



export const DEFAULT_UNSPLASH_HERO =

  'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1600&q=80';



export const GENERIC_CAREERS_HEADLINE =

  'A global tech company that\u2019s all about people.';



export const GENERIC_HERO_HEADLINE_PREFIX = 'Build your career at';



export const PROSPECT_EXTRACTION_METHODS: BrandingSourceMethod[] = ['playwright', 'fetch-fallback'];

