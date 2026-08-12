import { useQuery } from '@tanstack/react-query';
import { searchProducts } from '../api/products.api';

export function useProductSearch(search: string) {
  return useQuery({
    queryKey: ['products', search],
    queryFn: () => searchProducts({ search: search || undefined, limit: 20 }),
    enabled: search.length > 0,
  });
}
