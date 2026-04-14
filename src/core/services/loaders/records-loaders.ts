import { useQuery } from "@tanstack/react-query";

import { Transaction } from "@/lib/store";
import { recordsApi, RecordsListResponse } from "../API/records";

export function useRecords(params: URLSearchParams, options: any = {}) {
  return useQuery<RecordsListResponse>({
    queryKey: ["records", "list", params.toString()],
    queryFn: () => recordsApi.list(params),
    ...options,
  });
}

export function useRecord(id: string) {
  return useQuery<Transaction>({
    queryKey: ["records", "detail", id],
    queryFn: () => {
      console.log("Fetching record for ID:", id);
      return recordsApi.get(id);
    },
    enabled: !!id,
  });
}
