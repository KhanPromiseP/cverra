
import { Injectable, InternalServerErrorException, Logger, BadRequestException } from "@nestjs/common";
import { Prisma, User } from "@prisma/client";
import { UserWithSecrets } from "@reactive-resume/dto";
import { ErrorMessage } from "@reactive-resume/utils";
import { PrismaService } from "nestjs-prisma";

import { StorageService } from "../storage/storage.service";

@Injectable()
export class UserService {
  // Cache configuration - SIMPLIFIED
  private readonly cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_CACHE_SIZE = 500; // Reduced from 1000

  // Request-level cache to prevent multiple hits per request
  private requestCache = new Map<string, Promise<any>>();
  
  // Statistics for debugging (optional)
  private stats = {
    cacheHits: 0,
    cacheMisses: 0,
    requestsServed: 0,
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  // Clear request cache at the end of each request (call this from interceptor)
  clearRequestCache() {
    this.requestCache.clear();
  }

  // Get cache statistics (for monitoring)
  getCacheStats() {
    return {
      ...this.stats,
      cacheSize: this.cache.size,
      hitRate: this.stats.cacheHits + this.stats.cacheMisses > 0 
        ? (this.stats.cacheHits / (this.stats.cacheHits + this.stats.cacheMisses) * 100).toFixed(1) + '%'
        : '0%',
    };
  }

  // OPTIMIZED: Get user by ID with request-level deduplication
  async findOneById(id: string): Promise<UserWithSecrets> {
    this.stats.requestsServed++;
    
    // Check request cache first (prevents multiple calls in same request)
    const requestCacheKey = `req:user:${id}`;
    if (this.requestCache.has(requestCacheKey)) {
      return this.requestCache.get(requestCacheKey);
    }

    // Create the promise and store it in request cache
    const userPromise = this.findUserByIdInternal(id);
    this.requestCache.set(requestCacheKey, userPromise);
    
    return userPromise;
  }

  // Internal method - actual user fetching
  private async findUserByIdInternal(id: string): Promise<UserWithSecrets> {
    const cacheKey = `user:${id}`;
    
    // Check persistent cache
    const cached = this.getFromPersistentCache<UserWithSecrets>(cacheKey);
    if (cached) {
      this.stats.cacheHits++;
      return cached;
    }

    this.stats.cacheMisses++;
    
    // Fetch from database
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id },
      include: { secrets: true },
    });

    if (!user.secrets) {
      throw new InternalServerErrorException(ErrorMessage.SecretsNotFound);
    }

    // Cache the result
    this.setInPersistentCache(cacheKey, user);
    
    // Log only on misses (helps debug performance)
    Logger.debug(`[User Cache] Miss for user ${id}, cached for future requests`);
    
    return user;
  }

  // OPTIMIZED: Get user by email
  async findOneByEmail(email: string): Promise<UserWithSecrets | null> {
    const cacheKey = `user:email:${email}`;
    
    // Check request cache
    const requestCacheKey = `req:user:email:${email}`;
    if (this.requestCache.has(requestCacheKey)) {
      return this.requestCache.get(requestCacheKey);
    }

    const userPromise = (async () => {
      // Check persistent cache
      const cached = this.getFromPersistentCache<UserWithSecrets>(cacheKey);
      if (cached) {
        this.stats.cacheHits++;
        return cached;
      }

      this.stats.cacheMisses++;
      
      const user = await this.prisma.user.findUnique({
        where: { email },
        include: { secrets: true },
      });

      if (user) {
        this.setInPersistentCache(cacheKey, user);
        // Also cache by ID
        this.setInPersistentCache(`user:${user.id}`, user);
      }

      return user;
    })();

    this.requestCache.set(requestCacheKey, userPromise);
    return userPromise;
  }

  // OPTIMIZED: Get BASIC user info (for article display - no secrets needed)
  async findBasicUserById(id: string): Promise<any> {
    const cacheKey = `user-basic:${id}`;
    
    // Check request cache
    const requestCacheKey = `req:user-basic:${id}`;
    if (this.requestCache.has(requestCacheKey)) {
      return this.requestCache.get(requestCacheKey);
    }

    const userPromise = (async () => {
      // Check persistent cache
      const cached = this.getFromPersistentCache(cacheKey);
      if (cached) {
        this.stats.cacheHits++;
        return cached;
      }

      this.stats.cacheMisses++;
      
      // Fetch only basic info needed for article display
      const user = await this.prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          username: true,
          picture: true,
          role: true,
          email: true,
          // No secrets needed for article display
        },
      });

      if (user) {
        this.setInPersistentCache(cacheKey, user);
      }

      return user;
    })();

    this.requestCache.set(requestCacheKey, userPromise);
    return userPromise;
  }

  // OPTIMIZED: Find user by identifier
  async findOneByIdentifier(identifier: string): Promise<UserWithSecrets | null> {
    // Check request cache
    const requestCacheKey = `req:user:identifier:${identifier}`;
    if (this.requestCache.has(requestCacheKey)) {
      return this.requestCache.get(requestCacheKey);
    }

    const userPromise = (async () => {
      // Try email cache first
      const emailCacheKey = `user:email:${identifier}`;
      const cachedEmail = this.getFromPersistentCache<UserWithSecrets>(emailCacheKey);
      if (cachedEmail) {
        this.stats.cacheHits++;
        return cachedEmail;
      }

      // Try username cache
      const usernameCacheKey = `user:username:${identifier}`;
      const cachedUsername = this.getFromPersistentCache<UserWithSecrets>(usernameCacheKey);
      if (cachedUsername) {
        this.stats.cacheHits++;
        return cachedUsername;
      }

      this.stats.cacheMisses++;
      
      // Single database query for both email and username
      const user = await this.prisma.user.findFirst({
        where: {
          OR: [
            { email: identifier },
            { username: identifier },
          ],
        },
        include: { secrets: true },
      });

      if (user) {
        // Cache by all identifiers
        this.setInPersistentCache(`user:${user.id}`, user);
        this.setInPersistentCache(`user:email:${user.email}`, user);
        if (user.username) {
          this.setInPersistentCache(`user:username:${user.username}`, user);
        }
      }

      return user;
    })();

    this.requestCache.set(requestCacheKey, userPromise);
    return userPromise;
  }

  // Private cache methods - NO LOGGING
  private getFromPersistentCache<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_TTL) {
      return cached.data;
    }
    
    // Auto-clean expired entries
    if (cached) {
      this.cache.delete(key);
    }
    
    return null;
  }

  private setInPersistentCache(key: string, data: any): void {
    // Clean up only when really needed
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      this.cleanupExpiredCache();
      
      // If still full, remove oldest 10%
      if (this.cache.size >= this.MAX_CACHE_SIZE) {
        const entries = Array.from(this.cache.entries());
        entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
        
        const toRemove = Math.ceil(this.MAX_CACHE_SIZE * 0.1);
        for (let i = 0; i < toRemove && i < entries.length; i++) {
          this.cache.delete(entries[i][0]);
        }
      }
    }
    
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  private cleanupExpiredCache(): void {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.CACHE_TTL) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      Logger.debug(`[User Cache] Cleaned ${cleaned} expired entries`);
    }
  }

  // Clear cache (no logging)
  public clearPersistentCache(key?: string): void {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  // Rest of your methods with proper cache clearing...
  async findOneByIdentifierOrThrow(identifier: string): Promise<UserWithSecrets> {
    const user = await this.findOneByIdentifier(identifier);
    if (!user) {
      throw new InternalServerErrorException("User not found");
    }
    return user;
  }

  // create(data: Prisma.UserCreateInput): Promise<UserWithSecrets> {
  //   const email = data.email as string;
  //   this.clearPersistentCache(`user:email:${email}`);
  //   return this.prisma.user.create({ data, include: { secrets: true } });
  // }


  
  // When user signs up, detect language from browser
async create(data: Prisma.UserCreateInput): Promise<UserWithSecrets> {
  // If user is from French-speaking country or browser language is French
  const browserLanguage = data.locale || 'en-US'; // This should come from frontend
  
  const userData = {
    ...data,
    locale: browserLanguage.startsWith('fr') ? 'fr-FR' : 'en-US'
  };
  
  return this.prisma.user.create({ data: userData, include: { secrets: true } });
}

  updateByEmail(email: string, data: Prisma.UserUpdateArgs["data"]): Promise<User> {
    this.clearPersistentCache(`user:email:${email}`);
    
    return this.prisma.user.update({ where: { email }, data }).then((updatedUser) => {
      this.setInPersistentCache(`user:${updatedUser.id}`, { ...updatedUser, secrets: null });
      this.setInPersistentCache(`user:email:${updatedUser.email}`, { ...updatedUser, secrets: null });
      return updatedUser;
    });
  }

  async updateByResetToken(
    resetToken: string,
    data: Prisma.SecretsUpdateArgs["data"],
  ): Promise<void> {
    const secret = await this.prisma.secrets.findUnique({
      where: { resetToken },
      include: { user: true },
    });

    if (secret?.user) {
      this.clearPersistentCache(`user:${secret.user.id}`);
      this.clearPersistentCache(`user:email:${secret.user.email}`);
      if (secret.user.username) {
        this.clearPersistentCache(`user:username:${secret.user.username}`);
      }
    }

    await this.prisma.secrets.update({ where: { resetToken }, data });
  }

  async deleteOneById(id: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { email: true, username: true },
    });

    await Promise.all([
      this.storageService.deleteFolder(id),
      this.prisma.user.delete({ where: { id } }),
    ]);

    this.clearPersistentCache(`user:${id}`);
    if (user?.email) this.clearPersistentCache(`user:email:${user.email}`);
    if (user?.username) this.clearPersistentCache(`user:username:${user.username}`);
  }

  // Batch method for getting multiple users at once
  async findManyByIds(ids: string[]): Promise<UserWithSecrets[]> {
    const result: UserWithSecrets[] = [];
    const missingIds: string[] = [];

    // Check cache for all IDs
    for (const id of ids) {
      const cached = this.getFromPersistentCache<UserWithSecrets>(`user:${id}`);
      if (cached) {
        result.push(cached);
      } else {
        missingIds.push(id);
      }
    }

    // If all cached, return immediately
    if (missingIds.length === 0) {
      return result.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
    }

    // Fetch missing users
    if (missingIds.length > 0) {
      const users = await this.prisma.user.findMany({
        where: { id: { in: missingIds } },
        include: { secrets: true },
      });

      // Cache and add to result
      for (const user of users) {
        this.setInPersistentCache(`user:${user.id}`, user);
        result.push(user);
      }
    }

    return result.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
  }




  async updateUserLocale(userId: string, locale: string): Promise<void> {
  // Validate locale is supported
  const supportedLocales = ['en', 'en-US', 'fr', 'fr-FR', 'fr-CA'];
  
  if (!supportedLocales.includes(locale)) {
    throw new BadRequestException(`Unsupported locale: ${locale}`);
  }

  // Update in database
  await this.prisma.user.update({
    where: { id: userId },
    data: { locale }
  });

  // Clear all user caches - IMPORTANT!
  this.clearPersistentCache(`user:${userId}`);
  
  // Also clear from any other cache entries
  const user = await this.prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, username: true }
  });
  
  if (user?.email) this.clearPersistentCache(`user:email:${user.email}`);
  if (user?.username) this.clearPersistentCache(`user:username:${user.username}`);
  
  // Clear request cache too
  this.requestCache.clear();
  
  // Log for debugging
  Logger.debug(`[UserService] Updated locale for user ${userId} to ${locale}`);
}


// Public method to clear user cache (for locale updates)
  public clearUserCache(userId: string): void {
    // Clear from persistent cache
    this.clearPersistentCache(`user:${userId}`);
    
    // Try to get email and username to clear those too
    // You might want to store this info in a separate cache
    this.clearPersistentCache(`user-basic:${userId}`);
    
    // Clear from request cache
    this.clearRequestCacheForUser(userId);
  }

  // Helper to clear request cache for specific user
  private clearRequestCacheForUser(userId: string): void {
    const keysToDelete: string[] = [];
    
    for (const key of this.requestCache.keys()) {
      if (key.includes(`:user:${userId}`) || key.includes(`user:${userId}`)) {
        keysToDelete.push(key);
      }
    }
    
    for (const key of keysToDelete) {
      this.requestCache.delete(key);
    }
  }

  
}


// import { Injectable, InternalServerErrorException } from "@nestjs/common";
// import { Prisma, User } from "@prisma/client";
// import { UserWithSecrets } from "@reactive-resume/dto";
// import { ErrorMessage } from "@reactive-resume/utils";
// import { PrismaService } from "nestjs-prisma";

// import { StorageService } from "../storage/storage.service";

// @Injectable()
// export class UserService {
//   constructor(
//     private readonly prisma: PrismaService,
//     private readonly storageService: StorageService,
//   ) {}

//   async findOneById(id: string): Promise<UserWithSecrets> {
//     const user = await this.prisma.user.findUniqueOrThrow({
//       where: { id },
//       include: { secrets: true },
//     });

//     if (!user.secrets) {
//       throw new InternalServerErrorException(ErrorMessage.SecretsNotFound);
//     }

//     return user;
//   }

//   async findOneByIdentifier(identifier: string): Promise<UserWithSecrets | null> {
//     const user = await (async (identifier: string) => {
//       // First, find the user by email
//       const user = await this.prisma.user.findUnique({
//         where: { email: identifier },
//         include: { secrets: true },
//       });

//       // If the user exists, return it
//       if (user) return user;

//       // Otherwise, find the user by username
//       // If the user doesn't exist, throw an error
//       return this.prisma.user.findUnique({
//         where: { username: identifier },
//         include: { secrets: true },
//       });
//     })(identifier);

//     return user;
//   }

//   async findOneByIdentifierOrThrow(identifier: string): Promise<UserWithSecrets> {
//     const user = await (async (identifier: string) => {
//       // First, find the user by email
//       const user = await this.prisma.user.findUnique({
//         where: { email: identifier },
//         include: { secrets: true },
//       });

//       // If the user exists, return it
//       if (user) return user;

//       // Otherwise, find the user by username
//       // If the user doesn't exist, throw an error
//       return this.prisma.user.findUniqueOrThrow({
//         where: { username: identifier },
//         include: { secrets: true },
//       });
//     })(identifier);

//     return user;
//   }

//   create(data: Prisma.UserCreateInput): Promise<UserWithSecrets> {
//     return this.prisma.user.create({ data, include: { secrets: true } });
//   }

//   updateByEmail(email: string, data: Prisma.UserUpdateArgs["data"]): Promise<User> {
//     return this.prisma.user.update({ where: { email }, data });
//   }

//   async updateByResetToken(
//     resetToken: string,
//     data: Prisma.SecretsUpdateArgs["data"],
//   ): Promise<void> {
//     await this.prisma.secrets.update({ where: { resetToken }, data });
//   }

//   async deleteOneById(id: string): Promise<void> {
//     await Promise.all([
//       this.storageService.deleteFolder(id),
//       this.prisma.user.delete({ where: { id } }),
//     ]);
//   }
// }
