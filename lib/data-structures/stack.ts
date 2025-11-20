/**
 * Stack (Pila) - LIFO (Last In First Out)
 * Useful for: Navigation history, Undo/Redo, Recent searches
 */
export class Stack<T> {
  private items: T[] = []
  private maxSize: number

  constructor(maxSize: number = 50) {
    this.maxSize = maxSize
  }

  /**
   * Add item to top of stack
   */
  push(item: T): void {
    if (this.items.length >= this.maxSize) {
      this.items.shift() // Remove oldest item if max size reached
    }
    this.items.push(item)
  }

  /**
   * Remove and return top item
   */
  pop(): T | undefined {
    return this.items.pop()
  }

  /**
   * View top item without removing
   */
  peek(): T | undefined {
    return this.items[this.items.length - 1]
  }

  /**
   * Check if stack is empty
   */
  isEmpty(): boolean {
    return this.items.length === 0
  }

  /**
   * Get stack size
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

  /**
   * Get all items (for debugging)
   */
  toArray(): T[] {
    return [...this.items]
  }
}

/**
 * Example usage for navigation history:
 * 
 * const navigationHistory = new Stack<string>(10)
 * navigationHistory.push('/feed')
 * navigationHistory.push('/jobs')
 * navigationHistory.push('/profile')
 * 
 * const previousPage = navigationHistory.pop() // '/profile'
 * const currentPage = navigationHistory.peek() // '/jobs'
 */
