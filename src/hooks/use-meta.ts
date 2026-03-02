import { useQuery } from "@tanstack/react-query";

export interface State {
  id: string;
  name: string;
  code: string;
  lgas: LGA[];
}

export interface LGA {
  id: string;
  name: string;
  state_id: string;
}

export function useStates() {
  return useQuery<State[]>({
    queryKey: ["/api/meta/states"],
  });
}

export function useVcdpComponents() {
  return useQuery<Record<string, string[]>>({
    queryKey: ["/api/meta/vcdp-components"],
  });
}

export function useThreefsComponents() {
  return useQuery<Record<string, string[]>>({
    queryKey: ["/api/meta/threefs-components"],
  });
}

export function useFundingSources() {
  return useQuery<Record<string, string[]>>({
    queryKey: ["/api/meta/funding-sources"],
  });
}

export function useValueChainSegments() {
  return useQuery<string[]>({
    queryKey: ["/api/meta/value-chain-segments"],
  });
}

export function useCommodities() {
  return useQuery<string[]>({
    queryKey: ["/api/meta/commodities"],
  });
}

export function useFiscalYears() {
  return useQuery<number[]>({
    queryKey: ["/api/meta/fiscal-years"],
  });
}
