// prisma.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      // Increase transaction timeout globally
      transactionOptions: {
        maxWait: 30000, // 30 seconds
        timeout: 30000, // 30 seconds
      },
    });
  }

  async onModuleInit() {
    await this.$connect();
    this.addBigIntMiddleware();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  private addBigIntMiddleware() {
    this.$use(async (params, next) => {
      try {
        const result = await next(params);
        return this.convertBigIntToString(result);
      } catch (error) {
        throw error;
      }
    });
  }

  private convertBigIntToString(obj: any): any {
    if (obj === null || obj === undefined) {
      return obj;
    }

    // Handle BigInt
    if (typeof obj === 'bigint') {
      return obj.toString();
    }

    // Handle arrays
    if (Array.isArray(obj)) {
      return obj.map(item => this.convertBigIntToString(item));
    }

    // Handle Date objects
    if (obj instanceof Date) {
      return obj.toISOString();
    }

    // Handle plain objects
    if (typeof obj === 'object' && obj.constructor === Object) {
      const newObj: any = {};
      for (const [key, value] of Object.entries(obj)) {
        newObj[key] = this.convertBigIntToString(value);
      }
      return newObj;
    }

    // Return primitives as-is
    return obj;
  }
}

// In prisma.service.ts - update the constructor
// import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
// import { PrismaClient } from '@prisma/client';

// @Injectable()
// export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
//   constructor() {
//     super({
//       // Increase transaction timeout globally
//       transactionOptions: {
//         maxWait: 30000, // 30 seconds
//         timeout: 30000, // 30 seconds
//       },
//     });
//   }

//   async onModuleInit() {
//     await this.$connect();
//   }

//   async onModuleDestroy() {
//     await this.$disconnect();
//   }
// }