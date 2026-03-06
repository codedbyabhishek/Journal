'use client';

import { useState, useMemo } from 'react';
import { useTrades } from '@/lib/trade-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trade } from '@/lib/types';
import { Trash2, Eye, Filter } from 'lucide-react';
import { CURRENCY_SYMBOLS, getTradeOutcome } from '@/lib/trade-utils';
import { ScreenshotViewer } from './screenshot-viewer';

export default function TradeLog() {
  const { trades, deleteTrade } = useTrades();
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [sortBy, setSortBy] = useState<'date' | 'pnl'>('date');
  const [filterSetup, setFilterSetup] = useState('All');

  const setupNames = useMemo(() => {
    return ['All', ...new Set(trades.map(t => t.setupName))];
  }, [trades]);

  const filteredAndSortedTrades = useMemo(() => {
    let filtered = filterSetup === 'All' ? trades : trades.filter(t => t.setupName === filterSetup);

    return filtered.sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      } else {
        return b.pnl - a.pnl;
      }
    });
  }, [trades, sortBy, filterSetup]);

  return (
    <div className="w-full flex flex-col gap-3 sm:gap-4 lg:gap-6 p-2 sm:p-4 lg:p-6 min-w-0">
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">Trade Log</h1>
        <p className="text-xs sm:text-sm lg:text-base text-muted-foreground">View and manage all your trades</p>
      </div>

      {/* Filters and Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <Filter className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <select
            value={filterSetup}
            onChange={e => setFilterSetup(e.target.value)}
            className="flex-1 px-3 py-2 bg-secondary border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {setupNames.map(setup => (
              <option key={setup} value={setup}>
                {setup}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm text-muted-foreground flex-shrink-0">Sort:</span>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as 'date' | 'pnl')}
            className="flex-1 px-3 py-2 bg-secondary border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="date">Date (Newest)</option>
            <option value="pnl">P&L (Highest)</option>
          </select>
        </div>

        <span className="text-sm text-muted-foreground">{filteredAndSortedTrades.length} trades</span>
      </div>

      {/* Table/Cards */}
      {filteredAndSortedTrades.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="p-8 sm:p-12 text-center">
            <p className="text-muted-foreground">No trades found. Add your first trade to get started!</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden lg:block w-full min-w-0">
            <Card className="bg-card border-border overflow-hidden">
              <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[1100px] border-collapse">
                <thead>
                  <tr className="border-b border-border bg-secondary">
                    <th className="text-left px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-foreground whitespace-nowrap">Date</th>
                    <th className="text-left px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-foreground whitespace-nowrap">Day</th>
                    <th className="text-left px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-foreground whitespace-nowrap">Symbol</th>
                    <th className="text-left px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-foreground whitespace-nowrap">Setup</th>
                    <th className="text-left px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-foreground whitespace-nowrap">Pos</th>
                    <th className="text-right px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-foreground whitespace-nowrap">Entry</th>
                    <th className="text-right px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-foreground whitespace-nowrap">Exit</th>
                    <th className="text-right px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-foreground whitespace-nowrap">Net P&L</th>
                    <th className="text-right px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-foreground whitespace-nowrap">R</th>
                    <th className="text-center px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-foreground whitespace-nowrap">W/L</th>
                    <th className="text-center px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-foreground whitespace-nowrap">Conf</th>
                    <th className="text-center px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-foreground whitespace-nowrap">Act</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedTrades.map(trade => (
                    <tr key={trade.id} className="border-b border-border hover:bg-secondary transition-colors">
                      <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-xs sm:text-sm text-foreground">{trade.date}</td>
                      <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-xs sm:text-sm text-muted-foreground">{trade.dayOfWeek.slice(0, 3)}</td>
                      <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium text-foreground whitespace-nowrap">{trade.symbol}</td>
                      <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-xs sm:text-sm text-foreground max-w-[220px] truncate" title={trade.setupName}>{trade.setupName}</td>
                      <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-xs sm:text-sm">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${trade.position === 'Buy' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                          {trade.position === 'Buy' ? 'B' : 'S'}
                        </span>
                      </td>
                      <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-xs sm:text-sm text-right text-foreground">{trade.entryPrice ? `${CURRENCY_SYMBOLS[trade.currency] || '$'}${trade.entryPrice.toFixed(2)}` : 'N/A'}</td>
                      <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-xs sm:text-sm text-right text-foreground">{trade.exitPrice ? `${CURRENCY_SYMBOLS[trade.currency] || '$'}${trade.exitPrice.toFixed(2)}` : 'N/A'}</td>
                      <td className={`px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-xs sm:text-sm text-right font-semibold ${trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {CURRENCY_SYMBOLS[trade.currency] || '$'}{trade.pnl.toFixed(2)}
                      </td>
                      <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-xs sm:text-sm text-right text-foreground">{trade.rFactor.toFixed(2)}R</td>
                      <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-center">
                        {/* W/L derived from P&L, not deprecated isWin field */}
                        <span className={`text-xs font-semibold ${
                          getTradeOutcome(trade.pnl) === 'W' ? 'text-green-400' : 
                          getTradeOutcome(trade.pnl) === 'L' ? 'text-red-400' : 
                          'text-yellow-400'
                        }`}>
                          {getTradeOutcome(trade.pnl)}
                        </span>
                      </td>
                      <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-center text-xs sm:text-sm text-foreground">{trade.confidence}</td>
                      <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-center">
                        <div className="flex items-center justify-center gap-1 sm:gap-2">
                          <button onClick={() => setSelectedTrade(trade)} className="text-primary hover:text-primary/80 transition-colors p-1" title="View">
                            <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </button>
                          <button onClick={() => deleteTrade(trade.id)} className="text-red-400 hover:text-red-300 transition-colors p-1" title="Delete">
                            <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </Card>
          </div>

          {/* Mobile & Tablet Card View */}
          <div className="lg:hidden space-y-2 sm:space-y-3">
            {filteredAndSortedTrades.map(trade => (
              <Card key={trade.id} className="bg-card border-border">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-bold text-foreground text-lg">{trade.symbol}</p>
                      <p className="text-xs text-muted-foreground">{trade.date}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-semibold flex-shrink-0 ${trade.position === 'Buy' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {trade.position}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm min-w-0">
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Entry</p>
                      <p className="font-semibold text-foreground truncate">{trade.entryPrice ? `${CURRENCY_SYMBOLS[trade.currency] || '$'}${trade.entryPrice.toFixed(2)}` : 'N/A'}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Exit</p>
                      <p className="font-semibold text-foreground truncate">{trade.exitPrice ? `${CURRENCY_SYMBOLS[trade.currency] || '$'}${trade.exitPrice.toFixed(2)}` : 'N/A'}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Setup</p>
                      <p className="font-semibold text-foreground text-xs truncate" title={trade.setupName}>{trade.setupName}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Confidence</p>
                      <p className="font-semibold text-foreground">{trade.confidence}/10</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-border min-w-0">
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Net P&L ({trade.currency || 'USD'})</p>
                      <p className={`font-bold text-sm truncate ${trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {CURRENCY_SYMBOLS[trade.currency] || '$'}{trade.pnl.toFixed(2)}
                      </p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">R-Factor</p>
                      <p className="font-bold text-sm text-primary">{trade.rFactor.toFixed(2)}R</p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Result</p>
                      {/* W/L derived from P&L */}
                      <p className={`font-bold text-sm ${
                        getTradeOutcome(trade.pnl) === 'W' ? 'text-green-400' : 
                        getTradeOutcome(trade.pnl) === 'L' ? 'text-red-400' : 
                        'text-yellow-400'
                      }`}>
                        {getTradeOutcome(trade.pnl) === 'W' ? 'Win' : 
                         getTradeOutcome(trade.pnl) === 'L' ? 'Loss' : 
                         'Break-Even'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-2 pt-2 border-t border-border">
                    <button onClick={() => setSelectedTrade(trade)} className="flex-1 flex items-center justify-center gap-1 text-primary hover:text-primary/80 transition-colors py-2">
                      <Eye className="w-4 h-4" />
                      <span className="text-xs font-medium">Details</span>
                    </button>
                    <button onClick={() => deleteTrade(trade.id)} className="flex-1 flex items-center justify-center gap-1 text-red-400 hover:text-red-300 transition-colors py-2">
                      <Trash2 className="w-4 h-4" />
                      <span className="text-xs font-medium">Delete</span>
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Detail Modal - Accessible overlay with proper focus management */}
      {selectedTrade && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-2 sm:p-4 z-50 overflow-auto"
          onClick={() => setSelectedTrade(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="trade-detail-title"
        >
          {/* Modal content with proper overflow handling */}
          <Card
            className="bg-card border-border w-full max-w-2xl max-h-[95vh] overflow-hidden flex flex-col my-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Sticky header with close button */}
            <CardHeader className="sticky top-0 bg-card border-b border-border p-3 sm:p-4 lg:p-6 flex-shrink-0">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <CardTitle id="trade-detail-title" className="text-lg sm:text-xl lg:text-2xl break-words">
                    {selectedTrade.symbol} - {selectedTrade.tradeType}
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm mt-1">{selectedTrade.date}</CardDescription>
                </div>
                {/* Accessible close button */}
                <button
                  onClick={() => setSelectedTrade(null)}
                  className="flex-shrink-0 p-1 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-primary"
                  aria-label="Close trade details"
                  type="button"
                >
                  <span className="text-xl leading-none">✕</span>
                </button>
              </div>
            </CardHeader>
            {/* Scrollable content area */}
            <CardContent className="flex-1 overflow-y-auto space-y-4 sm:space-y-6 p-3 sm:p-4 lg:p-6">
              {/* Trade Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Position</p>
                  <p className={`text-lg font-bold ${selectedTrade.position === 'Buy' ? 'text-green-400' : 'text-red-400'}`}>{selectedTrade.position}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Setup Name</p>
                  <p className="text-lg font-bold text-foreground">{selectedTrade.setupName}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Time Frame</p>
                  <p className="text-lg font-bold text-foreground">{selectedTrade.timeFrame || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Limit (Fibonacci)</p>
                  <p className="text-lg font-bold text-foreground">{selectedTrade.limit || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Exit (Fibonacci)</p>
                  <p className="text-lg font-bold text-foreground">{selectedTrade.exit || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Currency</p>
                  <p className="text-lg font-bold text-foreground">{selectedTrade.currency || 'USD'} ({CURRENCY_SYMBOLS[selectedTrade.currency] || '$'})</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Entry Price</p>
                  <p className="text-lg font-bold text-foreground">{selectedTrade.entryPrice ? `${CURRENCY_SYMBOLS[selectedTrade.currency] || '$'}${selectedTrade.entryPrice.toFixed(2)}` : 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Exit Price</p>
                  <p className="text-lg font-bold text-foreground">{selectedTrade.exitPrice ? `${CURRENCY_SYMBOLS[selectedTrade.currency] || '$'}${selectedTrade.exitPrice.toFixed(2)}` : 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Stop Loss</p>
                  <p className="text-lg font-bold text-foreground">{CURRENCY_SYMBOLS[selectedTrade.currency] || '$'}{selectedTrade.stopLoss.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Quantity</p>
                  <p className="text-lg font-bold text-foreground">{selectedTrade.quantity}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Fees</p>
                  <p className="text-lg font-bold text-foreground">{CURRENCY_SYMBOLS[selectedTrade.currency] || '$'}{selectedTrade.fees.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Confidence</p>
                  <p className="text-lg font-bold text-foreground">{selectedTrade.confidence}/10</p>
                </div>
              </div>

              {/* Results - shows currency and auto-derived outcome */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-secondary rounded-lg border border-border">
                <div>
                  <p className="text-xs text-muted-foreground">Net P&L ({selectedTrade.currency || 'USD'})</p>
                  <p className={`text-2xl font-bold ${selectedTrade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {CURRENCY_SYMBOLS[selectedTrade.currency] || '$'}{selectedTrade.pnl.toFixed(2)}
                  </p>
                  {selectedTrade.fees > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Gross: <span className={(selectedTrade.pnl + selectedTrade.fees) >= 0 ? 'text-green-400' : 'text-red-400'}>{CURRENCY_SYMBOLS[selectedTrade.currency] || '$'}{(selectedTrade.pnl + selectedTrade.fees).toFixed(2)}</span>
                      {' '} | Charges: <span className="text-orange-400">-{CURRENCY_SYMBOLS[selectedTrade.currency] || '$'}{selectedTrade.fees.toFixed(2)}</span>
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">R-Factor</p>
                  <p className="text-2xl font-bold text-primary">{selectedTrade.rFactor.toFixed(2)}R</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Outcome (Auto)</p>
                  <p className={`text-2xl font-bold ${
                    getTradeOutcome(selectedTrade.pnl) === 'W' ? 'text-green-400' : 
                    getTradeOutcome(selectedTrade.pnl) === 'L' ? 'text-red-400' : 
                    'text-yellow-400'
                  }`}>
                    {getTradeOutcome(selectedTrade.pnl) === 'W' ? 'Win' : 
                     getTradeOutcome(selectedTrade.pnl) === 'L' ? 'Loss' : 
                     'Break-Even'}
                  </p>
                </div>
                {selectedTrade.exitRFactor !== undefined && (
                  <div className="col-span-full">
                    <p className="text-xs text-muted-foreground">Exit R Multiple</p>
                    <p className={`text-2xl font-bold ${selectedTrade.exitRFactor > 0 ? 'text-green-400' : selectedTrade.exitRFactor < 0 ? 'text-red-400' : 'text-yellow-400'}`}>
                      {selectedTrade.exitRFactor > 0 ? '+' : ''}{selectedTrade.exitRFactor.toFixed(2)}R
                    </p>
                  </div>
                )}
              </div>

              {/* Notes */}
              {selectedTrade.preNotes && (
                <div>
                  <p className="text-sm font-semibold text-foreground mb-2">Pre-Trade Notes</p>
                  <p className="text-sm text-muted-foreground bg-secondary p-3 rounded-lg">{selectedTrade.preNotes}</p>
                </div>
              )}

              {selectedTrade.postNotes && (
                <div>
                  <p className="text-sm font-semibold text-foreground mb-2">Post-Trade Notes</p>
                  <p className="text-sm text-muted-foreground bg-secondary p-3 rounded-lg">{selectedTrade.postNotes}</p>
                </div>
              )}

              {/* Mistake Tag */}
              {selectedTrade.mistakeTag && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Mistake Tag</p>
                  <span className="inline-block px-3 py-1 bg-destructive/20 text-destructive rounded-full text-sm font-medium">
                    {selectedTrade.mistakeTag}
                  </span>
                </div>
              )}

              {/* Screenshots */}
              {(selectedTrade.beforeTradeScreenshot || selectedTrade.afterExitScreenshot) && (
                <div>
                  <p className="text-sm font-semibold text-foreground mb-3">Trade Screenshots</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedTrade.beforeTradeScreenshot && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Before Trade</p>
                        <ScreenshotViewer imageUrl={selectedTrade.beforeTradeScreenshot} title="Before Trade Screenshot" />
                      </div>
                    )}
                    {selectedTrade.afterExitScreenshot && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">After Exit</p>
                        <ScreenshotViewer imageUrl={selectedTrade.afterExitScreenshot} title="After Exit Screenshot" />
                      </div>
                    )}
                  </div>
                </div>
              )}

              <Button onClick={() => setSelectedTrade(null)} className="w-full bg-primary hover:bg-primary/90">
                Close
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
