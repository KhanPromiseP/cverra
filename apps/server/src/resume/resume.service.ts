// // import {
// //   BadRequestException,
// //   Injectable,
// //   InternalServerErrorException,
// //   Logger,
// // } from "@nestjs/common";
// // import { Prisma } from "@prisma/client";
// // import { CreateResumeDto, ImportResumeDto, ResumeDto, UpdateResumeDto } from "@reactive-resume/dto";
// // import { defaultResumeData, ResumeData } from "@reactive-resume/schema";
// // import type { DeepPartial } from "@reactive-resume/utils";
// // import { ErrorMessage, generateRandomName } from "@reactive-resume/utils";
// // import slugify from "@sindresorhus/slugify";
// // import deepmerge from "deepmerge";
// // import { PrismaService } from "nestjs-prisma";

// // import { PrinterService } from "@/server/printer/printer.service";

// // import { StorageService } from "../storage/storage.service";

// // @Injectable()
// // export class ResumeService {
// //   constructor(
// //     private readonly prisma: PrismaService,
// //     private readonly printerService: PrinterService,
// //     private readonly storageService: StorageService,
// //   ) {}

// //   async create(userId: string, createResumeDto: CreateResumeDto) {
// //     const { name, email, picture } = await this.prisma.user.findUniqueOrThrow({
// //       where: { id: userId },
// //       select: { name: true, email: true, picture: true },
// //     });

// //     const data = deepmerge(defaultResumeData, {
// //       basics: { name, email, picture: { url: picture ?? "" } },
// //     } satisfies DeepPartial<ResumeData>);

// //     return this.prisma.resume.create({
// //       data: {
// //         data,
// //         userId,
// //         title: createResumeDto.title,
// //         visibility: createResumeDto.visibility,
// //         slug: createResumeDto.slug ?? slugify(createResumeDto.title),
// //       },
// //     });
// //   }

// //   import(userId: string, importResumeDto: ImportResumeDto) {
// //     const randomTitle = generateRandomName();

// //     return this.prisma.resume.create({
// //       data: {
// //         userId,
// //         visibility: "private",
// //         data: importResumeDto.data,
// //         title: importResumeDto.title ?? randomTitle,
// //         slug: importResumeDto.slug ?? slugify(randomTitle),
// //       },
// //     });
// //   }

// //   findAll(userId: string) {
// //     return this.prisma.resume.findMany({ where: { userId }, orderBy: { updatedAt: "desc" } });
// //   }

// //   findOne(id: string, userId?: string) {
// //     if (userId) {
// //       return this.prisma.resume.findUniqueOrThrow({ where: { userId_id: { userId, id } } });
// //     }

// //     return this.prisma.resume.findUniqueOrThrow({ where: { id } });
// //   }

// //   async findOneStatistics(id: string) {
// //     const result = await this.prisma.statistics.findFirst({
// //       select: { views: true, downloads: true },
// //       where: { resumeId: id },
// //     });

// //     return {
// //       views: result?.views ?? 0,
// //       downloads: result?.downloads ?? 0,
// //     };
// //   }


  

// //   async findOneByUsernameSlug(username: string, slug: string, userId?: string) {
// //     const resume = await this.prisma.resume.findFirstOrThrow({
// //       where: { user: { username }, slug, visibility: "public" },
// //     });

// //     // Update statistics: increment the number of views by 1
// //     if (!userId) {
// //       await this.prisma.statistics.upsert({
// //         where: { resumeId: resume.id },
// //         create: { views: 1, downloads: 0, resumeId: resume.id },
// //         update: { views: { increment: 1 } },
// //       });
// //     }

// //     return resume;
// //   }

// //  async update(userId: string, id: string, updateResumeDto: UpdateResumeDto) {
// //   try {
// //     const { locked } = await this.prisma.resume.findUniqueOrThrow({
// //       where: { id },
// //       select: { locked: true },
// //     });

// //     if (locked) throw new BadRequestException(ErrorMessage.ResumeLocked);

// //     // Clean AI-generated data before saving
// //     let cleanedData = updateResumeDto.data;
// //     if (cleanedData) {
// //       cleanedData = this.cleanResumeData(cleanedData);
// //     }

// //     return await this.prisma.resume.update({
// //       data: {
// //         title: updateResumeDto.title,
// //         slug: updateResumeDto.slug,
// //         visibility: updateResumeDto.visibility,
// //         data: cleanedData as Prisma.JsonObject,
// //       },
// //       where: { userId_id: { userId, id } },
// //     });
// //   } catch (error) {
// //     if (error.code === "P2025") {
// //       Logger.error(error);
// //       throw new InternalServerErrorException(error);
// //     }
// //     throw error;
// //   }
// // }

// // private cleanResumeData(data: any): any {
// //   try {
// //     // If data is a string, parse it
// //     if (typeof data === 'string') {
// //       data = JSON.parse(data);
// //     }

// //     // Remove undefined values (common in AI responses)
// //     const replacer = (key: string, value: any) => {
// //       if (value === undefined || value === Infinity || value === -Infinity) {
// //         return null;
// //       }
// //       if (typeof value === 'number' && isNaN(value)) {
// //         return null;
// //       }
// //       return value;
// //     };

// //     const cleaned = JSON.parse(JSON.stringify(data, replacer));
    
// //     // Ensure required structure
// //     return this.ensureResumeStructure(cleaned);
// //   } catch (error) {
// //     console.error('Error cleaning resume data:', error);
// //     // Return minimal valid structure
// //     return {
// //       basics: { name: "Your Name", email: "email@example.com" },
// //       sections: { work: [], education: [], skills: [] },
// //       metadata: { template: "modern" }
// //     };
// //   }
// // }

// // private ensureResumeStructure(data: any): any {
// //   if (!data.basics) data.basics = {};
// //   if (!data.sections) data.sections = {};
// //   if (!data.metadata) data.metadata = {};
  
// //   // Ensure arrays exist
// //   const sections = ['work', 'education', 'skills', 'projects', 'certifications', 'awards'];
// //   for (const section of sections) {
// //     if (!Array.isArray(data.sections[section])) {
// //       data.sections[section] = [];
// //     }
// //   }
  
// //   return data;
// // }
  

// //   lock(userId: string, id: string, set: boolean) {
// //     return this.prisma.resume.update({
// //       data: { locked: set },
// //       where: { userId_id: { userId, id } },
// //     });
// //   }

// //   async remove(userId: string, id: string) {
// //     await Promise.all([
// //       // Remove files in storage, and their cached keys
// //       this.storageService.deleteObject(userId, "resumes", id),
// //       this.storageService.deleteObject(userId, "previews", id),
// //     ]);

// //     return this.prisma.resume.delete({ where: { userId_id: { userId, id } } });
// //   }

// //   async printResume(resume: ResumeDto, userId?: string) {
// //     const url = await this.printerService.printResume(resume);

// //     // Update statistics: increment the number of downloads by 1
// //     if (!userId) {
// //       await this.prisma.statistics.upsert({
// //         where: { resumeId: resume.id },
// //         create: { views: 0, downloads: 1, resumeId: resume.id },
// //         update: { downloads: { increment: 1 } },
// //       });
// //     }

// //     return url;
// //   }

// //   printPreview(resume: ResumeDto) {
// //     return this.printerService.printPreview(resume);
// //   }
// // }


// import {
//   BadRequestException,
//   Injectable,
//   InternalServerErrorException,
//   Logger,
//   NotFoundException,
// } from "@nestjs/common";
// import { Prisma } from "@prisma/client";
// import { CreateResumeDto, ImportResumeDto, ResumeDto, UpdateResumeDto } from "@reactive-resume/dto";
// import { defaultResumeData, ResumeData } from "@reactive-resume/schema";
// import type { DeepPartial } from "@reactive-resume/utils";
// import { ErrorMessage, generateRandomName } from "@reactive-resume/utils";
// import slugify from "@sindresorhus/slugify";
// import deepmerge from "deepmerge";
// import { PrismaService } from "nestjs-prisma";

// import { PrinterService } from "@/server/printer/printer.service";

// import { StorageService } from "../storage/storage.service";

// @Injectable()
// export class ResumeService {
//   constructor(
//     private readonly prisma: PrismaService,
//     private readonly printerService: PrinterService,
//     private readonly storageService: StorageService,
//   ) {}

//   async create(userId: string, createResumeDto: CreateResumeDto) {
//     const { name, email, picture } = await this.prisma.user.findUniqueOrThrow({
//       where: { id: userId },
//       select: { name: true, email: true, picture: true },
//     });

//     const data = deepmerge(defaultResumeData, {
//       basics: { name, email, picture: { url: picture ?? "" } },
//     } satisfies DeepPartial<ResumeData>);

//     return this.prisma.resume.create({
//       data: {
//         data,
//         userId,
//         title: createResumeDto.title,
//         visibility: createResumeDto.visibility,
//         slug: createResumeDto.slug ?? slugify(createResumeDto.title),
//       },
//     });
//   }

//   import(userId: string, importResumeDto: ImportResumeDto) {
//     const randomTitle = generateRandomName();

//     return this.prisma.resume.create({
//       data: {
//         userId,
//         visibility: "private",
//         data: importResumeDto.data,
//         title: importResumeDto.title ?? randomTitle,
//         slug: importResumeDto.slug ?? slugify(randomTitle),
//       },
//     });
//   }

//   findAll(userId: string) {
//     return this.prisma.resume.findMany({ where: { userId }, orderBy: { updatedAt: "desc" } });
//   }

//   async findOne(id: string, userId?: string) {
//   let resume;
  
//   if (userId) {
//     // Try to find by userId and id (for private resumes)
//     resume = await this.prisma.resume.findUnique({
//       where: { id, userId },
//     });
//   } else {
//     // Find by id only (for public resumes)
//     resume = await this.prisma.resume.findUnique({
//       where: { id },
//     });
//   }
  
//   if (!resume) {
//     throw new NotFoundException('Resume not found');
//   }

//   // CRITICAL: Force AI resumes to match exact structure
//   const data = resume.data as any;
//   if (data?.metadata?.aiGenerated) {
//     console.log(`🔧 Ensuring AI resume ${resume.id} matches exact structure`);
//     const validatedData = this.validateAndFixResumeStructure(data);
    
//     // Update if fixed
//     if (JSON.stringify(validatedData) !== JSON.stringify(data)) {
//       await this.prisma.resume.update({
//         where: { id },
//         data: { data: validatedData }
//       });
//     }
    
//     return { ...resume, data: validatedData };
//   }

//   return resume;
// }

//   async findOneStatistics(id: string) {
//     const result = await this.prisma.statistics.findFirst({
//       select: { views: true, downloads: true },
//       where: { resumeId: id },
//     });

//     return {
//       views: result?.views ?? 0,
//       downloads: result?.downloads ?? 0,
//     };
//   }

//   async findOneByUsernameSlug(username: string, slug: string, userId?: string) {
//     const resume = await this.prisma.resume.findFirstOrThrow({
//       where: { user: { username }, slug, visibility: "public" },
//     });

//     // Update statistics: increment the number of views by 1
//     if (!userId) {
//       await this.prisma.statistics.upsert({
//         where: { resumeId: resume.id },
//         create: { views: 1, downloads: 0, resumeId: resume.id },
//         update: { views: { increment: 1 } },
//       });
//     }

//     return resume;
//   }

//   async update(userId: string, id: string, updateResumeDto: UpdateResumeDto) {
//     try {
//       const { locked } = await this.prisma.resume.findUniqueOrThrow({
//         where: { id },
//         select: { locked: true },
//       });

//       if (locked) throw new BadRequestException(ErrorMessage.ResumeLocked);

//       // Clean AI-generated data before saving
//       let cleanedData = updateResumeDto.data;
//       if (cleanedData) {
//         cleanedData = this.cleanResumeData(cleanedData);
//       }

//       return await this.prisma.resume.update({
//         data: {
//           title: updateResumeDto.title,
//           slug: updateResumeDto.slug,
//           visibility: updateResumeDto.visibility,
//           data: cleanedData as Prisma.JsonObject,
//         },
//         where: { userId_id: { userId, id } },
//       });
//     } catch (error) {
//       if (error.code === "P2025") {
//         Logger.error(error);
//         throw new InternalServerErrorException(error);
//       }
//       throw error;
//     }
//   }

//   private cleanResumeData(data: any): any {
//     try {
//       // If data is a string, parse it
//       if (typeof data === 'string') {
//         data = JSON.parse(data);
//       }

//       // Remove undefined values (common in AI responses)
//       const replacer = (key: string, value: any) => {
//         if (value === undefined || value === Infinity || value === -Infinity) {
//           return null;
//         }
//         if (typeof value === 'number' && isNaN(value)) {
//           return null;
//         }
//         return value;
//       };

//       const cleaned = JSON.parse(JSON.stringify(data, replacer));
      
//       // Ensure required structure
//       return this.ensureResumeStructure(cleaned);
//     } catch (error) {
//       console.error('Error cleaning resume data:', error);
//       // Return minimal valid structure
//       return {
//         basics: { name: "Your Name", email: "email@example.com" },
//         sections: { work: [], education: [], skills: [] },
//         metadata: { template: "modern" }
//       };
//     }
//   }

//   private ensureResumeStructure(data: any): any {
//     if (!data.basics) data.basics = {};
//     if (!data.sections) data.sections = {};
//     if (!data.metadata) data.metadata = {};
    
//     // Ensure arrays exist
//     const sections = ['work', 'education', 'skills', 'projects', 'certifications', 'awards'];
//     for (const section of sections) {
//       if (!Array.isArray(data.sections[section])) {
//         data.sections[section] = [];
//       }
//     }
    
//     return data;
//   }

//   lock(userId: string, id: string, set: boolean) {
//     return this.prisma.resume.update({
//       data: { locked: set },
//       where: { userId_id: { userId, id } },
//     });
//   }

//   async remove(userId: string, id: string) {
//     await Promise.all([
//       // Remove files in storage, and their cached keys
//       this.storageService.deleteObject(userId, "resumes", id),
//       this.storageService.deleteObject(userId, "previews", id),
//     ]);

//     return this.prisma.resume.delete({ where: { userId_id: { userId, id } } });
//   }

//   async printResume(resume: ResumeDto, userId?: string) {
//     const url = await this.printerService.printResume(resume);

//     // Update statistics: increment the number of downloads by 1
//     if (!userId) {
//       await this.prisma.statistics.upsert({
//         where: { resumeId: resume.id },
//         create: { views: 0, downloads: 1, resumeId: resume.id },
//         update: { downloads: { increment: 1 } },
//       });
//     }

//     return url;
//   }

//   printPreview(resume: ResumeDto) {
//     return this.printerService.printPreview(resume);
//   }

//   // ==================== NEW METHODS ====================

//   private validateAndFixResumeStructure(data: any): any {
//     console.log(`🔧 Validating and fixing resume structure for AI-generated resume`);
    
//     const fixed = JSON.parse(JSON.stringify(data));
//     const sample = this.getSampleResumeSchema();
    
//     // 1. Ensure basics structure matches exactly
//     if (!fixed.basics || typeof fixed.basics !== 'object') {
//       fixed.basics = { ...sample.basics };
//     } else {
//       // Merge with sample to ensure all properties exist
//       fixed.basics = { ...sample.basics, ...fixed.basics };
      
//       // Ensure nested objects exist with correct structure
//       if (!fixed.basics.url || typeof fixed.basics.url !== 'object') {
//         fixed.basics.url = { ...sample.basics.url };
//       } else {
//         fixed.basics.url = { ...sample.basics.url, ...fixed.basics.url };
//       }
      
//       if (!fixed.basics.picture || typeof fixed.basics.picture !== 'object') {
//         fixed.basics.picture = { ...sample.basics.picture };
//       } else {
//         fixed.basics.picture = { ...sample.basics.picture, ...fixed.basics.picture };
        
//         // Ensure picture.effects exists
//         if (!fixed.basics.picture.effects || typeof fixed.basics.picture.effects !== 'object') {
//           fixed.basics.picture.effects = { ...sample.basics.picture.effects };
//         }
//       }
      
//       if (!Array.isArray(fixed.basics.customFields)) {
//         fixed.basics.customFields = [];
//       }
//     }
    
//     // 2. Ensure sections exist and match exact structure
//     if (!fixed.sections || typeof fixed.sections !== 'object') {
//       fixed.sections = { ...sample.sections };
//     } else {
//       // For each section in the sample, ensure it exists and matches structure
//       Object.entries(sample.sections).forEach(([sectionName, sampleSection]: [string, any]) => {
//         const currentSection = fixed.sections[sectionName];
        
//         if (Array.isArray(currentSection)) {
//           // Convert array to object with items
//           console.log(`    → Converting ${sectionName} from array to object`);
//           fixed.sections[sectionName] = {
//             ...sampleSection,
//             items: currentSection.map((item: any) => this.fixSectionItem(item, sectionName)),
//             visible: currentSection.length > 0 && sampleSection.visible
//           };
//         } else if (!currentSection || typeof currentSection !== 'object') {
//           // Use sample section
//           fixed.sections[sectionName] = { ...sampleSection };
//         } else {
//           // Merge with sample to ensure all properties
//           fixed.sections[sectionName] = {
//             ...sampleSection,
//             ...currentSection,
//             items: Array.isArray(currentSection.items) 
//               ? currentSection.items.map((item: any) => this.fixSectionItem(item, sectionName))
//               : sampleSection.items,
//             visible: currentSection.visible !== undefined ? currentSection.visible : sampleSection.visible
//           };
//         }
        
//         // Ensure separateLinks exists (critical for frontend)
//         if (fixed.sections[sectionName].separateLinks === undefined) {
//           fixed.sections[sectionName].separateLinks = sampleSection.separateLinks;
//         }
//       });
//     }
    
//     // 3. Ensure metadata exists with AI metadata
//     if (!fixed.metadata || typeof fixed.metadata !== 'object') {
//       fixed.metadata = { ...sample.metadata };
//     } else {
//       fixed.metadata = { 
//         ...sample.metadata, 
//         ...fixed.metadata,
//         // Preserve AI metadata
//         aiGenerated: true,
//         aiGeneratedAt: fixed.metadata.aiGeneratedAt || sample.metadata.aiGeneratedAt,
//         needsReview: fixed.metadata.needsReview !== false,
//         confidence: typeof fixed.metadata.confidence === 'number' ? fixed.metadata.confidence : sample.metadata.confidence
//       };
//     }
    
//     console.log(`✅ Fixed structure complete`);
//     return fixed;
//   }

//   private fixSectionItem(item: any, sectionName: string): any {
//     if (!item || typeof item !== 'object') {
//       return {
//         id: this.generateCuid2(),
//         visible: true,
//         name: `${sectionName} Item`
//       };
//     }
    
//     // Ensure item has ID
//     if (!item.id || typeof item.id !== 'string') {
//       item.id = this.generateCuid2();
//     }
    
//     // Ensure visible property
//     if (item.visible === undefined) {
//       item.visible = true;
//     }
    
//     // Ensure URL object for sections that need it
//     const sectionsWithUrl = ['education', 'experience', 'certifications', 'projects', 'profiles', 'awards', 'volunteer', 'publications', 'references'];
//     if (sectionsWithUrl.includes(sectionName) && (!item.url || typeof item.url !== 'object')) {
//       item.url = { label: "", href: "" };
//     }
    
//     return item;
//   }

//   private generateCuid2(): string {
//     const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
//     let result = 'c';
//     for (let i = 0; i < 25; i++) {
//       result += chars.charAt(Math.floor(Math.random() * chars.length));
//     }
//     return result;
//   }

//   private getSampleResumeSchema(): any {
//     // EXACT structure from your perfect sample
//     return {
//       basics: {
//         name: "",
//         headline: "",
//         email: "",
//         phone: "",
//         location: "",
//         url: {
//           label: "",
//           href: ""
//         },
//         customFields: [],
//         picture: {
//           url: "",
//           size: 128,
//           aspectRatio: 1,
//           borderRadius: 0,
//           effects: {
//             hidden: false,
//             border: false,
//             grayscale: false
//           }
//         }
//       },
//       sections: {
//         summary: {
//           name: "Summary",
//           columns: 1,
//           separateLinks: true,
//           visible: true,
//           id: "summary",
//           content: "<p>Professional summary based on experience.</p>"
//         },
//         awards: {
//           name: "Awards",
//           columns: 1,
//           separateLinks: true,
//           visible: false,
//           id: "awards",
//           items: []
//         },
//         certifications: {
//           name: "Certifications",
//           columns: 1,
//           separateLinks: true,
//           visible: false,
//           id: "certifications",
//           items: []
//         },
//         education: {
//           name: "Education",
//           columns: 1,
//           separateLinks: true,
//           visible: true,
//           id: "education",
//           items: []
//         },
//         experience: {
//           name: "Experience",
//           columns: 1,
//           separateLinks: true,
//           visible: true,
//           id: "experience",
//           items: []
//         },
//         volunteer: {
//           name: "Volunteering",
//           columns: 1,
//           separateLinks: true,
//           visible: false,
//           id: "volunteer",
//           items: []
//         },
//         interests: {
//           name: "Interests",
//           columns: 1,
//           separateLinks: true,
//           visible: false,
//           id: "interests",
//           items: []
//         },
//         languages: {
//           name: "Languages",
//           columns: 1,
//           separateLinks: true,
//           visible: false,
//           id: "languages",
//           items: []
//         },
//         profiles: {
//           name: "Profiles",
//           columns: 1,
//           separateLinks: true,
//           visible: true,
//           id: "profiles",
//           items: []
//         },
//         projects: {
//           name: "Projects",
//           columns: 1,
//           separateLinks: true,
//           visible: true,
//           id: "projects",
//           items: []
//         },
//         publications: {
//           name: "Publications",
//           columns: 1,
//           separateLinks: true,
//           visible: false,
//           id: "publications",
//           items: []
//         },
//         references: {
//           name: "References",
//           columns: 1,
//           separateLinks: true,
//           visible: false,
//           id: "references",
//           items: []
//         },
//         skills: {
//           name: "Skills",
//           columns: 1,
//           separateLinks: true,
//           visible: true,
//           id: "skills",
//           items: []
//         },
//         custom: {}
//       },
//       metadata: {
//         template: "modern",
//         layout: [
//           [
//             ["summary", "experience", "education", "references"],
//             [
//               "profiles",
//               "skills",
//               "certifications",
//               "projects",
//               "interests",
//               "languages",
//               "awards",
//               "volunteer",
//               "publications"
//             ]
//           ]
//         ],
//         css: {
//           value: "",
//           visible: false
//         },
//         page: {
//           margin: 18,
//           format: "a4",
//           options: {
//             breakLine: true,
//             pageNumbers: true
//           }
//         },
//         theme: {
//           background: "#ffffff",
//           text: "#000000",
//           primary: "#3b82f6"
//         },
//         typography: {
//           font: {
//             family: "Inter",
//             subset: "latin",
//             variants: ["400", "500", "600", "700"],
//             size: 13
//           },
//           lineHeight: 1.5,
//           hideIcons: false,
//           underlineLinks: true
//         },
//         notes: "",
//         aiGenerated: true,
//         aiGeneratedAt: new Date().toISOString(),
//         needsReview: true,
//         confidence: 0.85
//       }
//     };
//   }
// }



// resume.service.ts - Enhanced version
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { CreateResumeDto, ImportResumeDto, ResumeDto, UpdateResumeDto } from "@reactive-resume/dto";
import { defaultResumeData, ResumeData } from "@reactive-resume/schema";
import type { DeepPartial } from "@reactive-resume/utils";
import { ErrorMessage, generateRandomName } from "@reactive-resume/utils";
import slugify from "@sindresorhus/slugify";
import deepmerge from "deepmerge";
import { PrismaService } from "nestjs-prisma";

import { PrinterService } from "@/server/printer/printer.service";
import { StorageService } from "../storage/storage.service";

@Injectable()
export class ResumeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly printerService: PrinterService,
    private readonly storageService: StorageService,
  ) {}

  async create(userId: string, createResumeDto: CreateResumeDto) {
    const { name, email, picture } = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { name: true, email: true, picture: true },
    });

    const data = deepmerge(defaultResumeData, {
      basics: { name, email, picture: { url: picture ?? "" } },
    } satisfies DeepPartial<ResumeData>);

    return this.prisma.resume.create({
      data: {
        data,
        userId,
        title: createResumeDto.title,
        visibility: createResumeDto.visibility,
        slug: createResumeDto.slug ?? slugify(createResumeDto.title),
      },
    });
  }

  import(userId: string, importResumeDto: ImportResumeDto) {
    const randomTitle = generateRandomName();

    return this.prisma.resume.create({
      data: {
        userId,
        visibility: "private",
        data: importResumeDto.data,
        title: importResumeDto.title ?? randomTitle,
        slug: importResumeDto.slug ?? slugify(randomTitle),
      },
    });
  }

  findAll(userId: string) {
    return this.prisma.resume.findMany({ where: { userId }, orderBy: { updatedAt: "desc" } });
  }

  async findOne(id: string, userId?: string) {
    let resume;
    
    if (userId) {
      // Try to find by userId and id (for private resumes)
      resume = await this.prisma.resume.findUnique({
        where: { id, userId },
      });
    } else {
      // Find by id only (for public resumes)
      resume = await this.prisma.resume.findUnique({
        where: { id },
      });
    }
    
    if (!resume) {
      throw new NotFoundException('Resume not found');
    }

    // Normalize AI resume data to ensure compatibility
    const data = resume.data as any;
    if (data?.metadata?.aiGenerated) {
      const normalizedData = this.normalizeAIResumeData(data);
      
      // Only update if normalization changed something
      if (JSON.stringify(normalizedData) !== JSON.stringify(data)) {
        await this.prisma.resume.update({
          where: { id: resume.id },
          data: { data: normalizedData }
        });
      }
      
      return { ...resume, data: normalizedData };
    }

    return resume;
  }

  async findOneStatistics(id: string) {
    const result = await this.prisma.statistics.findFirst({
      select: { views: true, downloads: true },
      where: { resumeId: id },
    });

    return {
      views: result?.views ?? 0,
      downloads: result?.downloads ?? 0,
    };
  }

  async findOneByUsernameSlug(username: string, slug: string, userId?: string) {
    const resume = await this.prisma.resume.findFirstOrThrow({
      where: { user: { username }, slug, visibility: "public" },
    });

    // Update statistics: increment the number of views by 1
    if (!userId) {
      await this.prisma.statistics.upsert({
        where: { resumeId: resume.id },
        create: { views: 1, downloads: 0, resumeId: resume.id },
        update: { views: { increment: 1 } },
      });
    }

    return resume;
  }

  
 normalizeResumeDataForStorage(aiData: any) {
  const buildSection = (id: string, name: string, items: any[] = []) => ({
    id,
    name,
    columns: 1,
    separateLinks: false,
    visible: true,
    items: Array.isArray(items)
      ? items.map((item, index) => ({
          id: item.id ?? `${id}-${index}`,
          name: item.name ?? "",
          date: item.date ?? "",
          location: item.location ?? "",
          url: item.url ?? { label: "", href: "" },
          visible: true,
          summary: item.summary ?? "",
          keywords: item.keywords ?? [],
          description: item.description ?? "",
        }))
      : [],
  });

  return {
    metadata: {
      template: "modern",
      layout: [] as string[][][],
      css: { value: "", visible: true },
      page: {
        options: { breakLine: true, pageNumbers: true },
        margin: 20,
        format: "a4" as "a4" | "letter",
      },
      theme: {
        background: "#ffffff",
        text: "#000000",
        primary: "#2563eb",
      },
      typography: {
        font: {
          size: 12,
          family: "Inter",
          subset: "latin",
          variants: ["regular", "bold"],
        },
        lineHeight: 1.5,
        hideIcons: false,
        underlineLinks: false,
      },
      notes: "",
      aiGenerated: true,
      aiGeneratedAt: new Date().toISOString(),
    },

    basics: {
      name: aiData?.basics?.name ?? "",
      email: aiData?.basics?.email ?? "",
      phone: aiData?.basics?.phone ?? "",
      headline: aiData?.basics?.headline ?? "",
      location: aiData?.basics?.location ?? "",
      url: aiData?.basics?.url ?? { label: "", href: "" },
      picture: {
        url: aiData?.basics?.picture?.url ?? "",
        size: 120,
        aspectRatio: 1,
        borderRadius: 0,
        effects: { hidden: false, border: false, grayscale: false },
      },
      customFields: [],
    },

    sections: {
      // summary MUST have content string
      summary: {
  id: "summary" as const,   // <-- cast to literal
  name: "Summary",
  columns: 1,
  separateLinks: false,
  visible: true,
  content: aiData?.summary?.content ?? aiData?.summary ?? "",
},

      experience: buildSection("experience", "Experience", aiData?.work),
      education: buildSection("education", "Education", aiData?.education),
      skills: buildSection("skills", "Skills", aiData?.skills),
      volunteer: buildSection("volunteer", "Volunteer", aiData?.volunteer),
      projects: buildSection("projects", "Projects", aiData?.projects),
      awards: buildSection("awards", "Awards", aiData?.awards),
      certifications: buildSection("certifications", "Certifications", aiData?.certifications),
      languages: buildSection("languages", "Languages", aiData?.languages),
      interests: buildSection("interests", "Interests", aiData?.interests),
      references: buildSection("references", "References", aiData?.references),
      profiles: buildSection("profiles", "Profiles", aiData?.profiles),
      publications: buildSection("publications", "Publications", aiData?.publications),
      custom: {}, // required by DTO
    },
  };
}



// async update(userId: string, id: string, updateResumeDto: UpdateResumeDto) {
//   try {
//     const { locked, data: existingData } = await this.prisma.resume.findUniqueOrThrow({
//       where: { id },
//       select: { locked: true, data: true },
//     });

//     if (locked) throw new BadRequestException(ErrorMessage.ResumeLocked);

//     // Check if it's an AI resume
//     const isAIResume = (existingData as any)?.metadata?.aiGenerated;
    
//     let cleanedData = updateResumeDto.data;
    
//     if (cleanedData) {
//       if (isAIResume) {
//         // For AI resumes, accept the data as-is (or with minimal cleaning)
//         cleanedData = this.prepareAIResumeData(cleanedData, existingData as any);
//       } else {
//         // For regular resumes, use normal validation
//         // Parse the data to ensure it's valid JSON
//         cleanedData = this.parseAndCleanData(cleanedData);
//       }
//     }

//     return await this.prisma.resume.update({
//       data: {
//         title: updateResumeDto.title,
//         slug: updateResumeDto.slug,
//         visibility: updateResumeDto.visibility,
//         data: cleanedData as Prisma.JsonObject,
//       },
//       where: { userId_id: { userId, id } },
//     });
//   } catch (error) {
//     if (error.code === "P2025") {
//       Logger.error(error);
//       throw new InternalServerErrorException(error);
//     }
//     throw error;
//   }
// }


async update(userId: string, id: string, updateResumeDto: UpdateResumeDto) {
  try {
    const resume = await this.prisma.resume.findUniqueOrThrow({
      where: { userId_id: { userId, id } },
      select: {
        locked: true,
        data: true,
      },
    });

    if (resume.locked) {
      throw new BadRequestException(ErrorMessage.ResumeLocked);
    }

    let preparedData: Prisma.JsonObject | undefined = undefined;

    if (updateResumeDto.data !== undefined) {
      preparedData = this.prepareDataForSave(
        updateResumeDto.data
      ) as Prisma.JsonObject;
    }

    return await this.prisma.resume.update({
      where: { userId_id: { userId, id } },
      data: {
        title: updateResumeDto.title,
        slug: updateResumeDto.slug,
        visibility: updateResumeDto.visibility,
        ...(preparedData && { data: preparedData }),
      },
    });
  } catch (error: any) {
    if (error?.code === "P2025") {
      throw new NotFoundException("Resume not found");
    }

    Logger.error(error);
    throw new InternalServerErrorException("Failed to update resume");
  }
}


// Add these helper methods
private parseAndCleanData(data: any): any {
  try {
    // If data is a string, parse it
    if (typeof data === 'string') {
      data = JSON.parse(data);
    }

    // Remove undefined values
    const replacer = (key: string, value: any) => {
      if (value === undefined || value === Infinity || value === -Infinity) {
        return null;
      }
      if (typeof value === 'number' && isNaN(value)) {
        return null;
      }
      return value;
    };

    return JSON.parse(JSON.stringify(data, replacer));
  } catch (error) {
    console.error('Error parsing data:', error);
    throw new BadRequestException('Invalid resume data');
  }
}

private prepareAIResumeData(data: any, existingData: any): any {
  try {
    // Parse if string
    if (typeof data === 'string') {
      data = JSON.parse(data);
    }

    // Clean undefined values
    const replacer = (key: string, value: any) => {
      if (value === undefined || value === Infinity || value === -Infinity) {
        return null;
      }
      if (typeof value === 'number' && isNaN(value)) {
        return null;
      }
      return value;
    };

    const cleaned = JSON.parse(JSON.stringify(data, replacer));
    
    // Preserve AI metadata
    if (existingData?.metadata) {
      if (!cleaned.metadata) cleaned.metadata = {};
      
      // Always keep AI metadata
      cleaned.metadata.aiGenerated = true;
      cleaned.metadata.aiGeneratedAt = existingData.metadata.aiGeneratedAt || new Date().toISOString();
      
      // Keep other metadata from existing data if not provided
      Object.keys(existingData.metadata).forEach(key => {
        if (!cleaned.metadata[key] && key !== 'aiGenerated' && key !== 'aiGeneratedAt') {
          cleaned.metadata[key] = existingData.metadata[key];
        }
      });
    }
    
    return cleaned;
  } catch (error) {
    console.error('Error preparing AI resume data:', error);
    return data; // Return original data if cleaning fails
  }
}

private cleanResumeData(data: any): any {
    try {
      if (typeof data === 'string') {
        data = JSON.parse(data);
      }

      const replacer = (key: string, value: any) => {
        if (value === undefined || value === Infinity || value === -Infinity) {
          return null;
        }
        if (typeof value === 'number' && isNaN(value)) {
          return null;
        }
        return value;
      };

      const cleaned = JSON.parse(JSON.stringify(data, replacer));
      return this.ensureResumeStructure(cleaned);
    } catch (error) {
      console.error('Error cleaning resume data:', error);
      return {
        basics: { name: "Your Name", email: "email@example.com" },
        sections: { work: [], education: [], skills: [] },
        metadata: { template: "modern" }
      };
    }
  }


// New method to clean AI resume data
private cleanAIResumeData(data: any, existingData: any): any {
  try {
    // If data is a string, parse it
    if (typeof data === 'string') {
      data = JSON.parse(data);
    }

    // Remove undefined values
    const replacer = (key: string, value: any) => {
      if (value === undefined || value === Infinity || value === -Infinity) {
        return null;
      }
      if (typeof value === 'number' && isNaN(value)) {
        return null;
      }
      return value;
    };

    const cleaned = JSON.parse(JSON.stringify(data, replacer));
    
    // Preserve AI metadata from existing data
    if (existingData?.metadata) {
      if (!cleaned.metadata) cleaned.metadata = {};
      
      // Keep AI metadata
      cleaned.metadata.aiGenerated = true;
      cleaned.metadata.aiGeneratedAt = existingData.metadata.aiGeneratedAt || new Date().toISOString();
      cleaned.metadata.needsReview = cleaned.metadata.needsReview !== false;
      cleaned.metadata.confidence = existingData.metadata.confidence || 0.85;
      
      // Keep other existing metadata if not provided
      Object.keys(existingData.metadata).forEach(key => {
        if (!cleaned.metadata[key] && key !== 'aiGenerated' && key !== 'aiGeneratedAt') {
          cleaned.metadata[key] = existingData.metadata[key];
        }
      });
    }
    
    return cleaned;
  } catch (error) {
    console.error('Error cleaning AI resume data:', error);
    return data;
  }
}

  

  // NEW: Helper method to normalize AI resume data for frontend compatibility
  private normalizeAIResumeData(data: any): any {
    if (!data?.metadata?.aiGenerated) {
      return data;
    }

    const normalized = JSON.parse(JSON.stringify(data));
    
    // Ensure sections object exists
    if (!normalized.sections || typeof normalized.sections !== 'object') {
      normalized.sections = {};
    }

    // Convert sections to the format expected by the frontend
    // The frontend expects sections to be arrays, not objects with items arrays
    const standardSections = ['education', 'experience', 'skills', 'projects', 'profiles'];
    
    for (const section of standardSections) {
      if (normalized.sections[section] && 
          typeof normalized.sections[section] === 'object' && 
          Array.isArray(normalized.sections[section].items)) {
        
        // Convert object with items array to simple array
        normalized.sections[section] = normalized.sections[section].items.map((item: any) => ({
          ...item,
          // Ensure item has required properties
          id: item.id || this.generateCuid2(),
          visible: item.visible !== false,
        }));
      }
    }

    // Ensure basics has required structure
    if (!normalized.basics) {
      normalized.basics = {};
    }

    // Remove any temporary properties
    if (normalized.metadata) {
      // Keep AI metadata for identification
      normalized.metadata.aiGenerated = true;
      normalized.metadata.aiGeneratedAt = normalized.metadata.aiGeneratedAt || new Date().toISOString();
    }

    return normalized;
  }

  // NEW: Prepare data for saving (handles both AI and regular resumes)
  private prepareDataForSave(data: any): any {
    if (!data) return data;

    try {
      // If data is a string, parse it
      if (typeof data === 'string') {
        data = JSON.parse(data);
      }

      // Remove undefined values
      const replacer = (key: string, value: any) => {
        if (value === undefined || value === Infinity || value === -Infinity) {
          return null;
        }
        if (typeof value === 'number' && isNaN(value)) {
          return null;
        }
        return value;
      };

      const cleaned = JSON.parse(JSON.stringify(data, replacer));
      
      // If it's an AI resume, ensure proper structure before saving
      if (cleaned.metadata?.aiGenerated) {
        return this.ensureAIResumeStructure(cleaned);
      }
      
      // For regular resumes, ensure basic structure
      return this.ensureResumeStructure(cleaned);
    } catch (error) {
      console.error('Error preparing data for save:', error);
      return data;
    }
  }

  // NEW: Ensure AI resume maintains its structure
  private ensureAIResumeStructure(data: any): any {
    if (!data.basics) data.basics = {};
    if (!data.sections) data.sections = {};
    if (!data.metadata) data.metadata = {};
    
    // Convert arrays back to objects with items arrays if needed
    // (This is the reverse of normalizeAIResumeData)
    const sectionsToConvert = ['education', 'experience', 'skills', 'projects', 'profiles'];
    
    for (const section of sectionsToConvert) {
      if (Array.isArray(data.sections[section])) {
        // Convert array to object with items array
        data.sections[section] = {
          name: this.capitalizeFirstLetter(section),
          columns: 1,
          separateLinks: true,
          visible: data.sections[section].length > 0,
          id: section,
          items: data.sections[section]
        };
      }
    }

    // Ensure AI metadata
    data.metadata.aiGenerated = true;
    data.metadata.aiGeneratedAt = data.metadata.aiGeneratedAt || new Date().toISOString();
    data.metadata.needsReview = data.metadata.needsReview !== false;
    
    return data;
  }

  private ensureResumeStructure(data: any): any {
    if (!data.basics) data.basics = {};
    if (!data.sections) data.sections = {};
    if (!data.metadata) data.metadata = {};
    
    // Ensure arrays exist for standard sections
    const sections = ['work', 'education', 'skills', 'projects', 'certifications', 'awards'];
    for (const section of sections) {
      if (!Array.isArray(data.sections[section])) {
        data.sections[section] = [];
      }
    }
    
    return data;
  }

  private generateCuid2(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = 'c';
    for (let i = 0; i < 25; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private capitalizeFirstLetter(string: string): string {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  lock(userId: string, id: string, set: boolean) {
    return this.prisma.resume.update({
      data: { locked: set },
      where: { userId_id: { userId, id } },
    });
  }

  async remove(userId: string, id: string) {
    await Promise.all([
      // Remove files in storage, and their cached keys
      this.storageService.deleteObject(userId, "resumes", id),
      this.storageService.deleteObject(userId, "previews", id),
    ]);

    return this.prisma.resume.delete({ where: { userId_id: { userId, id } } });
  }

  async printResume(resume: ResumeDto, userId?: string) {
    const url = await this.printerService.printResume(resume);

    // Update statistics: increment the number of downloads by 1
    if (!userId) {
      await this.prisma.statistics.upsert({
        where: { resumeId: resume.id },
        create: { views: 0, downloads: 1, resumeId: resume.id },
        update: { downloads: { increment: 1 } },
      });
    }

    return url;
  }

  printPreview(resume: ResumeDto) {
    return this.printerService.printPreview(resume);
  }

  // NEW: Repair endpoint for fixing AI resumes
  async repairAIResume(userId: string, id: string) {
    const resume = await this.findOne(id, userId);
    
    if (!resume) {
      throw new NotFoundException('Resume not found');
    }

    const data = resume.data as any;
    if (!data?.metadata?.aiGenerated) {
      throw new BadRequestException('Not an AI-generated resume');
    }

    const repairedData = this.normalizeAIResumeData(data);
    
    return this.prisma.resume.update({
      where: { id },
      data: { data: repairedData },
    });
  }
}