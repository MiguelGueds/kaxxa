'use server';

export async function getQuote(ticker: string) {
  try {
    // Add .SA for Brazilian stocks if not present
    const formattedTicker = ticker.toUpperCase().endsWith('.SA') 
      ? ticker.toUpperCase() 
      : `${ticker.toUpperCase()}.SA`;

    const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${formattedTicker}?interval=1d&range=1d`, {
      cache: 'no-store'
    });

    if (!res.ok) {
      return { error: 'Ticker não encontrado ou erro na API.' };
    }

    const data = await res.json();
    const result = data.chart.result?.[0];

    if (!result) return { error: 'Dados não encontrados.' };

    const meta = result.meta;
    const currentPrice = meta.regularMarketPrice;
    const previousClose = meta.previousClose;
    
    return {
      ticker: ticker.toUpperCase(),
      currentPrice,
      previousClose,
      changePercent: ((currentPrice - previousClose) / previousClose) * 100,
      currency: meta.currency,
      shortName: meta.chartPreviousClose ? meta.symbol : ticker.toUpperCase(),
    };
  } catch (error) {
    return { error: 'Erro ao buscar dados.' };
  }
}

