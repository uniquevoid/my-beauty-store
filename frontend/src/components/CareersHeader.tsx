import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { useCandidateAuth } from '../auth/useCandidateAuth';
import { useBranding } from '../contexts/BrandingContext';
import MobileNav from './MobileNav';
import LanguageSwitcher from './LanguageSwitcher';
import NavLinkItem from './NavLinkItem';

export default function CareersHeader() {
  const { branding } = useBranding();
  const navigate = useNavigate();
  const { isLoggedIn, signOut } = useCandidateAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  function handleSignOut() {
    signOut();
    navigate('/');
  }

  return (
    <header
      className="border-b"
      style={{
        backgroundColor: 'var(--brand-header-bg, #ffffff)',
        color: 'var(--brand-header-text, #2b2b2b)',
        borderColor: 'var(--brand-header-border, #f3f4f6)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0" aria-label={`${branding.companyName} home`}>
            {branding.logoUrl ? (
              <img src={branding.logoUrl} alt={branding.logoAlt} className="h-8 md:h-9 w-auto" />
            ) : (
              <span className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-sm bg-brand-primary text-brand-primary-foreground text-xs font-bold">
                  {branding.companyName.charAt(0).toUpperCase()}
                </span>
                <span
                  className="text-xl md:text-2xl font-semibold lowercase tracking-tight"
                  style={{ color: 'var(--brand-header-text, #2b2b2b)' }}
                >
                  {branding.companyName}
                </span>
              </span>
            )}
          </Link>

          {/* Desktop nav links */}
          <nav className="hidden md:flex items-center gap-8" aria-label="Main navigation">
            {branding.navLinks.map((link) => (
              <NavLinkItem
                key={link.label}
                link={link}
                className="text-sm font-medium hover:opacity-80 transition-opacity"
                style={{ color: 'var(--brand-header-text, var(--brand-nav-link))' }}
              />
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-3 md:gap-4">
            <button
              type="button"
              className="md:hidden p-2 hover:opacity-80 transition-opacity"
              style={{ color: 'var(--brand-header-text, #2b2b2b)' }}
              aria-label="Open menu"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>

            <LanguageSwitcher />

            <span className="hidden md:block w-px h-6 bg-gray-200" aria-hidden="true" />

            {isLoggedIn ? (
              <div className="hidden md:flex items-center gap-4">
                <Link
                  to="/candidate"
                  className="text-sm font-medium text-brand-nav-link hover:opacity-80 transition-opacity"
                >
                  My profile
                </Link>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="text-sm font-medium opacity-70 hover:opacity-100 transition-opacity"
                  style={{ color: 'var(--brand-header-text, #2b2b2b)' }}
                >
                  Log out
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="hidden md:inline-flex items-center justify-center px-5 py-2 text-sm font-semibold hover:opacity-90 transition-opacity"
                style={{
                  backgroundColor: 'var(--brand-btn-bg, var(--brand-primary))',
                  color: 'var(--brand-btn-text, var(--brand-primary-foreground))',
                  borderRadius: 'var(--brand-btn-radius, 9999px)',
                }}
              >
                Log in
              </Link>
            )}
          </div>
        </div>
      </div>

      <MobileNav
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        isLoggedIn={isLoggedIn}
        onSignOut={handleSignOut}
      />
    </header>
  );
}
