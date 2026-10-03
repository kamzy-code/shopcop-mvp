'use client';

import Link from 'next/link';
import type { CSSProperties, MouseEvent, ReactNode } from 'react';

interface CtaLinkProps {
  href: string;
  children: ReactNode;
  style?: CSSProperties;
  /** Fired before navigating — used to close the mobile menu. */
  onNavigate?: () => void;
}

/**
 * CTA link that always behaves.
 *
 * `next/link` is the wrong tool for an in-page anchor: once the URL already
 * ends in the same hash, the router sees no navigation and silently does
 * nothing, so the second click never scrolls. A plain anchor plus an explicit
 * scroll keeps working no matter how many times it is clicked, and survives a
 * refresh because the hash stays in the URL.
 *
 * Non-hash hrefs still go through `next/link` for client-side routing.
 */
export function CtaLink({ href, children, style, onNavigate }: CtaLinkProps) {
  const isHash = href.startsWith('#');

  function handleClick(e: MouseEvent<HTMLAnchorElement>) {
    onNavigate?.();

    if (!isHash) return;

    const target = document.querySelector(href);
    if (!target) return;

    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    // replaceState rather than pushState so repeated clicks don't stack up
    // history entries that the back button has to be pressed through.
    window.history.replaceState(null, '', href);
  }

  if (!isHash) {
    return (
      <Link href={href} style={style} onClick={handleClick}>
        {children}
      </Link>
    );
  }

  return (
    <a href={href} style={style} onClick={handleClick}>
      {children}
    </a>
  );
}