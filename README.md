# Clipers Frontend

Aplicación frontend para la plataforma Clipers, desarrollada en Next.js + React.

## 📦 Estructuras de Datos Utilizadas en el Frontend

A continuación se detallan, línea por línea y con ejemplos, las principales estructuras de datos empleadas en el frontend del proyecto, especificando cómo, dónde y para qué se utilizan:

### 1. Interfaces y Tipos de TypeScript
- **Dónde:** Archivo `lib/types.ts` y en los props de componentes.
- **Cómo:** Se definen interfaces como `User`, `Company`, `Cliper`, `Job`, `Post`, `Comment`, `ATSProfile`, `Education`, `Experience`, `Skill`, `Language`, `JobMatch`, `JobApplication`, `AIMatchData`, `MatchBreakdown`, `AuthResponse`, `ApiResponse<T>`, `PaginatedResponse<T>`, entre otras.
- **Para qué:** Modelan la forma de los datos que viajan entre componentes, stores y API. Permiten tipado estático, autocompletado y validación en tiempo de desarrollo.
- **Ejemplo:**
  ```ts
  export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: "CANDIDATE" | "COMPANY" | "ADMIN";
    // ...otros campos
  }
  ```

### 2. Arrays
- **Dónde:**
  - En los stores de Zustand (`store/feed-store.ts`, `store/job-store.ts`, `store/profile-store.ts`, `store/dashboard-store.ts`).
  - En los props y estados de componentes (ej: listas de posts, jobs, comentarios, skills, experiencias, etc.).
  - En las interfaces de tipos (ej: `skills: Skill[]`, `experience: Experience[]`, `posts: Post[]`).
- **Cómo:** Se utilizan para almacenar colecciones de entidades y para renderizar listas dinámicas en la UI.
- **Para qué:** Permiten manejar, recorrer y actualizar conjuntos de datos (ej: feed de posts, historial de navegación, lista de notificaciones).
- **Ejemplo:**
  ```ts
  interface FeedState {
    posts: Post[];
    // ...otros campos
  }
  ```
  ```tsx
  {posts.map((post) => (
    <PostCard key={post.id} post={post} />
  ))}
  ```

### 3. Objetos
- **Dónde:**
  - Como entidades modeladas por interfaces (ej: `User`, `Company`, `Job`, etc.).
  - Como filtros y parámetros en stores y hooks (ej: `filters: { location?: string; type?: string }`).
  - Como estado local en componentes.
- **Cómo:** Se usan para agrupar datos relacionados y para representar entidades del dominio.
- **Para qué:** Facilitan el acceso y la actualización de propiedades específicas, así como la transmisión de datos estructurados entre funciones y componentes.
- **Ejemplo:**
  ```ts
  const filters = { location: "Bogotá", type: "FULL_TIME" };
  useJobStore.getState().searchJobs("", filters);
  ```

### 4. Stack (Pila)
- **Dónde:** Archivo `lib/data-structures/stack.ts` y su uso en hooks personalizados (ej: historial de navegación, búsquedas recientes).
- **Cómo:** Implementa una pila genérica con métodos `push`, `pop`, `peek`, `isEmpty`, `size`, `clear`, `toArray`.
- **Para qué:** Permite gestionar el historial de navegación (LIFO), deshacer/rehacer acciones y almacenar búsquedas recientes.
- **Ejemplo:**
  ```ts
  import { Stack } from "@/lib/data-structures"
  const navigationHistory = new Stack<string>(10)
  navigationHistory.push('/feed')
  navigationHistory.push('/jobs')
  const previousPage = navigationHistory.pop() // '/jobs'
  ```

### 5. Queue (Cola)
- **Dónde:** Archivo `lib/data-structures/queue.ts` y su uso en procesamiento de videos, notificaciones, colas de mensajes.
- **Cómo:** Implementa una cola genérica con métodos `enqueue`, `dequeue`, `peek`, `isEmpty`, `size`, `isFull`, `clear`.
- **Para qué:** Permite procesar tareas en orden FIFO, como procesamiento de videos.
- **Ejemplo:**
  ```ts
  import { Queue } from "@/lib/data-structures"
  const videoQueue = new Queue<string>(50)
  videoQueue.enqueue('video-1.mp4')
  const nextVideo = videoQueue.dequeue() // 'video-1.mp4'
  ```

### 6. PriorityQueue (Cola de Prioridad)
- **Dónde:** Archivo `lib/data-structures/queue.ts`.
- **Cómo:** Permite encolar elementos con prioridad, de modo que los de mayor prioridad se procesan primero.
- **Para qué:** Útil para notificaciones urgentes o tareas que requieren orden de prioridad.
- **Ejemplo:**
  ```ts
  import { PriorityQueue } from "@/lib/data-structures"
  const notifications = new PriorityQueue<string>()
  notifications.enqueue('Mensaje', 1)
  notifications.enqueue('Alerta urgente', 3)
  const urgente = notifications.dequeue() // 'Alerta urgente'
  ```

### 7. Map y Record
- **Dónde:**
  - Como `Record<string, string>` en tipos como `AIMatchData` (`detailedAnalysis?: Record<string, string>`).
  - Como `Map` en lógica interna para relaciones clave-valor (menos frecuente, pero soportado por TypeScript y JS).
- **Cómo:** Permiten asociar claves a valores de forma eficiente.
- **Para qué:** Útiles para análisis detallados, conteos, agrupaciones y acceso rápido por clave.
- **Ejemplo:**
  ```ts
  export interface AIMatchData {
    detailedAnalysis?: Record<string, string>
  }
  ```

### 8. Estado Global (Zustand Stores)
- **Dónde:** Carpeta `store/` (`auth-store.ts`, `cliper-store.ts`, `dashboard-store.ts`, `feed-store.ts`, `job-store.ts`, `profile-store.ts`).
- **Cómo:** Se definen estados globales que contienen arrays, objetos y valores primitivos para compartir datos entre componentes.
- **Para qué:** Permite sincronizar la UI y la lógica de negocio en toda la aplicación.
- **Ejemplo:**
  ```ts
  export const useFeedStore = create<FeedState>((set, get) => ({
    posts: [],
    isLoading: false,
    // ...otros campos y métodos
  }))
  ```

### 9. Estado Local (React useState)
- **Dónde:** En componentes funcionales para manejar datos temporales (ej: inputs, selección de filtros, visibilidad de modales).
- **Cómo:** Se usa `useState` para crear y actualizar variables locales.
- **Para qué:** Permite manejar la interactividad y el estado efímero de la UI.
- **Ejemplo:**
  ```tsx
  const [selectedType, setSelectedType] = useState<string>('ALL')
  ```

---

Estas estructuras de datos permiten modelar, almacenar, manipular y renderizar la información de manera eficiente y segura en el frontend, asegurando una experiencia de usuario fluida y un código mantenible.
