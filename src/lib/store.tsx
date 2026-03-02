import React, { createContext, useContext, useState, useEffect } from "react";

export type Transaction = {
  id: string;
  ref_id: string;
  project_name: string;
  commodity: string[];
  fy_awarded: number;
  fy_completed: number;
  programme_phase: string;
  fiscal_quarter: string;
  vcdp_component: string;
  vcdp_sub_components: string[];
  state: string;
  lgas: string[];
  threeFS_primary: string[];
  threeFS_sub_components: string[];
  cofog_code: string;
  funding_sources: string[];
  expenditure_fgn: number;
  expenditure_state: number;
  expenditure_ifad: number;
  expenditure_oof: number;
  expenditure_beneficiary: number;
  expenditure_other: number;
  expenditure_total: number;
  beneficiary_categories: string[];
  beneficiary_total: number;
  beneficiary_male: number;
  beneficiary_female: number;
  beneficiary_youth_under35: number;
  value_chain_segments: string[];
  climate_flag: "Yes" | "No";
  data_source: string;
  supporting_documents: string[];
  entered_by: string;
  entered_at: string;
  classification_notes: string;
};

// Generate initial mock data for VCDP
const generateMockData = (): Transaction[] => {
  const states = ["Anambra", "Benue", "Ebonyi", "Niger", "Ogun", "Taraba"];
  const components = ["Component 1", "Component 2", "Component 3"];

  return Array.from({ length: 20 }).map((_, i) => {
    const fgn = Math.floor(Math.random() * 50000);
    const ifad = Math.floor(Math.random() * 100000);
    const total = fgn + ifad;

    return {
      id: `trx-${i}`,
      ref_id: `VCDP/2024/TRX/${1000 + i}`,
      project_name: `Infrastructure Development Project ${i + 1}`,
      commodity: ["Rice"],
      fy_awarded: 2023,
      fy_completed: 2024,
      programme_phase: "2nd AF",
      fiscal_quarter: "Q2",
      vcdp_component: components[Math.floor(Math.random() * components.length)],
      vcdp_sub_components: ["Market Infrastructure"],
      state: states[Math.floor(Math.random() * states.length)],
      lgas: ["Sample LGA"],
      threeFS_primary: ["1. Food Production"],
      threeFS_sub_components: ["1.1 Crop production"],
      cofog_code: "04.2.1",
      funding_sources: ["Domestic", "International"],
      expenditure_fgn: fgn,
      expenditure_state: 0,
      expenditure_ifad: ifad,
      expenditure_oof: 0,
      expenditure_beneficiary: 0,
      expenditure_other: 0,
      expenditure_total: total,
      beneficiary_categories: ["Smallholder Farmers"],
      beneficiary_total: 100,
      beneficiary_male: 60,
      beneficiary_female: 40,
      beneficiary_youth_under35: 30,
      value_chain_segments: ["Production"],
      climate_flag: "Yes",
      data_source: "Monthly Progress Report",
      supporting_documents: [],
      entered_by: "admin-1",
      entered_at: new Date().toISOString(),
      classification_notes: "Standard transaction entry for infrastructure.",
    };
  });
};

interface InsightContextType {
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, "id" | "entered_at">) => void;
  importTransactions: (data: Transaction[]) => void;
  clearTransactions: () => void;
}

const InsightContext = createContext<InsightContextType | undefined>(undefined);

export function InsightProvider({ children }: { children: React.ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    setTransactions(generateMockData());
  }, []);

  const addTransaction = (newTrx: Omit<Transaction, "id" | "entered_at">) => {
    const trx = {
      ...newTrx,
      id: `trx-${Date.now()}`,
      entered_at: new Date().toISOString(),
    };
    setTransactions((prev) => [trx, ...prev]);
  };

  const importTransactions = (data: Transaction[]) => {
    setTransactions(data);
  };

  const clearTransactions = () => {
    setTransactions([]);
  };

  return (
    <InsightContext.Provider
      value={{
        transactions,
        addTransaction,
        importTransactions,
        clearTransactions,
      }}
    >
      {children}
    </InsightContext.Provider>
  );
}

export function useInsight() {
  const context = useContext(InsightContext);
  if (!context) {
    throw new Error("useInsight must be used within an InsightProvider");
  }
  return context;
}
