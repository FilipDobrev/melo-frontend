export type Paginated<T> = {
  items: T[];
  nextCursor: string | null;
};

export type PageParams = {
  cursor?: string;
  limit?: number;
};
