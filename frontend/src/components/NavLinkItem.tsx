import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import type { NavLink } from '../config/branding';
import { isHashNavLink } from '../config/branding';

type NavLinkItemProps = {
  link: NavLink;
  className: string;
  style?: CSSProperties;
  onClick?: () => void;
};

export default function NavLinkItem({ link, className, style, onClick }: NavLinkItemProps) {
  if (link.external) {
    return (
      <a
        href={link.href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        style={style}
        onClick={onClick}
      >
        {link.label}
      </a>
    );
  }

  if (isHashNavLink(link.href)) {
    return (
      <a href={link.href} className={className} style={style} onClick={onClick}>
        {link.label}
      </a>
    );
  }

  return (
    <Link to={link.href} className={className} style={style} onClick={onClick}>
      {link.label}
    </Link>
  );
}
