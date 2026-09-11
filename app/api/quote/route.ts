import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rawTicker = searchParams.get('ticker');

  if (!rawTicker) {
    return NextResponse.json({ error: 'Ticker não informado' }, { status: 400 });
  }

  const cleanTicker = rawTicker.trim().toUpperCase().split(' - ')[0];

  try {
    let symbol = cleanTicker;
    // Se não tiver sufixo e não for cripto conhecida, insere .SA para B3
    if (!symbol.includes('.') && !symbol.includes('-')) {
      if (['BTC', 'ETH', 'SOL', 'USDT', 'BNB', 'XRP', 'ADA', 'AVAX', 'LINK', 'DOGE'].includes(cleanTicker)) {
        symbol = `${cleanTicker}-USD`;
      } else {
        symbol = `${cleanTicker}.SA`;
      }
    }

    const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      next: { revalidate: 60 }
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Ativo não encontrado' }, { status: 404 });
    }

    const data = await res.json();
    const result = data?.chart?.result?.[0];

    if (!result) {
      return NextResponse.json({ error: 'Dados indisponíveis' }, { status: 404 });
    }

    const meta = result.meta || {};
    let price = meta.regularMarketPrice || meta.chartPreviousClose || 0;

    // Se for cripto em USD, converte aproximado para BRL se necessário
    if (symbol.endsWith('-USD')) {
      price = price * 5.60;
    }

    const previousClose = meta.chartPreviousClose || price;
    const change = price - previousClose;
    const changePercent = previousClose > 0 ? (change / previousClose) * 100 : 0;
    const name = meta.shortName || meta.longName || cleanTicker;

    return NextResponse.json({
      ticker: cleanTicker,
      name,
      price: Number(price.toFixed(2)),
      previousClose: Number(previousClose.toFixed(2)),
      change: Number(change.toFixed(2)),
      changePercent: Number(changePercent.toFixed(2)),
      currency: 'BRL'
    });
  } catch (error) {
    console.error('Erro ao buscar cotação:', error);
    return NextResponse.json({ error: 'Falha ao consultar cotação de mercado' }, { status: 500 });
  }
}

