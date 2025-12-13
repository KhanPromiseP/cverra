// category.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../tools/prisma/prisma.service';
// import { slugify } from '../auth/utils/slugify';
import { slugifyWithUnicode as slugify } from '../auth/utils/slugify';

@Injectable()
export class CategoryService {
  constructor(private prisma: PrismaService) {}

  async getAllCategories() {
    return this.prisma.articleCategory.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    });
  }

  async getCategoryWithArticles(slug: string, page: number = 1, limit: number = 20) {
    const category = await this.prisma.articleCategory.findUnique({
      where: { slug, isActive: true },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const skip = (page - 1) * limit;

    const [articles, total] = await Promise.all([
      this.prisma.article.findMany({
        where: {
          categoryId: category.id,
          status: 'PUBLISHED',
        },
        skip,
        take: limit,
        orderBy: {
          publishedAt: 'desc',
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              username: true,
              picture: true,
            },
          },
        },
      }),
      this.prisma.article.count({
        where: {
          categoryId: category.id,
          status: 'PUBLISHED',
        },
      }),
    ]);

    return {
      category,
      articles,
      total,
      page,
      limit,
      hasMore: total > skip + limit,
    };
  }

  async createCategory(dto: any) {
    const slug = slugify(dto.name);
    
    // Get max order
    const maxOrder = await this.prisma.articleCategory.aggregate({
      _max: { order: true },
    });
    
    return this.prisma.articleCategory.create({
      data: {
        ...dto,
        slug,
        order: maxOrder._max.order ? maxOrder._max.order + 1 : 1,
      },
    });
  }

  async updateCategory(id: string, dto: any) {
    const data: any = { ...dto };
    
    if (dto.name) {
      data.slug = slugify(dto.name);
    }

    return this.prisma.articleCategory.update({
      where: { id },
      data,
    });
  }

  // category.service.ts - ADD THIS METHOD
async deleteCategory(id: string) {
  // Check if category has articles
  const articleCount = await this.prisma.article.count({
    where: { categoryId: id },
  });

  if (articleCount > 0) {
    // Soft delete if there are articles
    return this.prisma.articleCategory.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // Hard delete if no articles
  return this.prisma.articleCategory.delete({
    where: { id },
  });
}
}