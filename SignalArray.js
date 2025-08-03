export class SignalArray {

  constructor(initial = [], options = {}) {
    this.data = initial;
    this.options = {
      deep: true,
      trackMutations: true,
      ...options
    };

    this.subscribers = new Map(); // id -> callback
    this.computeds = new Map(); // id -> computed
    this.version = 0;
    this.mutationQueue = [];
    this.scheduledUpdate = null;

    return this.createProxy();
  }

  createProxy() {
    const handler = {
      get: (target, prop) => {
        // Array length
        if (prop === 'length') {
          this.track('length');
          return this.data.length;
        }

        // Array indices
        if (typeof prop === 'string' && !isNaN(prop)) {
          this.track(`index:${prop}`);
          const value = this.data[prop];

          // Deep reactivity
          if (this.options.deep && typeof value === 'object' && value !== null) {
            return this.makeReactive(value, `${prop}`);
          }

          return value;
        }

        // Array methods
        if (prop in Array.prototype) {
          return this.wrapArrayMethod(prop);
        }

        // Custom methods
        if (prop in this) {
          return this[prop].bind(this);
        }

        return undefined;
      },

      set: (target, prop, value) => {
        if (prop === 'length') {
          const oldLength = this.data.length;
          this.data.length = value;
          this.notify('length', { oldValue: oldLength, newValue: value });
          return true;
        }

        if (typeof prop === 'string' && !isNaN(prop)) {
          const index = Number(prop);
          const oldValue = this.data[index];
          this.data[index] = value;
          this.notify(`index:${index}`, { index, oldValue, newValue: value });
          return true;
        }

        return false;
      },

      has: (target, prop) => {
        return prop in this.data || prop in this;
      }
    };

    return new Proxy(this, handler);
  }

  makeReactive(obj, path = '') {
    if (Array.isArray(obj)) {
      return new SignalArray(obj, this.options);
    }

    if (typeof obj === 'object' && obj !== null) {
      return new Proxy(obj, {
        get: (target, prop) => {
          this.track(`${path}.${prop}`);
          const value = target[prop];

          if (this.options.deep && typeof value === 'object' && value !== null) {
            return this.makeReactive(value, `${path}.${prop}`);
          }

          return value;
        },
        set: (target, prop, value) => {
          const oldValue = target[prop];
          target[prop] = value;
          this.notify(`${path}.${prop}`, { path: `${path}.${prop}`, oldValue, newValue: value });
          return true;
        }
      });
    }

    return obj;
  }

  wrapArrayMethod(method) {
    const self = this;

    return function(...args) {
      const oldLength = self.data.length;
      const oldArray = [...self.data];

      // Execute method
      const result = Array.prototype[method].apply(self.data, args);

      // Track mutations
      if (self.options.trackMutations && ['push', 'pop', 'shift', 'unshift', 'splice', 'sort', 'reverse'].includes(method)) {
        const mutation = {
          type: method,
          args,
          oldLength,
          newLength: self.data.length,
          oldArray,
          newArray: [...self.data]
        };

        self.queueMutation(mutation);
      }

      return result;
    };
  }

  track(key) {
    // Track in current computation context
    if (globalThis.currentEffect) {
      globalThis.currentEffect.dependencies.add({ target: this, key });
    }
  }

  notify(key, change) {
    this.version++;

    // Batch mutations
    if (this.options.batchUpdates) {
      this.scheduleUpdate();
    } else {
      this.runUpdate(key, change);
    }
  }

  queueMutation(mutation) {
    this.mutationQueue.push(mutation);
    this.notify('mutation', mutation);
  }

  scheduleUpdate() {
    if (!this.scheduledUpdate) {
      this.scheduledUpdate = queueMicrotask(() => {
        this.flushUpdates();
        this.scheduledUpdate = null;
      });
    }
  }

  flushUpdates() {
    const mutations = [...this.mutationQueue];
    this.mutationQueue = [];

    // Notify subscribers
    this.subscribers.forEach(callback => {
      callback({ mutations, version: this.version });
    });

    // Update computeds
    this.computeds.forEach(computed => {
      computed.dirty = true;
    });
  }

  runUpdate(key, change) {
    // Immediate update
    this.subscribers.forEach(callback => {
      callback({ key, change, version: this.version });
    });
  }

  // Public API
  subscribe(callback) {
    const id = Symbol();
    this.subscribers.set(id, callback);

    return () => {
      this.subscribers.delete(id);
    };
  }

  computed(fn) {
    const computed = {
      id: Symbol(),
      fn,
      value: undefined,
      dirty: true,
      dependencies: new Set(),

      get() {
        if (this.dirty) {
          const prevEffect = globalThis.currentEffect;
          globalThis.currentEffect = this;

          this.value = this.fn();
          this.dirty = false;

          globalThis.currentEffect = prevEffect;
        }
        return this.value;
      }
    };

    this.computeds.set(computed.id, computed);
    return computed;
  }

  // Utility methods
  map(fn) {
    this.track('map');
    return this.data.map(fn);
  }

  filter(fn) {
    this.track('filter');
    return this.data.filter(fn);
  }

  reduce(fn, initial) {
    this.track('reduce');
    return this.data.reduce(fn, initial);
  }

  find(fn) {
    this.track('find');
    return this.data.find(fn);
  }

  findIndex(fn) {
    this.track('findIndex');
    return this.data.findIndex(fn);
  }

  includes(value) {
    this.track('includes');
    return this.data.includes(value);
  }

  slice(start, end) {
    this.track('slice');
    return this.data.slice(start, end);
  }

  // Reactive derived arrays
  derivedMap(fn) {
    const derived = new SignalArray([], this.options);

    this.subscribe(() => {
      derived.data = this.data.map(fn);
      derived.notify('derived', { source: 'map' });
    });

    return derived;
  }

  derivedFilter(fn) {
    const derived = new SignalArray([], this.options);

    this.subscribe(() => {
      derived.data = this.data.filter(fn);
      derived.notify('derived', { source: 'filter' });
    });

    return derived;
  }
}
