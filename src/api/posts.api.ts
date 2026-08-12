import { apiRequest, apiRequestNoContent } from './client';
import { postSchema, commentSchema, uploadUrlSchema, paginated, type Post, type Comment, type UploadUrlResult } from './schemas';
import type { Paginated, PageParams } from './pagination';

export async function getUploadUrl(input: {
  contentType: string;
  contentLength: number;
}): Promise<UploadUrlResult> {
  return apiRequest('/posts/images/upload-url', uploadUrlSchema, { method: 'POST', body: input });
}

/** PUTs the raw image bytes straight to storage using the presigned URL. */
export async function uploadImageToStorage(uploadUrl: string, blob: Blob, contentType: string): Promise<void> {
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body: blob,
  });
  if (!response.ok) {
    throw new Error(`Image upload failed with status ${response.status}`);
  }
}

export async function createPost(input: {
  caption?: string;
  recipeId?: string;
  imageKeys: string[];
}): Promise<Post> {
  return apiRequest('/posts', postSchema, { method: 'POST', body: input });
}

export async function getPost(postId: string): Promise<Post> {
  return apiRequest(`/posts/${postId}`, postSchema);
}

export async function deletePost(postId: string): Promise<void> {
  return apiRequestNoContent(`/posts/${postId}`, { method: 'DELETE' });
}

export async function deletePostImage(postId: string, imageId: string): Promise<void> {
  return apiRequestNoContent(`/posts/${postId}/images/${imageId}`, { method: 'DELETE' });
}

export async function setReaction(postId: string, emoji: string): Promise<void> {
  return apiRequestNoContent(`/posts/${postId}/reactions`, { method: 'PUT', body: { emoji } });
}

export async function removeReaction(postId: string): Promise<void> {
  return apiRequestNoContent(`/posts/${postId}/reactions`, { method: 'DELETE' });
}

export async function getComments(postId: string, params: PageParams): Promise<Paginated<Comment>> {
  return apiRequest(`/posts/${postId}/comments`, paginated(commentSchema), { query: params });
}

export async function addComment(postId: string, content: string): Promise<Comment> {
  return apiRequest(`/posts/${postId}/comments`, commentSchema, { method: 'POST', body: { content } });
}

export async function deleteComment(postId: string, commentId: string): Promise<void> {
  return apiRequestNoContent(`/posts/${postId}/comments/${commentId}`, { method: 'DELETE' });
}
