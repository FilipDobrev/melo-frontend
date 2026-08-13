// Zod schemas mirroring the response shapes documented in backend/API.md.
// Every response from the API is parsed through one of these before the app
// touches it, so a malformed or unexpectedly-shaped payload fails loudly
// instead of producing `undefined`s deep in a screen.
import { z } from 'zod';

export const unitSchema = z.enum([
  'GRAM',
  'KILOGRAM',
  'MILLILITRE',
  'LITRE',
  'CUP',
  'TABLESPOON',
  'TEASPOON',
  'PIECE',
]);
export type Unit = z.infer<typeof unitSchema>;

export const errorResponseSchema = z.object({
  error: z.object({
    code: z.enum([
      'BAD_REQUEST',
      'UNAUTHENTICATED',
      'FORBIDDEN',
      'NOT_FOUND',
      'CONFLICT',
      'VALIDATION_FAILED',
      'INTERNAL',
    ]),
    message: z.string(),
    details: z.unknown().optional(),
  }),
});

export function paginated<T extends z.ZodTypeAny>(itemSchema: T) {
  return z.object({
    items: z.array(itemSchema),
    nextCursor: z.string().nullable(),
  });
}

export const publicUserSchema = z.object({
  id: z.string(),
  username: z.string(),
  profileImage: z.string().nullable(),
});
export type PublicUser = z.infer<typeof publicUserSchema>;

// GET /users/me
export const meSchema = publicUserSchema.extend({
  email: z.string(),
});
export type Me = z.infer<typeof meSchema>;

// GET /users/:userId - public profile + counts + isFollowing.
export const userProfileSchema = publicUserSchema.extend({
  followerCount: z.number(),
  followingCount: z.number(),
  // The API omits this key entirely for anonymous viewers and for your own
  // profile, rather than sending a misleading false.
  isFollowing: z.boolean().optional(),
});
export type UserProfile = z.infer<typeof userProfileSchema>;

export const authResultSchema = z.object({
  user: meSchema,
  accessToken: z.string(),
  refreshToken: z.string(),
});
export type AuthResult = z.infer<typeof authResultSchema>;

// POST /auth/refresh -> { accessToken, refreshToken } only (no user).
export const refreshResultSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
});
export type RefreshResult = z.infer<typeof refreshResultSchema>;

export const categorySchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
});
export type Category = z.infer<typeof categorySchema>;

export const productSchema = z.object({
  id: z.string(),
  name: z.string(),
  caloriesPer100g: z.number(),
  proteinPer100g: z.number(),
  carbsPer100g: z.number(),
  fatPer100g: z.number(),
  densityGPerMl: z.number().nullable(),
  gramsPerPiece: z.number().nullable(),
});
export type Product = z.infer<typeof productSchema>;

export const nutritionSchema = z.object({
  calories: z.number(),
  protein: z.number(),
  carbs: z.number(),
  fat: z.number(),
});
export type Nutrition = z.infer<typeof nutritionSchema>;

// Categories nested inside a recipe carry only slug and name. The full
// category (with id) comes from GET /categories.
export const recipeCategorySchema = z.object({
  slug: z.string(),
  name: z.string(),
});
export type RecipeCategory = z.infer<typeof recipeCategorySchema>;

export const recipeIngredientSchema = z.object({
  id: z.string(),
  quantity: z.number(),
  unit: unitSchema,
  product: productSchema,
});
export type RecipeIngredient = z.infer<typeof recipeIngredientSchema>;

// GET /recipes - list item (no ingredients/instructions).
// `updatedAt` is present on /recipes and /users/:userId/recipes but absent
// on /users/me/cookbook and collection recipe lists, so it's optional here.
export const recipeSummarySchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
  owner: publicUserSchema,
  categories: z.array(recipeCategorySchema),
});
export type RecipeSummary = z.infer<typeof recipeSummarySchema>;

// GET /recipes/:recipeId - full detail.
export const recipeDetailSchema = recipeSummarySchema.extend({
  instructions: z.string(),
  ingredients: z.array(recipeIngredientSchema),
  nutrition: nutritionSchema,
  isSaved: z.boolean(),
});
export type RecipeDetail = z.infer<typeof recipeDetailSchema>;

const recipeRefSchema = z.object({
  id: z.string(),
  title: z.string(),
  nutrition: nutritionSchema,
  isSaved: z.boolean(),
});

export const postImageSchema = z.object({
  id: z.string(),
  url: z.string(),
});
export type PostImage = z.infer<typeof postImageSchema>;

export const postSchema = z.object({
  id: z.string(),
  caption: z.string().nullable(),
  createdAt: z.string(),
  author: publicUserSchema,
  images: z.array(postImageSchema),
  recipe: recipeRefSchema,
  reactions: z.object({
    total: z.number(),
    byEmoji: z.record(z.string(), z.number()),
    mine: z.string().nullable(),
  }),
  commentCount: z.number(),
});
export type Post = z.infer<typeof postSchema>;

export const commentSchema = z.object({
  id: z.string(),
  content: z.string(),
  createdAt: z.string(),
  author: publicUserSchema,
});
export type Comment = z.infer<typeof commentSchema>;

// GET/POST /users/me/collections
export const collectionSchema = z.object({
  id: z.string(),
  name: z.string(),
  createdAt: z.string(),
  recipeCount: z.number(),
});
export type Collection = z.infer<typeof collectionSchema>;

export const uploadUrlSchema = z.object({
  uploadUrl: z.string(),
  storageKey: z.string(),
});
export type UploadUrlResult = z.infer<typeof uploadUrlSchema>;
