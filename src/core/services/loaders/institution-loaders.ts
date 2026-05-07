import { useQuery } from "@tanstack/react-query";
import { institutionApi, Institution } from "../API/institutions";

export type { Institution };

export function useInstitutions(state?: string) {
  return useQuery({
    queryKey: ["institutions", state],
    queryFn: () => institutionApi.list(state),
  });
}
