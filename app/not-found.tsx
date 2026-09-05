import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col items-center justify-center px-6 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink text-white font-semibold text-xs mb-6">
        404
      </div>
      <h1 className="text-2xl font-semibold tracking-tight text-ink mb-2">
        Página não encontrada
      </h1>
      <p className="text-xs text-ink-muted max-w-sm mb-6">
        O endereço que você tentou acessar não existe ou foi movido.
      </p>
      <Link href="/" className="btn-pill-primary text-xs">
        Voltar ao início
      </Link>
    </div>
  );
}

