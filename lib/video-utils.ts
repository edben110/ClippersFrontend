/**
 * Utility functions for video handling and streaming
 */

/**
 * Convert a video URL to use the streaming endpoint
 * This improves video playback on mobile devices by supporting HTTP Range Requests
 * 
 * @param videoUrl - Original video URL
 * @param useStreaming - Whether to use streaming endpoint (default: true for large videos)
 * @returns Streaming-optimized URL
 * 
 * Note: Falls back to original URL if streaming is not available
 */
export function getStreamingUrl(videoUrl: string | undefined, useStreaming: boolean = true): string | undefined {
  if (!videoUrl) return undefined;
  
  // If streaming is disabled, return original URL
  if (!useStreaming) return videoUrl;
  
  // Check if it's already a streaming URL
  if (videoUrl.includes('/api/stream/')) return videoUrl;
  
  // Extract filename from URL
  // Example: https://backend.clipers.pro/uploads/videos/video_123.mp4
  // or: /uploads/videos/video_123.mp4
  const match = videoUrl.match(/\/uploads\/videos\/(.+)$/);
  
  if (!match) return videoUrl; // Not a video URL, return as is
  
  const filename = match[1];
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://backend.clipers.pro/api';
  const baseUrl = apiUrl.replace('/api', ''); // Remove /api suffix if present
  
  // Try streaming endpoint first, but video player will fallback to original URL on error
  return `${baseUrl}/api/stream/video/${encodeURIComponent(filename)}`;
}

/**
 * Check if a video should use streaming based on its characteristics
 * Large videos (Clipers) benefit more from streaming than small post videos
 */
export function shouldUseStreaming(videoUrl: string | undefined, isCliper: boolean = false): boolean {
  if (!videoUrl) return false;
  
  // Always use streaming for Clipers (they are typically larger)
  if (isCliper) return true;
  
  // For post videos, use streaming if they're from the uploads folder
  return videoUrl.includes('/uploads/videos/');
}
