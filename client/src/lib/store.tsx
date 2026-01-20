import React, { createContext, useContext, useState, useEffect } from 'react';

export type Response = {
  id: string;
  date: string;
  nps: number;
  department: 'Sales' | 'Engineering' | 'Marketing' | 'Product' | 'Support';
  feature: 'Performance' | 'UI/UX' | 'Reliability' | 'Features' | 'Pricing';
  sentiment: 'Positive' | 'Neutral' | 'Negative';
  feedback: string;
};

// Generate some initial dummy data
const generateMockData = (): Response[] => {
  const depts = ['Sales', 'Engineering', 'Marketing', 'Product', 'Support'] as const;
  const features = ['Performance', 'UI/UX', 'Reliability', 'Features', 'Pricing'] as const;
  const sentiments = ['Positive', 'Neutral', 'Negative'] as const;
  
  return Array.from({ length: 50 }).map((_, i) => ({
    id: `resp-${i}`,
    date: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    nps: Math.floor(Math.random() * 10) + 1,
    department: depts[Math.floor(Math.random() * depts.length)],
    feature: features[Math.floor(Math.random() * features.length)],
    sentiment: sentiments[Math.floor(Math.random() * sentiments.length)],
    feedback: "Sample feedback text for demonstration purposes."
  }));
};

interface InsightContextType {
  responses: Response[];
  addResponse: (response: Omit<Response, 'id'>) => void;
  importResponses: (data: Response[]) => void;
  clearResponses: () => void;
}

const InsightContext = createContext<InsightContextType | undefined>(undefined);

export function InsightProvider({ children }: { children: React.ReactNode }) {
  const [responses, setResponses] = useState<Response[]>([]);

  // Load initial mock data
  useEffect(() => {
    setResponses(generateMockData());
  }, []);

  const addResponse = (newResponse: Omit<Response, 'id'>) => {
    const response = { ...newResponse, id: `resp-${Date.now()}` };
    setResponses(prev => [response, ...prev]);
  };

  const importResponses = (data: Response[]) => {
    setResponses(data);
  };

  const clearResponses = () => {
    setResponses([]);
  };

  return (
    <InsightContext.Provider value={{ responses, addResponse, importResponses, clearResponses }}>
      {children}
    </InsightContext.Provider>
  );
}

export function useInsight() {
  const context = useContext(InsightContext);
  if (!context) {
    throw new Error('useInsight must be used within an InsightProvider');
  }
  return context;
}
