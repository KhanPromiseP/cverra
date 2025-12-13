// cover-letter/templates/template.service.ts
import { Injectable } from '@nestjs/common';
import { TemplateRegistry, CoverLetterTemplate, TemplateCategory } from './template.registry';

@Injectable()
export class TemplateService {
  getAllTemplates() {
    return TemplateRegistry.getAllTemplates();
  }

  getTemplateById(id: string) {
    const template = TemplateRegistry.getTemplateById(id);
    if (!template) {
      throw new Error(`Template with id ${id} not found`);
    }
    return template;
  }

  getTemplatesByCategory(category: TemplateCategory) {
    return TemplateRegistry.getTemplatesByCategory(category);
  }

  getCategories() {
    return TemplateRegistry.getCategories();
  }

  getTemplateStructure(layout: string) {
    const template = TemplateRegistry.getAllTemplates().find(t => t.layout === layout);
    return template?.structure || this.getDefaultStructure();
  }

  searchTemplates(query: string) {
    const allTemplates = TemplateRegistry.getAllTemplates();
    const searchTerm = query.toLowerCase();
    
    return allTemplates.filter(template => {
      const tags = template.tags || []; // Handle undefined tags
      return (
        template.name.toLowerCase().includes(searchTerm) ||
        template.description.toLowerCase().includes(searchTerm) ||
        tags.some(tag => tag.toLowerCase().includes(searchTerm)) ||
        template.category.toLowerCase().includes(searchTerm)
      );
    });
  }

  getFeaturedTemplates() {
    return TemplateRegistry.getAllTemplates().filter(template => template.isFeatured);
  }

  getPopularTemplates() {
    return TemplateRegistry.getAllTemplates()
      .filter(template => template.isPopular)
      .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
      .slice(0, 6); // Return top 6 popular templates
  }

  getTemplateStats() {
    const allTemplates = TemplateRegistry.getAllTemplates();
    
    return {
      totalTemplates: allTemplates.length,
      totalCategories: new Set(allTemplates.map(t => t.category)).size,
      featuredCount: allTemplates.filter(t => t.isFeatured).length,
      popularCount: allTemplates.filter(t => t.isPopular).length,
      totalUsage: allTemplates.reduce((sum, t) => sum + (t.usageCount || 0), 0),
      categories: allTemplates.reduce((acc, template) => {
        acc[template.category] = (acc[template.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };
  }

  private getDefaultStructure() {
    return {
      headerAlignment: 'right' as const,
      contactInfoPosition: 'right' as const,
      datePosition: 'right' as const,
      subjectLinePosition: 'center',
      greetingAlignment: 'left' as const,
      paragraphSpacing: 'balanced' as const,
      signatureAlignment: 'left' as const
    };
  }
}