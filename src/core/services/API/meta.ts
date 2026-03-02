import { apiRequest } from "./client";

export interface LGA {
  id: string;
  name: string;
  state_id: string;
}

export interface State {
  id: string;
  name: string;
  code: string;
  lgas: LGA[];
}

export const metaApi = {
  getStates: () => apiRequest<State[]>("/api/meta/states"),
  getLgas: (stateId: string) =>
    apiRequest<LGA[]>(`/api/meta/states/${stateId}/lgas`),
  getComponents: () =>
    apiRequest<Record<string, string[]>>("/api/meta/vcdp-components"),
  getThreefsComponents: () =>
    apiRequest<Record<string, string[]>>("/api/meta/threefs-components"),
  getFundingSources: () =>
    apiRequest<Record<string, string[]>>("/api/meta/funding-sources"),
  getSegments: () => apiRequest<string[]>("/api/meta/value-chain-segments"),
  getCommodities: () => apiRequest<string[]>("/api/meta/commodities"),
  getFiscalYears: () => apiRequest<number[]>("/api/meta/fiscal-years"),
};
