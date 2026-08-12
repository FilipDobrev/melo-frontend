import { useQuery } from '@tanstack/react-query';
import { searchUsers } from '../api/users.api';

export function useUserSearch(search: string) {
  return useQuery({
    queryKey: ['users', search],
    queryFn: () => searchUsers({ search: search || undefined, limit: 20 }),
    enabled: search.length > 0,
  });
}
