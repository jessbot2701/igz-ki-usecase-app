import { useQuery } from '@tanstack/react-query';
import { authApi } from '../../api/authApi';

export function useEmailAccessConfig() {
  const query = useQuery({
    queryKey: ['email-access-config'],
    queryFn: authApi.accessConfig,
    staleTime: 60_000
  });
  return {
    demoMode: query.data?.demoMode ?? false,
    demoEmail: query.data?.demoEmail,
    loading: query.isPending,
    unavailable: query.isError
  };
}
