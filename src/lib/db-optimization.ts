import { PrismaClient } from '@prisma/client';
import { dbCache, generateCacheKey, withCache } from './cache';

// Connection pooling configuration
const createPrismaClient = () => {
  return new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
};

// Global database connection with connection pooling
declare global {
  var __prisma: PrismaClient | undefined;
}

export const prisma = globalThis.__prisma || createPrismaClient();

if (process.env.NODE_ENV === 'development') {
  globalThis.__prisma = prisma;
}

// Query optimization utilities
export class QueryBuilder {
  private includes: Record<string, any> = {};
  private select: Record<string, any> = {};
  private where: Record<string, any> = {};
  private orderBy: Record<string, any> = {};
  private take?: number;
  private skip?: number;

  include(relations: Record<string, any>): this {
    this.includes = { ...this.includes, ...relations };
    return this;
  }

  selectFields(fields: Record<string, any>): this {
    this.select = { ...this.select, ...fields };
    return this;
  }

  whereCondition(conditions: Record<string, any>): this {
    this.where = { ...this.where, ...conditions };
    return this;
  }

  orderByFields(order: Record<string, any>): this {
    this.orderBy = { ...this.orderBy, ...order };
    return this;
  }

  limit(limit: number): this {
    this.take = limit;
    return this;
  }

  offset(offset: number): this {
    this.skip = offset;
    return this;
  }

  build() {
    const query: any = {};
    
    if (Object.keys(this.where).length > 0) {
      query.where = this.where;
    }
    
    if (Object.keys(this.includes).length > 0) {
      query.include = this.includes;
    }
    
    if (Object.keys(this.select).length > 0) {
      query.select = this.select;
    }
    
    if (Object.keys(this.orderBy).length > 0) {
      query.orderBy = this.orderBy;
    }
    
    if (this.take !== undefined) {
      query.take = this.take;
    }
    
    if (this.skip !== undefined) {
      query.skip = this.skip;
    }
    
    return query;
  }
}

// Optimized database operations
export class OptimizedDatabase {
  // Cached user operations
  @withCache(
    dbCache,
    (id: string) => generateCacheKey('user', id),
    1000 * 60 * 30 // 30 minutes
  )
  static async findUserById(id: string) {
    return await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        picture: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  @withCache(
    dbCache,
    (email: string) => generateCacheKey('user:email', email),
    1000 * 60 * 15 // 15 minutes
  )
  static async findUserByEmail(email: string) {
    return await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        picture: true,
        password: true,
      },
    });
  }

  // Batch operations for efficiency
  static async findUsersByIds(ids: string[]) {
    const cacheKeys = ids.map(id => generateCacheKey('user', id));
    const cachedUsers: any[] = [];
    const uncachedIds: string[] = [];

    // Check cache for each user
    ids.forEach((id, index) => {
      const cached = dbCache.get(cacheKeys[index]);
      if (cached) {
        cachedUsers[index] = cached;
      } else {
        uncachedIds.push(id);
      }
    });

    // Fetch uncached users
    if (uncachedIds.length > 0) {
      const freshUsers = await prisma.user.findMany({
        where: { id: { in: uncachedIds } },
        select: {
          id: true,
          email: true,
          name: true,
          picture: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      // Cache fresh users and merge with cached ones
      freshUsers.forEach(user => {
        const cacheKey = generateCacheKey('user', user.id);
        dbCache.set(cacheKey, user);
        
        const originalIndex = ids.indexOf(user.id);
        if (originalIndex !== -1) {
          cachedUsers[originalIndex] = user;
        }
      });
    }

    return cachedUsers.filter(Boolean);
  }

  // Paginated queries with caching
  static async getPaginatedUsers(page: number = 1, limit: number = 10) {
    const cacheKey = generateCacheKey('users:paginated', page, limit);
    
    if (dbCache.has(cacheKey)) {
      return dbCache.get(cacheKey);
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          email: true,
          name: true,
          picture: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count(),
    ]);

    const result = {
      users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    dbCache.set(cacheKey, result, 1000 * 60 * 5); // 5 minutes
    return result;
  }

  // Transaction helpers
  static async withTransaction<T>(
    callback: (prisma: PrismaClient) => Promise<T>
  ): Promise<T> {
    return await prisma.$transaction(callback);
  }

  // Connection health check
  static async healthCheck(): Promise<boolean> {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }

  // Query performance monitoring
  static async measureQuery<T>(
    queryName: string,
    queryFn: () => Promise<T>
  ): Promise<T> {
    const start = performance.now();
    
    try {
      const result = await queryFn();
      const duration = performance.now() - start;
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`Query "${queryName}" took ${duration.toFixed(2)}ms`);
      }
      
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      console.error(`Query "${queryName}" failed after ${duration.toFixed(2)}ms:`, error);
      throw error;
    }
  }
}

// Database middleware for automatic caching
export const withDatabaseCache = <T extends any[], R>(
  cacheKey: (...args: T) => string,
  ttl: number = 1000 * 60 * 10
) => {
  return (queryFn: (...args: T) => Promise<R>) => {
    return async (...args: T): Promise<R> => {
      const key = cacheKey(...args);
      
      if (dbCache.has(key)) {
        return dbCache.get<R>(key)!;
      }
      
      const result = await queryFn(...args);
      dbCache.set(key, result, ttl);
      
      return result;
    };
  };
};

// Cache invalidation utilities
export const invalidateUserCache = (userId: string): void => {
  dbCache.delete(generateCacheKey('user', userId));
  dbCache.delete(generateCacheKey('users:paginated')); // Invalidate paginated cache
};

export const invalidateUserCacheByEmail = (email: string): void => {
  dbCache.delete(generateCacheKey('user:email', email));
};

// Cleanup function
export const disconnectDatabase = async (): Promise<void> => {
  await prisma.$disconnect();
};