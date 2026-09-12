import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rawTickers = searchParams.get('tickers');
  const rawTicker = searchParams.get('ticker');

  // Suporte a lote de tickers (Batch Query em 1 requisição única ultrarrápida)
  if (rawTickers) {
    const tickerList = rawTickers.split(',').map(t => t.trim().toUpperCase().split(' - ')[0]).filter(Boolean);
    const symbols = tickerList.map(cleanTicker => {
      if (['BTC', 'ETH', 'SOL', 'USDT', 'BNB', 'XRP', 'ADA', 'AVAX', 'LINK', 'DOGE'].includes(cleanTicker)) {
        return `${cleanTicker}-USD`;
      }
      return cleanTicker.includes('.') || cleanTicker.includes('-') ? cleanTicker : `${cleanTicker}.SA`;
    });

    try {
      const res = await fetch(`https://query1.finance.yahoo.com/v7/finance/spark?symbols=${encodeURIComponent(symbols.join(','))}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        next: { revalidate: 60 }
      });

      if (!res.ok) {
        return NextResponse.json({ quotes: {} });
      }

      const data = await res.json();
      const sparkResults = data?.spark?.result || [];
      const quotesMap: Record<string, number> = {};

      sparkResults.forEach((item: any) => {
        const sym = item.symbol || '';
        const cleanKey = sym.replace('.SA', '').replace('-USD', '');
        const meta = item.response?.[0]?.meta || {};
        let price = meta.regularMarketPrice || meta.chartPreviousClose || 0;
        if (sym.endsWith('-USD')) price = price * 5.60;
        if (price > 0) {
          quotesMap[cleanKey] = Number(price.toFixed(2));
        }
      });

      return NextResponse.json({ quotes: quotesMap });
    } catch {
      return NextResponse.json({ quotes: {} });
    }
  }

  if (!rawTicker) {
    return NextResponse.json({ error: 'Ticker não informado' }, { status: 400 });
  }

  const cleanTicker = rawTicker.trim().toUpperCase().split(' - ')[0];

  try {
    let symbol = cleanTicker;
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

