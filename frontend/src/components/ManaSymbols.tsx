import React from 'react';

interface ManaSymbolsProps {
  cost: string;
  className?: string;
}

/**
 * Component to render mana cost symbols using the Mana font
 * Converts text like "{2}{G}{G}" into icon font symbols
 * 
 * Supported formats:
 * - Generic: {0} to {20}, {X}, {Y}, {Z}
 * - Colors: {W}, {U}, {B}, {R}, {G}
 * - Hybrid: {W/U}, {2/G}, etc.
 * - Phyrexian: {W/P}, {U/P}, etc.
 * - Special: {C} (colorless), {S} (snow)
 * - Tap symbols: {T}, {Q}
 */
export const ManaSymbols: React.FC<ManaSymbolsProps> = ({ cost, className = '' }) => {
  if (!cost) return <span className={className}>—</span>;

  // Parse mana cost string like "{2}{G}{G}" into array of symbols
  const symbols = cost.match(/\{[^}]+\}/g) || [];
  
  // Convert symbol to CSS class
  const getSymbolClass = (symbol: string): string => {
    // Remove braces
    const cleaned = symbol.replace(/[{}]/g, '').toLowerCase();
    
    // Handle hybrid mana (e.g., {W/U} -> ms-wu ms-cost)
    if (cleaned.includes('/')) {
      return `ms ms-${cleaned.replace('/', '')} ms-cost`;
    }
    
    // Handle regular symbols - add ms-cost for colored version
    return `ms ms-${cleaned} ms-cost`;
  };

  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`}>
      {symbols.map((symbol, index) => (
        <i 
          key={index} 
          className={getSymbolClass(symbol)}
          title={symbol}
        />
      ))}
    </span>
  );
};

/**
 * Component to render oracle text with mana symbols
 * Replaces {X} patterns in text with icon symbols
 */
interface OracleTextProps {
  text: string;
  className?: string;
}

export const OracleText: React.FC<OracleTextProps> = ({ text, className = '' }) => {
  if (!text) return null;

  // Split text by mana symbols but keep the symbols
  const parts = text.split(/(\{[^}]+\})/g);

  const getSymbolClass = (symbol: string): string => {
    const cleaned = symbol.replace(/[{}]/g, '').toLowerCase();
    if (cleaned.includes('/')) {
      return `ms ms-${cleaned.replace('/', '')} ms-cost`;
    }
    return `ms ms-${cleaned} ms-cost`;
  };

  return (
    <span className={className}>
      {parts.map((part, index) => {
        // Check if this part is a mana symbol
        if (part.match(/^\{[^}]+\}$/)) {
          return (
            <i 
              key={index} 
              className={`${getSymbolClass(part)} mx-0.5`}
              title={part}
            />
          );
        }
        // Regular text
        return <span key={index}>{part}</span>;
      })}
    </span>
  );
};

export default ManaSymbols;
