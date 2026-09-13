'use client';

import { useState, useEffect, ReactNode } from 'react';
import { createPortal } from 'react-dom';

export function PortalModal({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [portalElement, setPortalElement] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setMounted(true);
    let el = document.getElementById('kaxxa-portal-root') || document.getElementById('kaxxa-portal-container');
    if (!el) {
      el = document.createElement('div');
      el.id = 'kaxxa-portal-container';
      document.body.appendChild(el);
    }
    setPortalElement(el);

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  if (!mounted || !portalElement) return null;

  return createPortal(children, portalElement);
}


