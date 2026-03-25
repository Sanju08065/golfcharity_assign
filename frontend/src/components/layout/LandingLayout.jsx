import { useEffect } from 'react';
import { useLenis } from '../../hooks/useLenis';
import LandingNavbar from './LandingNavbar';
import Footer from './Footer';

/**
 * Wraps all public/landing pages.
 * Mounts Lenis smooth scroll for the entire page.
 * Dashboard and admin routes do NOT use this — they get native scroll.
 */
export default function LandingLayout({ children }) {
  useLenis();

  return (
    <>
      <LandingNavbar />
      <main>{children}</main>
      <Footer />
    </>
  );
}
