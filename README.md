# signal-array
The SignalArray provides an elegant balance between simplicity and power, making array reactivity as natural as working with regular JavaScript arrays while providing the reactive benefits developers expect from modern frameworks.

- Fine-grained tracking - Tracks individual indices and properties
- Deep reactivity - Nested objects and arrays are automatically reactive
- Mutation tracking - Intercepts array methods and provides detailed change information
- Computed values - Supports derived arrays that update automatically
- Batched updates - Option to batch multiple changes into single notifications
- Performance optimized - Only notifies relevant subscribers

Key Features:

- Proxy-based for transparent array access
- Method interception for push, pop, splice, etc.
- Deep object reactivity for nested data
- Computed/derived arrays that stay in sync
- Flexible subscription model with detailed change info
- Minimal API surface while being powerful

```JavaScript
// ============================================================================
// USAGE EXAMPLES
// ============================================================================

// Example 1: Basic usage
const todos = new SignalArray([
  { id: 1, text: 'Learn reactive patterns', done: false },
  { id: 2, text: 'Build SignalArray', done: false }
]);

// Subscribe to changes
const unsubscribe = todos.subscribe(({ mutations }) => {
  console.log('Todos changed:', mutations);
});

// Example 2: Deep reactivity
todos[0].done = true; // Triggers update
todos.push({ id: 3, text: 'Ship to production', done: false }); // Also triggers

// Example 3: Computed values
const completedCount = todos.computed(() =>
  todos.filter(todo => todo.done).length
);

const pendingTodos = todos.derivedFilter(todo => !todo.done);

// Example 4: Batch updates
const batchedArray = new SignalArray([], { batchUpdates: true });
batchedArray.push(1);
batchedArray.push(2);
batchedArray.push(3); // Only one update notification

```
