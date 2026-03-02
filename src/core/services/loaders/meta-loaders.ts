import { useQuery } from "@tanstack/react-query";
import { metaApi, State, LGA } from "../API/meta";

export function useStates() {
  return useQuery<State[]>({
    queryKey: ["meta", "states"],
    queryFn: metaApi.getStates,
    staleTime: Infinity,
  });
}

export function useLgas(stateId?: string) {
  return useQuery<LGA[]>({
    queryKey: ["meta", "lgas", stateId],
    queryFn: () => metaApi.getLgas(stateId!),
    enabled: !!stateId,
    staleTime: Infinity,
  });
}

export function useVcdpComponents() {
  return useQuery<Record<string, string[]>>({
    queryKey: ["meta", "vcdp-components"],
    queryFn: metaApi.getComponents,
    staleTime: Infinity,
  });
}

export function useThreefsComponents() {
  return useQuery<Record<string, string[]>>({
    queryKey: ["meta", "threefs-components"],
    queryFn: metaApi.getThreefsComponents,
    staleTime: Infinity,
  });
}

export function useFundingSources() {
  return useQuery<Record<string, string[]>>({
    queryKey: ["meta", "funding-sources"],
    queryFn: metaApi.getFundingSources,
    staleTime: Infinity,
  });
}

export function useValueChainSegments() {
  return useQuery<string[]>({
    queryKey: ["meta", "segments"],
    queryFn: metaApi.getSegments,
    staleTime: Infinity,
  });
}

export function useCommodities() {
  return useQuery<string[]>({
    queryKey: ["meta", "commodities"],
    queryFn: metaApi.getCommodities,
    staleTime: Infinity,
  });
}

export function useFiscalYears() {
  return useQuery<number[]>({
    queryKey: ["meta", "fiscal-years"],
    queryFn: metaApi.getFiscalYears,
    staleTime: Infinity,
  });
}
