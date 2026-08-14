/**
 * Query keys, in one place because invalidation crosses domains: saving a
 * recipe touches the recipe, the cookbook and every post that links it.
 *
 * The feed lives under the `posts` root on purpose - a single
 * `setQueriesData(['posts'])` then patches the feed, profile grids and post
 * detail together when a reaction or save changes.
 */
export const keys = {
  me: ['me'] as const,

  users: {
    root: ['users'] as const,
    profile: (userId: string) => ['users', 'profile', userId] as const,
    search: (search: string) => ['users', 'search', search] as const,
    followers: (userId: string) => ['users', 'followers', userId] as const,
    following: (userId: string) => ['users', 'following', userId] as const,
  },

  posts: {
    root: ['posts'] as const,
    feed: ['posts', 'feed'] as const,
    byUser: (userId: string) => ['posts', 'byUser', userId] as const,
    detail: (postId: string) => ['posts', 'detail', postId] as const,
    comments: (postId: string) => ['comments', postId] as const,
  },

  recipes: {
    root: ['recipes'] as const,
    search: (search: string, categorySlugs: string[], sort: string) =>
      ['recipes', 'search', search, categorySlugs.join(','), sort] as const,
    byUser: (userId: string) => ['recipes', 'byUser', userId] as const,
    detail: (recipeId: string) => ['recipes', 'detail', recipeId] as const,
    imagePresets: ['recipes', 'imagePresets'] as const,
  },

  cookbook: {
    root: ['cookbook'] as const,
    list: (categorySlugs: string[]) => ['cookbook', 'list', categorySlugs.join(',')] as const,
  },

  collections: {
    root: ['collections'] as const,
    list: ['collections', 'list'] as const,
    recipes: (collectionId: string) => ['collections', 'recipes', collectionId] as const,
  },

  categories: ['categories'] as const,
  products: (search: string) => ['products', search] as const,
} as const;
