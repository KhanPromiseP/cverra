// Create a new file: article-response.transformer.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../tools/prisma/prisma.service';

@Injectable()
export class ArticleResponseTransformer {
  constructor(private prisma: PrismaService) {}

  async transform(article: any): Promise<any> {
    // If article already has category and author, return as-is
    if (article.category && article.author) {
      return this.transformUrls(article);
    }
    
    // Fetch missing relations
    const fullArticle = await this.prisma.article.findUnique({
      where: { id: article.id },
      include: {
        category: true,
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            picture: true,
          },
        },
      },
    });
    
    if (!fullArticle) {
      return this.transformUrls(article);
    }
    
    const merged = {
      ...article,
      category: fullArticle.category,
      author: fullArticle.author,
    };
    
    return this.transformUrls(merged);
  }
  
  private transformUrls(article: any): any {
    if (!article) return article;
    
    const serverUrl = 'http://localhost:3000';
    
    if (article.coverImage && !article.coverImage.startsWith('http')) {
      article.coverImage = article.coverImage.startsWith('/')
        ? `${serverUrl}${article.coverImage}`
        : `${serverUrl}/uploads/articles/${article.coverImage}`;
    }
    
    if (article.author?.picture && !article.author.picture.startsWith('http')) {
      article.author.picture = article.author.picture.startsWith('/')
        ? `${serverUrl}${article.author.picture}`
        : `${serverUrl}${article.author.picture}`;
    }
    
    return article;
  }
}