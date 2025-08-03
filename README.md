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

## USAGE EXAMPLES

```JavaScript

import { SignalArray } from 'signal-array';

// Basic usage

const todos = new SignalArray([
  { id: 1, text: 'Learn reactive patterns', done: false },
  { id: 2, text: 'Build SignalArray', done: false }
]);

// Subscribe to changes
const unsubscribe = todos.subscribe(({ mutations }) => {
  console.log('Todos changed:', mutations);
});

// Deep reactivity
todos[0].done = true; // Triggers update
todos.push({ id: 3, text: 'Ship to production', done: false }); // Also triggers

// Computed values
const completedCount = todos.computed(() =>
  todos.filter(todo => todo.done).length
);

const pendingTodos = todos.derivedFilter(todo => !todo.done);

```

## BATCH UPDATES

```JavaScript

const batchedArray = new SignalArray([], { batchUpdates: true });
batchedArray.push(1);
batchedArray.push(2);
batchedArray.push(3); // Only one update notification

```

## COMPUTED VALUES: Advanced Computed Value Examples

```JavaScript

import { SignalArray } from 'signal-array';

// Sample data: Shopping cart
const cart = new SignalArray([
  { id: 1, name: 'Laptop', price: 999.99, quantity: 1, category: 'electronics' },
  { id: 2, name: 'Mouse', price: 29.99, quantity: 2, category: 'electronics' },
  { id: 3, name: 'Coffee', price: 12.99, quantity: 3, category: 'food' },
  { id: 4, name: 'Notebook', price: 4.99, quantity: 5, category: 'stationery' }
]);

// Computed: Total price
const totalPrice = cart.computed(() => {
  return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
});

console.log('Total Price:', totalPrice.get()); // Total Price: 1116.91

// Computed: Total items count
const totalItems = cart.computed(() => {
  return cart.reduce((sum, item) => sum + item.quantity, 0);
});

console.log('Total Items:', totalItems.get()); // Total Items: 11

// Computed: Average price per item
const averagePrice = cart.computed(() => {
  const total = totalPrice.get();
  const count = totalItems.get();
  return count > 0 ? total / count : 0;
});

console.log('Average Price:', averagePrice.get()); // Average Price: 101.54

```

## FILTERED COMPUTED VALUES

```JavaScript

// Computed: Items by category
const electronicsItems = cart.computed(() => {
  return cart.filter(item => item.category === 'electronics');
});

const foodItems = cart.computed(() => {
  return cart.filter(item => item.category === 'food');
});

// Computed: Expensive items (> $50)
const expensiveItems = cart.computed(() => {
  return cart.filter(item => item.price > 50);
});

// Computed: Items running low (quantity < 3)
const lowStockItems = cart.computed(() => {
  return cart.filter(item => item.quantity < 3);
});

```

## GROUPED COMPUTED VALUES

```JavaScript

// Computed: Group items by category
const itemsByCategory = cart.computed(() => {
  return cart.reduce((groups, item) => {
    const category = item.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(item);
    return groups;
  }, {});
});

console.log('Items by Category:', itemsByCategory.get());
// { electronics: [...], food: [...], stationery: [...] }

// Computed: Category totals
const categoryTotals = cart.computed(() => {
  const groups = itemsByCategory.get();
  const totals = {};

  for (const [category, items] of Object.entries(groups)) {
    totals[category] = items.reduce((sum, item) =>
      sum + (item.price * item.quantity), 0
    );
  }

  return totals;
});

console.log('Category Totals:', categoryTotals.get());
// { electronics: 1089.97, food: 38.97, stationery: 24.95 }

```

## STATISTICAL COMPUTED VALUES

```JavaScript

// Computed: Price statistics
const priceStats = cart.computed(() => {
  const prices = cart.map(item => item.price);
  const sorted = [...prices].sort((a, b) => a - b);
  const len = sorted.length;

  return {
    min: Math.min(...prices),
    max: Math.max(...prices),
    median: len % 2 === 0
      ? (sorted[len/2 - 1] + sorted[len/2]) / 2
      : sorted[Math.floor(len/2)],
    mean: prices.reduce((a, b) => a + b, 0) / len,
    total: prices.reduce((a, b) => a + b, 0)
  };
});

console.log('Price Statistics:', priceStats.get());

// Computed: Quantity distribution
const quantityDistribution = cart.computed(() => {
  const distribution = {};

  cart.forEach(item => {
    const range = item.quantity < 3 ? 'low' :
                  item.quantity < 5 ? 'medium' : 'high';
    distribution[range] = (distribution[range] || 0) + 1;
  });

  return distribution;
});

```

## DERIVED ARRAYS WITH TRANSFORMATIONS

```JavaScript

// Derived: Items with calculated total price
const itemsWithTotal = cart.derivedMap(item => ({
  ...item,
  total: item.price * item.quantity,
  formattedPrice: `$${item.price.toFixed(2)}`,
  formattedTotal: `$${(item.price * item.quantity).toFixed(2)}`
}));

// Derived: Sorted by total price (descending)
const sortedByValue = new SignalArray([]);
cart.subscribe(() => {
  const sorted = [...cart.data].sort((a, b) =>
    (b.price * b.quantity) - (a.price * a.quantity)
  );
  sortedByValue.data = sorted;
  sortedByValue.notify('sorted', { source: 'value' });
});

```

## COMPLEX COMPUTED CHAINS

```JavaScript

// Computed: Discount calculation based on total
const discount = cart.computed(() => {
  const total = totalPrice.get();
  if (total > 1000) return 0.15;      // 15% off
  if (total > 500) return 0.10;       // 10% off
  if (total > 100) return 0.05;       // 5% off
  return 0;
});

// Computed: Final price after discount
const finalPrice = cart.computed(() => {
  const total = totalPrice.get();
  const discountRate = discount.get();
  return total * (1 - discountRate);
});

// Computed: Savings amount
const savings = cart.computed(() => {
  return totalPrice.get() - finalPrice.get();
});

// Computed: Order summary
const orderSummary = cart.computed(() => {
  return {
    items: totalItems.get(),
    subtotal: totalPrice.get(),
    discountPercentage: (discount.get() * 100) + '%',
    discountAmount: savings.get(),
    total: finalPrice.get(),
    formattedTotal: `$${finalPrice.get().toFixed(2)}`
  };
});

console.log('Order Summary:', orderSummary.get());


```

## SEARCH AND FILTER COMPUTEDS

```JavaScript

// Search functionality
let searchTerm = '';

const searchResults = cart.computed(() => {
  if (!searchTerm) return cart.data;

  const term = searchTerm.toLowerCase();
  return cart.filter(item =>
    item.name.toLowerCase().includes(term) ||
    item.category.toLowerCase().includes(term)
  );
});

// Update search
function updateSearch(term) {
  searchTerm = term;
  // Trigger recomputation
  cart.notify('search', { term });
}

```

## VALIDATION COMPUTED VALUES

```JavaScript

// Computed: Validation status
const validationStatus = cart.computed(() => {
  const errors = [];
  const warnings = [];

  cart.forEach((item, index) => {
    if (item.quantity <= 0) {
      errors.push(`Item at index ${index} has invalid quantity`);
    }
    if (item.price <= 0) {
      errors.push(`Item at index ${index} has invalid price`);
    }
    if (item.quantity > 100) {
      warnings.push(`Item at index ${index} has unusually high quantity`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    hasWarnings: warnings.length > 0
  };
});

```

## TIME-BASED COMPUTED VALUES

```JavaScript

// Track when items were added
const itemsWithTimestamp = new SignalArray([]);

// Computed: Recent items (last 5 minutes)
const recentItems = itemsWithTimestamp.computed(() => {
  const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
  return itemsWithTimestamp.filter(item =>
    item.addedAt > fiveMinutesAgo
  );
});

// Computed: Items added today
const todaysItems = itemsWithTimestamp.computed(() => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return itemsWithTimestamp.filter(item =>
    item.addedAt >= today.getTime()
  );
});

```

## NESTED COMPUTED VALUES

```JavaScript

// Example: Task management with subtasks
const tasks = new SignalArray([
  {
    id: 1,
    title: 'Project A',
    subtasks: [
      { id: 11, title: 'Design', done: true },
      { id: 12, title: 'Implementation', done: false },
      { id: 13, title: 'Testing', done: false }
    ]
  },
  {
    id: 2,
    title: 'Project B',
    subtasks: [
      { id: 21, title: 'Research', done: true },
      { id: 22, title: 'Development', done: true }
    ]
  }
]);

// Computed: Task completion status
const taskCompletionStatus = tasks.computed(() => {
  return tasks.map(task => {
    const total = task.subtasks.length;
    const completed = task.subtasks.filter(st => st.done).length;

    return {
      id: task.id,
      title: task.title,
      progress: total > 0 ? completed / total : 0,
      percentComplete: total > 0 ? Math.round((completed / total) * 100) : 0,
      isComplete: completed === total,
      remaining: total - completed
    };
  });
});

// Computed: Overall progress
const overallProgress = tasks.computed(() => {
  let totalSubtasks = 0;
  let completedSubtasks = 0;

  tasks.forEach(task => {
    totalSubtasks += task.subtasks.length;
    completedSubtasks += task.subtasks.filter(st => st.done).length;
  });

  return {
    total: totalSubtasks,
    completed: completedSubtasks,
    percentage: totalSubtasks > 0
      ? Math.round((completedSubtasks / totalSubtasks) * 100)
      : 0
  };
});

```

## MEMOIZED COMPUTED VALUES

```JavaScript

// Expensive computation with memoization
const expensiveComputation = (() => {
  const cache = new Map();

  return cart.computed(() => {
    // Create cache key from current state
    const cacheKey = JSON.stringify(cart.map(item => ({
      id: item.id,
      price: item.price,
      quantity: item.quantity
    })));

    // Check cache
    if (cache.has(cacheKey)) {
      console.log('Using cached result');
      return cache.get(cacheKey);
    }

    // Expensive calculation
    console.log('Computing expensive result...');
    const result = cart.reduce((acc, item) => {
      // Simulate expensive operation
      let value = 0;
      for (let i = 0; i < 1000; i++) {
        value += Math.sqrt(item.price * item.quantity);
      }
      return acc + value;
    }, 0);

    // Cache result
    cache.set(cacheKey, result);

    // Limit cache size
    if (cache.size > 10) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }

    return result;
  });
})();

```

## REACTIVE COMPUTED DEPENDENCIES

```JavaScript

// External reactive values
const taxRate = { value: 0.08 }; // 8% tax
const shippingRate = { value: 9.99 }; // flat shipping

// Computed with external dependencies
const orderTotal = cart.computed(() => {
  const subtotal = totalPrice.get();
  const tax = subtotal * taxRate.value;
  const shipping = subtotal > 50 ? 0 : shippingRate.value;

  return {
    subtotal,
    tax,
    shipping,
    total: subtotal + tax + shipping,
    breakdown: {
      subtotal: `$${subtotal.toFixed(2)}`,
      tax: `$${tax.toFixed(2)}`,
      shipping: shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`,
      total: `$${(subtotal + tax + shipping).toFixed(2)}`
    }
  };
});

```

## COMPUTED VALUES USAGE EXAMPLES

```JavaScript

// Example 1: Real-time updates
cart.push({ id: 5, name: 'Keyboard', price: 79.99, quantity: 1, category: 'electronics' });
console.log('Updated Total:', totalPrice.get());
console.log('Updated Summary:', orderSummary.get());

// Example 2: Modify existing item
cart[0].quantity = 2;
cart.notify('quantity', { index: 0 });
console.log('After quantity change:', totalPrice.get());

// Example 3: Batch operations
const updates = () => {
  cart[1].price = 34.99;
  cart[2].quantity = 5;
  cart.push({ id: 6, name: 'Tea', price: 8.99, quantity: 2, category: 'food' });
};

// Subscribe to see all changes
const unsubscribe = cart.subscribe(({ mutations }) => {
  console.log('Cart mutations:', mutations);
  console.log('New total:', totalPrice.get());
  console.log('Category totals:', categoryTotals.get());
});

updates();

// Example 4: Reactive chain
console.log('Full order details:', {
  items: cart.map(item => ({
    name: item.name,
    subtotal: (item.price * item.quantity).toFixed(2)
  })),
  summary: orderSummary.get(),
  validation: validationStatus.get()
});

```
