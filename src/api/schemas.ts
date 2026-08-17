import { z } from 'zod';

/**
 * Every response the app touches is parsed through one of these first, so a
 * backend change surfaces as one loud contract error instead of a scatter of
 * undefined reads deep in the render tree.
 */

export const UNITS = [
  'GRAM',
  'KILOGRAM',
  'MILLILITRE',
  'LITRE',
  'CUP',
  'TABLESPOON',
  'TEASPOON',
  'PIECE',
] as const;

export const unitSchema = z.enum(UNITS);
export type Unit = z.infer<typeof unitSchema>;

/** Cursor page. `nextCursor` is null on the last page. */
export function pageSchema<T extends z.ZodTypeAny>(item: T) {
  return z.object({ items: z.array(item), nextCursor: z.string().nullable() });
}

export interface Page<T> {
  items: T[];
  nextCursor: string | null;
}

export const meSchema = z.object({
  id: z.string(),
  username: z.string(),
  email: z.string(),
  profileImage: z.string().nullable(),
  createdAt: z.string(),
  /** Set once the owner has requested deletion; null on a normal account. */
  deletionRequestedAt: z.string().nullable(),
  /** When the purge becomes eligible to destroy the account for good. */
  purgeAt: z.string().nullable(),
});
export type Me = z.infer<typeof meSchema>;

export const userSummarySchema = z.object({
  id: z.string(),
  username: z.string(),
  profileImage: z.string().nullable(),
});
export type UserSummary = z.infer<typeof userSummarySchema>;

export const publicUserSchema = userSummarySchema.extend({ createdAt: z.string() });
export type PublicUser = z.infer<typeof publicUserSchema>;

export const publicProfileSchema = publicUserSchema.extend({
  followerCount: z.number(),
  followingCount: z.number(),
  // Absent when viewing anonymously or when the profile is your own.
  isFollowing: z.boolean().optional(),
});
export type PublicProfile = z.infer<typeof publicProfileSchema>;

export const authResultSchema = z.object({
  user: meSchema,
  accessToken: z.string(),
  refreshToken: z.string(),
});
export type AuthResult = z.infer<typeof authResultSchema>;

export const categorySchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
});
export type Category = z.infer<typeof categorySchema>;

export const recipeCategorySchema = z.object({ slug: z.string(), name: z.string() });
export type RecipeCategory = z.infer<typeof recipeCategorySchema>;

export const productSchema = z.object({
  id: z.string(),
  name: z.string(),
  caloriesPer100g: z.number(),
  proteinPer100g: z.number(),
  carbsPer100g: z.number(),
  fatPer100g: z.number(),
  sugarPer100g: z.number(),
  densityGPerMl: z.number().nullable(),
  gramsPerPiece: z.number().nullable(),
});
export type Product = z.infer<typeof productSchema>;

export const nutritionSchema = z.object({
  calories: z.number(),
  protein: z.number(),
  carbs: z.number(),
  fat: z.number(),
  // A subset of carbs, not a fifth peer macro - render it nested, not alongside.
  sugar: z.number(),
});
export type Nutrition = z.infer<typeof nutritionSchema>;

export const recipeSummarySchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  owner: userSummarySchema,
  categories: z.array(recipeCategorySchema),
  imageUrl: z.string(),
});
export type RecipeSummary = z.infer<typeof recipeSummarySchema>;

export const recipeIngredientSchema = z.object({
  id: z.string(),
  quantity: z.number(),
  unit: unitSchema,
  product: productSchema,
});
export type RecipeIngredient = z.infer<typeof recipeIngredientSchema>;

export const recipeDetailSchema = recipeSummarySchema.extend({
  instructions: z.string(),
  ingredients: z.array(recipeIngredientSchema),
  nutrition: nutritionSchema,
  isSaved: z.boolean(),
});
export type RecipeDetail = z.infer<typeof recipeDetailSchema>;

/** Cookbook and collection listings return a lighter card than /recipes. */
export const savedRecipeSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  createdAt: z.string(),
  imageUrl: z.string(),
  owner: userSummarySchema,
  categories: z.array(recipeCategorySchema),
});
export type SavedRecipe = z.infer<typeof savedRecipeSchema>;

export const collectionSchema = z.object({
  id: z.string(),
  name: z.string(),
  createdAt: z.string(),
  recipeCount: z.number(),
});
export type Collection = z.infer<typeof collectionSchema>;

export const imagePresetSchema = z.object({
  slug: z.string(),
  label: z.string(),
  url: z.string(),
});
export type ImagePreset = z.infer<typeof imagePresetSchema>;

export const uploadTicketSchema = z.object({
  uploadUrl: z.string(),
  storageKey: z.string(),
});
export type UploadTicket = z.infer<typeof uploadTicketSchema>;

export const reactionSummarySchema = z.object({
  total: z.number(),
  byEmoji: z.record(z.string(), z.number()),
  /** The viewer's own emoji, or null when they have not reacted. */
  mine: z.string().nullable(),
});
export type ReactionSummary = z.infer<typeof reactionSummarySchema>;

export const postSchema = z.object({
  id: z.string(),
  caption: z.string().nullable(),
  createdAt: z.string(),
  author: userSummarySchema,
  images: z.array(
    z.object({
      id: z.string(),
      url: z.string(),
      // PATCH replaces the image set wholesale, not a diff - editing a post
      // requires re-sending the keys of any existing images to keep.
      storageKey: z.string(),
    }),
  ),
  recipe: z.object({
    id: z.string(),
    title: z.string(),
    nutrition: nutritionSchema,
    isSaved: z.boolean(),
  }),
  reactions: reactionSummarySchema,
  commentCount: z.number(),
});
export type Post = z.infer<typeof postSchema>;

export const commentSchema = z.object({
  id: z.string(),
  postId: z.string(),
  content: z.string(),
  createdAt: z.string(),
  author: userSummarySchema,
});
export type Comment = z.infer<typeof commentSchema>;
