/**
 * Queue (Cola) - FIFO (First In First Out)
 * Useful for: Video processing, Notifications, Message queue
 */
export class Queue<T> {
  private items: T[] = []
  private maxSize: number

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize
  }

  /**
   * Add item to end of queue
   */
  enqueue(item: T): boolean {
    if (this.items.length >= this.maxSize) {
      return false // Queue is full
    }
    this.items.push(item)
    return true
  }

  /**
   * Remove and return first item
   */
  dequeue(): T | undefined {
    return this.items.shift()
  }

  /**
   * View first item without removing
   */
  peek(): T | undefined {
    return this.items[0]
  }

  /**
   * Check if queue is empty
   */
  isEmpty(): boolean {
    return this.items.length === 0
  }

  /**
   * Get queue size
   */
  size(): number {
    return this.items.length
  }

  /**
   * Check if queue is full
   */
  isFull(): boolean {
    return this.items.length >= this.maxSize
  }

  /**
   * Clear all items
   */
  clear(): void {
    this.items = []
  }

  /**
   * Get all items (for debugging)
   */
  toArray(): T[] {
    return [...this.items]
  }
}

/**
 * Priority Queue - Items with higher priority are dequeued first
 */
export class PriorityQueue<T> {
  private items: Array<{ item: T; priority: number }> = []

  /**
   * Add item with priority (higher number = higher priority)
   */
  enqueue(item: T, priority: number): void {
    const queueItem = { item, priority }
    let added = false

    for (let i = 0; i < this.items.length; i++) {
      if (queueItem.priority > this.items[i].priority) {
        this.items.splice(i, 0, queueItem)
        added = true
        break
      }
    }

    if (!added) {
      this.items.push(queueItem)
    }
  }

  /**
   * Remove and return highest priority item
   */
  dequeue(): T | undefined {
    return this.items.shift()?.item
  }

  /**
   * View highest priority item without removing
   */
  peek(): T | undefined {
    return this.items[0]?.item
  }

  /**
   * Check if queue is empty
   */
  isEmpty(): boolean {
    return this.items.length === 0
  }

  /**
   * Get queue size
   */
  size(): number {
    return this.items.length
  }

  /**
   * Clear all items
   */
  clear(): void {
    this.items = []
  }
}

/**
 * Example usage for video processing:
 * 
 * const videoQueue = new Queue<string>(50)
 * videoQueue.enqueue('video-1.mp4')
 * videoQueue.enqueue('video-2.mp4')
 * 
 * const nextVideo = videoQueue.dequeue() // 'video-1.mp4'
 * 
 * // Priority queue for urgent notifications
 * const notifications = new PriorityQueue<string>()
 * notifications.enqueue('New message', 1)
 * notifications.enqueue('Job match!', 3) // Higher priority
 * notifications.enqueue('Profile view', 2)
 * 
 * const urgent = notifications.dequeue() // 'Job match!'
 */
