/**
 * Data Structures for Clipers Platform
 * 
 * Export all data structures for easy import
 */

export { Stack } from "./stack"
export { Queue, PriorityQueue } from "./queue"

/**
 * Usage examples:
 * 
 * import { Stack, Queue, PriorityQueue } from "@/lib/data-structures"
 * 
 * // Navigation history
 * const history = new Stack<string>()
 * 
 * // Video processing queue
 * const videoQueue = new Queue<VideoJob>()
 * 
 * // Priority notifications
 * const notifications = new PriorityQueue<Notification>()
 */
