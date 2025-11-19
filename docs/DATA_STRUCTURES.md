# Data Structures - Clipers Platform

## Overview
This document describes the data structures implemented in the Clipers platform and their practical applications.

## Implemented Structures

### 1. Stack (Pila) - LIFO
**Location:** `lib/data-structures/stack.ts`

**Use Cases in Clipers:**
- ✅ Navigation history (back/forward buttons)
- ✅ Undo/Redo functionality in profile editor
- ✅ Recent search history
- ✅ Notification history
- ✅ Breadcrumb navigation

**Example:**
```typescript
import { Stack } from "@/lib/data-structures"

// Navigation history
const navigationHistory = new Stack<string>(10)
navigationHistory.push('/feed')
navigationHistory.push('/jobs')
navigationHistory.push('/profile')

const goBack = () => {
  const previousPage = navigationHistory.pop()
  router.push(previousPage)
}
```

### 2. Queue (Cola) - FIFO
**Location:** `lib/data-structures/queue.ts`

**Use Cases in Clipers:**
- ✅ Video processing queue (clipers)
- ✅ Notification queue
- ✅ Job application processing
- ✅ AI matching queue

**Example:**
```typescript
import { Queue, PriorityQueue } from "@/lib/data-structures"

// Video processing queue
interface VideoJob {
  id: string
  userId: string
  videoUrl: string
  status: 'pending' | 'processing' | 'done'
}

const videoProcessingQueue = new Queue<VideoJob>(100)

// Add video to queue
videoProcessingQueue.enqueue({
  id: 'video-1',
  userId: 'user-123',
  videoUrl: '/uploads/video.mp4',
  status: 'pending'
})

// Process next video
const nextVideo = videoProcessingQueue.dequeue()

// Priority queue for notifications
const notifications = new PriorityQueue<Notification>()
notifications.enqueue({ message: 'New message' }, 1)
notifications.enqueue({ message: 'Job match!' }, 3) // Higher priority
notifications.enqueue({ message: 'Profile view' }, 2)
```



## Practical Implementation Examples

### Example 1: Navigation History Hook
```typescript
// hooks/use-navigation-history.ts
import { useRef } from "react"
import { useRouter } from "next/navigation"
import { Stack } from "@/lib/data-structures"

export function useNavigationHistory() {
  const router = useRouter()
  const history = useRef(new Stack<string>(20))
  
  const navigateTo = (path: string) => {
    history.current.push(window.location.pathname)
    router.push(path)
  }
  
  const goBack = () => {
    const previousPath = history.current.pop()
    if (previousPath) {
      router.push(previousPath)
    } else {
      router.back()
    }
  }
  
  return { navigateTo, goBack, canGoBack: !history.current.isEmpty() }
}
```

### Example 2: Video Processing Queue Store
```typescript
// store/video-queue-store.ts
import { create } from "zustand"
import { Queue } from "@/lib/data-structures"

interface VideoJob {
  id: string
  cliperId: string
  status: 'pending' | 'processing' | 'done' | 'failed'
}

interface VideoQueueState {
  queue: Queue<VideoJob>
  addToQueue: (job: VideoJob) => void
  processNext: () => VideoJob | undefined
  getQueueSize: () => number
}

export const useVideoQueueStore = create<VideoQueueState>((set, get) => ({
  queue: new Queue<VideoJob>(50),
  
  addToQueue: (job) => {
    const { queue } = get()
    queue.enqueue(job)
    set({ queue })
  },
  
  processNext: () => {
    const { queue } = get()
    const job = queue.dequeue()
    set({ queue })
    return job
  },
  
  getQueueSize: () => {
    return get().queue.size()
  }
}))
```

### Example 3: Recent Searches with Stack
```typescript
// hooks/use-recent-searches.ts
import { useRef, useCallback } from "react"
import { Stack } from "@/lib/data-structures"

export function useRecentSearches(maxSearches: number = 10) {
  const searches = useRef(new Stack<string>(maxSearches))
  
  const addSearch = useCallback((query: string) => {
    if (query.trim()) {
      searches.current.push(query.trim())
    }
  }, [])
  
  const getRecentSearches = useCallback(() => {
    return searches.current.toArray().reverse() // Most recent first
  }, [])
  
  const clearSearches = useCallback(() => {
    searches.current.clear()
  }, [])
  
  return { addSearch, getRecentSearches, clearSearches }
}

// Usage in component
function SearchBar() {
  const { addSearch, getRecentSearches } = useRecentSearches()
  const [query, setQuery] = useState("")
  
  const handleSearch = () => {
    addSearch(query)
    // Perform search...
  }
  
  const recentSearches = getRecentSearches()
  
  return (
    <div>
      <input value={query} onChange={(e) => setQuery(e.target.value)} />
      <button onClick={handleSearch}>Search</button>
      
      {recentSearches.length > 0 && (
        <div>
          <h4>Recent Searches:</h4>
          {recentSearches.map((search, i) => (
            <button key={i} onClick={() => setQuery(search)}>
              {search}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
```

## Performance Considerations

### Stack
- Push: O(1)
- Pop: O(1)
- Peek: O(1)
- Space: O(n)

### Queue
- Enqueue: O(1)
- Dequeue: O(1)
- Peek: O(1)
- Space: O(n)

### Priority Queue
- Enqueue: O(n) - needs to find correct position
- Dequeue: O(1)
- Peek: O(1)
- Space: O(n)

## Testing

```typescript
// Example test
import { Stack, Queue, PriorityQueue } from "@/lib/data-structures"

describe('Data Structures', () => {
  test('Stack LIFO behavior', () => {
    const stack = new Stack<number>()
    stack.push(1)
    stack.push(2)
    stack.push(3)
    
    expect(stack.pop()).toBe(3)
    expect(stack.pop()).toBe(2)
    expect(stack.pop()).toBe(1)
  })
  
  test('Queue FIFO behavior', () => {
    const queue = new Queue<number>()
    queue.enqueue(1)
    queue.enqueue(2)
    queue.enqueue(3)
    
    expect(queue.dequeue()).toBe(1)
    expect(queue.dequeue()).toBe(2)
    expect(queue.dequeue()).toBe(3)
  })
  
  test('Priority Queue behavior', () => {
    const pq = new PriorityQueue<string>()
    pq.enqueue('Low priority', 1)
    pq.enqueue('High priority', 3)
    pq.enqueue('Medium priority', 2)
    
    expect(pq.dequeue()).toBe('High priority')
    expect(pq.dequeue()).toBe('Medium priority')
    expect(pq.dequeue()).toBe('Low priority')
  })
})
```

## Best Practices

1. **Use appropriate structure for the use case**
   - Stack for history/undo/recent items
   - Queue for processing jobs in order
   - PriorityQueue for urgent tasks first

2. **Set reasonable size limits**
   - Prevent memory issues with max sizes
   - Clear old data periodically

3. **Type safety**
   - Use TypeScript generics
   - Define clear interfaces

4. **Performance**
   - Use appropriate algorithms (BFS for shortest path)
   - Consider space complexity

5. **Testing**
   - Unit test each structure
   - Test edge cases (empty, full, etc.)
