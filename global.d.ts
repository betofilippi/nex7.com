// Global type definitions for missing TypeScript types

// AsyncIterator types for ES2018+ features
type AsyncIterableIterator<T> = AsyncIterable<T> & AsyncIterator<T>;

// AsyncGenerator type for ES2018+ features  
type AsyncGenerator<T = unknown, TReturn = any, TNext = unknown> = AsyncIterator<T, TReturn, TNext> & AsyncIterable<T>;

// Node.js global types for process object
declare var process: {
  env: Record<string, string | undefined>;
  cwd(): string;
  argv: string[];
  platform: string;
  version: string;
  versions: Record<string, string>;
  exit(code?: number): never;
};

// Global require function for Node.js
declare var require: NodeRequire;

interface NodeRequire {
  (id: string): any;
  resolve(id: string): string;
  cache: any;
  extensions: any;
  main: NodeModule | undefined;
}

// Jest global types for testing
declare var jest: any;
declare var describe: any;
declare var it: any;
declare var test: any;
declare var expect: any;
declare var beforeEach: any;
declare var afterEach: any;
declare var beforeAll: any;
declare var afterAll: any;

// Extend ObjectConstructor with modern methods
interface ObjectConstructor {
  entries<T>(o: { [s: string]: T } | ArrayLike<T>): [string, T][];
  entries(o: {}): [string, any][];
  values<T>(o: { [s: string]: T } | ArrayLike<T>): T[];
  values(o: {}): any[];
}

// Extend PromiseConstructor with modern methods
interface PromiseConstructor {
  allSettled<T>(values: readonly (T | PromiseLike<T>)[]): Promise<{ status: 'fulfilled'; value: T; } | { status: 'rejected'; reason: any; }[]>;
}

// Extend Array prototype with modern methods
interface Array<T> {
  includes(searchElement: T, fromIndex?: number): boolean;
  find<S extends T>(predicate: (this: void, value: T, index: number, obj: T[]) => value is S, thisArg?: any): S | undefined;
  find(predicate: (value: T, index: number, obj: T[]) => unknown, thisArg?: any): T | undefined;
}