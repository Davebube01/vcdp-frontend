import React, { createContext, useContext, useState, useCallback } from "react";

export type CurrencyType = "USD" | "NGN";

interface CurrencyContextType {
  displayCurrency: CurrencyType;
  setDisplayCurrency: (currency: CurrencyType) => void;
  exchangeRate: number;
  formatValue: (value: number, inputCurrency?: CurrencyType, compact?: boolean) => string;
  getSymbol: () => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [displayCurrency, setDisplayCurrency] = useState<CurrencyType>("USD");
  
  // Central live exchange rate (1 USD = 1550 NGN)
  const exchangeRate = 1550;

  const getSymbol = useCallback(() => {
    return displayCurrency === "NGN" ? "₦" : "$";
  }, [displayCurrency]);

  const formatValue = useCallback((value: number, inputCurrency: CurrencyType = "USD", compact: boolean = false) => {
    let finalValue = value;

    // 1. Convert to a base currency (USD) if input is NGN
    if (inputCurrency === "NGN") {
        finalValue = value / exchangeRate;
    }

    // 2. Convert to display currency
    if (displayCurrency === "NGN") {
        finalValue = finalValue * exchangeRate;
    }

    // 3. Format as string
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: displayCurrency,
      minimumFractionDigits: 0,
      maximumFractionDigits: compact ? 1 : 2,
      notation: compact ? "compact" : "standard",
    }).format(finalValue);
  }, [displayCurrency, exchangeRate]);

  return (
    <CurrencyContext.Provider value={{ displayCurrency, setDisplayCurrency, exchangeRate, formatValue, getSymbol }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
};
