import { useEffect } from 'react';

import { createPortal } from 'react-dom';

import { Link } from 'react-router-dom';

import type { NavLink } from '../config/branding';

import { branding as defaultBranding } from '../config/branding';

import { useBranding } from '../contexts/BrandingContext';

import NavLinkItem from './NavLinkItem';

import LanguageSwitcher from './LanguageSwitcher';



type MobileNavProps = {

  open: boolean;

  onClose: () => void;

  navLinks?: NavLink[];

  isLoggedIn?: boolean;

  onSignOut?: () => void;

};



export default function MobileNav({

  open,

  onClose,

  navLinks,

  isLoggedIn = false,

  onSignOut,

}: MobileNavProps) {

  const { branding } = useBranding();

  const links = navLinks ?? branding.navLinks ?? defaultBranding.navLinks;



  useEffect(() => {

    if (!open) return;



    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = 'hidden';



    function onKeyDown(event: KeyboardEvent) {

      if (event.key === 'Escape') onClose();

    }

    document.addEventListener('keydown', onKeyDown);



    return () => {

      document.body.style.overflow = previousOverflow;

      document.removeEventListener('keydown', onKeyDown);

    };

  }, [open, onClose]);



  if (!open) return null;



  return createPortal(

    <div className="md:hidden fixed inset-0 z-50">

      <button

        type="button"

        className="absolute inset-0 bg-black/40"

        aria-label="Close menu"

        onClick={onClose}

      />

      <nav

        className="absolute top-0 right-0 h-full w-72 max-w-[85vw] bg-white shadow-xl flex flex-col"

        aria-label="Mobile navigation"

      >

        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">

          <span className="min-w-0 pr-2 text-lg font-semibold text-charcoal">{branding.companyName}</span>

          <button

            type="button"

            onClick={onClose}

            className="shrink-0 p-2 text-gray-500 hover:text-charcoal"

            aria-label="Close menu"

          >

            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>

              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />

            </svg>

          </button>

        </div>



        <ul className="flex-1 overflow-y-auto px-5 py-4 space-y-1">

          {links.map((link) => (

            <li key={link.label}>

              <NavLinkItem

                link={link}

                className="block py-3 text-sm font-medium text-brand-text hover:opacity-80"

                onClick={onClose}

              />

            </li>

          ))}

        </ul>



        <div className="px-5 py-4 border-t border-gray-100 space-y-2">

          <LanguageSwitcher variant="mobile" />

          {isLoggedIn ? (

            <>

              <Link

                to="/candidate"

                className="block w-full text-center rounded-full bg-brand-primary text-brand-primary-foreground px-4 py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity"

                onClick={onClose}

              >

                My profile

              </Link>

              <button

                type="button"

                className="block w-full text-center rounded-full border border-gray-200 px-4 py-2.5 text-sm font-semibold text-charcoal hover:border-gray-300 transition-colors"

                onClick={() => {

                  onClose();

                  onSignOut?.();

                }}

              >

                Log out

              </button>

            </>

          ) : (

            <Link

              to="/login"

              className="block w-full text-center rounded-full bg-brand-primary text-brand-primary-foreground px-4 py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity"

              onClick={onClose}

            >

              Log in

            </Link>

          )}

        </div>

      </nav>

    </div>,

    document.body,

  );

}


