export const TICKER_UNIVERSE = [
  // Mega-cap tech
  'AAPL', 'MSFT', 'NVDA', 'GOOGL', 'AMZN', 'META', 'TSLA', 'AVGO',
  // Large-cap tech / semis / software
  'CRM', 'AMD', 'NFLX', 'ADBE', 'CSCO', 'INTC', 'INTU', 'QCOM', 'IBM', 'TXN', 'NOW',
  'ORCL', 'ACN', 'AMAT', 'MU', 'ADI', 'MRVL', 'LRCX', 'KLAC', 'ASML', 'TSM', 'ARM',
  'SMCI', 'DELL',
  // Financials
  'JPM', 'V', 'MA', 'BAC', 'WFC', 'GS', 'MS', 'C', 'AXP', 'BLK', 'SCHW', 'USB',
  'PNC', 'BK', 'COF', 'MET', 'PRU', 'AIG', 'ALL', 'BRK-B',
  // Healthcare
  'LLY', 'UNH', 'JNJ', 'MRK', 'ABBV', 'TMO', 'ABT', 'AMGN', 'PFE',
  'BMY', 'GILD', 'CVS', 'MDT', 'DHR', 'ELV', 'SYK', 'ISRG', 'REGN', 'VRTX',
  // Consumer
  'PG', 'HD', 'COST', 'KO', 'PEP', 'WMT', 'MCD', 'DIS',
  'NKE', 'SBUX', 'LOW', 'TGT', 'TJX', 'BKNG', 'CMG', 'MDLZ', 'MO', 'PM', 'EL',
  // Industrials
  'CAT', 'BA', 'RTX', 'GE', 'HON', 'LMT', 'NOC', 'GD', 'UPS', 'FDX', 'DE', 'MMM',
  // Energy
  'XOM', 'CVX', 'COP', 'SLB', 'OXY', 'EOG', 'MPC',
  // Materials / utilities
  'LIN', 'DUK', 'SO', 'NEE', 'AEP', 'EXC',
  // Comms / media
  'T', 'VZ', 'CMCSA', 'TMUS', 'CHTR', 'WBD', 'PARA', 'SPOT',
  // Auto / EV
  'F', 'GM', 'NIO', 'RIVN', 'LCID', 'LI', 'XPEV',
  // ETFs (popular retail)
  'SPY', 'QQQ',
  // Meme / fintech / popular retail
  'GME', 'AMC', 'PLTR', 'HOOD', 'SOFI', 'UBER', 'RBLX', 'SNOW', 'COIN', 'SHOP',
  'SQ', 'ROKU', 'DKNG', 'ZM', 'PENN', 'PYPL', 'BABA', 'AFRM', 'CVNA', 'MARA',
  'RIOT', 'U', 'DASH', 'ABNB', 'ETSY', 'PINS', 'SNAP', 'LYFT', 'EBAY', 'JD', 'PDD'
];

export function getNextTicker(exclude: string[] = []): string | null {
  const excludeSet = new Set(exclude.map(s => s.toUpperCase()));
  const available = TICKER_UNIVERSE.filter(ticker => !excludeSet.has(ticker));
  
  if (available.length === 0) return null;
  
  // Return a random available ticker
  return available[Math.floor(Math.random() * available.length)];
}
