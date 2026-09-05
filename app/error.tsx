'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col items-center justify-center px-6 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-expense text-white font-semibold text-xs mb-6">
        !
      </div>
      <h1 className="text-2xl font-semibold tracking-tight text-ink mb-2">
        Algo inesperado aconteceu
      </h1>
      <p className="text-xs text-ink-muted max-w-sm mb-6">
        {error?.message || 'Ocorreu um erro ao carregar esta página.'}
      </p>
      <div className="flex items-center gap-3">
        <button onClick={() => reset()} className="btn-pill-primary text-xs">
          Tentar novamente
        </button>
        <Link href="/" className="btn-pill-secondary text-xs">
          Ir para o início
        </Link>
      </div>
    </div>
  );
}

