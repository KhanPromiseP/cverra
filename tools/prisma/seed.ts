import { PrismaClient, PlanInterval } from '@prisma/client';
import Decimal from 'decimal.js';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding production data...');

  // 1. Seed Subscription Plans
  console.log('📊 Seeding subscription plans...');
  
  const plans = [
    { 
      id: 'starter', 
      name: 'Starter', 
      coins: 100, 
      price: new Decimal(9.99), 
      interval: PlanInterval.MONTHLY,
      description: 'Perfect for occasional resume updates',
      features: {
        aiResumeBuilder: false,
        unlimitedResumes: false,
        premiumTemplates: 0,
        aiTranslations: 0,
        prioritySupport: false,
        maxResumes: 5,
        maxCoverLetters: 3
      }
    },
    { 
      id: 'basic', 
      name: 'Basic', 
      coins: 500, 
      price: new Decimal(19.99), 
      interval: PlanInterval.MONTHLY,
      description: 'For regular job seekers',
      features: {
        aiResumeBuilder: true,
        unlimitedResumes: false,
        premiumTemplates: 3,
        aiTranslations: 5,
        prioritySupport: false,
        maxResumes: 10,
        maxCoverLetters: 5
      }
    },
    { 
      id: 'pro', 
      name: 'Pro', 
      coins: 4000, 
      price: new Decimal(49.99), 
      interval: PlanInterval.MONTHLY,
      description: 'Professional job seekers and recruiters',
      features: {
        aiResumeBuilder: true,
        unlimitedResumes: true,
        premiumTemplates: 10,
        aiTranslations: 20,
        prioritySupport: true,
        maxResumes: 999,
        maxCoverLetters: 20
      }
    },
    { 
      id: 'premium', 
      name: 'Premium', 
      coins: 10000, 
      price: new Decimal(99.99), 
      interval: PlanInterval.MONTHLY,
      description: 'Enterprise-level features',
      features: {
        aiResumeBuilder: true,
        unlimitedResumes: true,
        premiumTemplates: 'unlimited',
        aiTranslations: 50,
        prioritySupport: true,
        maxResumes: 999,
        maxCoverLetters: 50,
        teamFeatures: true,
        customBranding: true
      }
    },
    { 
      id: 'starter-annual', 
      name: 'Starter Annual', 
      coins: 1200, 
      price: new Decimal(99.99), 
      interval: PlanInterval.YEARLY,
      description: 'Annual starter plan (2 months free)',
      features: {
        aiResumeBuilder: false,
        unlimitedResumes: false,
        premiumTemplates: 0,
        aiTranslations: 0,
        prioritySupport: false,
        maxResumes: 5,
        maxCoverLetters: 3
      }
    },
    { 
      id: 'pro-annual', 
      name: 'Pro Annual', 
      coins: 48000, 
      price: new Decimal(479.99), 
      interval: PlanInterval.YEARLY,
      description: 'Annual pro plan (2 months free)',
      features: {
        aiResumeBuilder: true,
        unlimitedResumes: true,
        premiumTemplates: 10,
        aiTranslations: 240,
        prioritySupport: true,
        maxResumes: 999,
        maxCoverLetters: 20
      }
    },
    { 
      id: 'premium-annual', 
      name: 'Premium Annual', 
      coins: 120000, 
      price: new Decimal(959.99), 
      interval: PlanInterval.YEARLY,
      description: 'Annual premium plan (2 months free)',
      features: {
        aiResumeBuilder: true,
        unlimitedResumes: true,
        premiumTemplates: 'unlimited',
        aiTranslations: 600,
        prioritySupport: true,
        maxResumes: 999,
        maxCoverLetters: 50,
        teamFeatures: true,
        customBranding: true
      }
    },
  ];

  for (const plan of plans) {
    await prisma.subscriptionPlan.upsert({
      where: { id: plan.id },
      update: { 
        coins: plan.coins, 
        price: plan.price, 
        interval: plan.interval, 
        name: plan.name,
        description: plan.description,
        features: plan.features as any
      },
      create: plan,
    });
  }

  console.log('✅ Subscription plans seeded!');

  // 2. Seed AI Resume Builder Costs
  console.log('💡 Seeding AI resume builder costs...');
  
  const resumeBuilderCosts = [
    { 
      id: 'text_extraction', 
      action: 'text_extraction', 
      baseCost: 10, 
      minCost: 10, 
      maxCost: 50,
      description: 'Basic text extraction from input',
      isActive: true,
      dependsOnLength: true,
      lengthMultiplier: 0.001,
      lengthThresholds: {
        "0": 10,
        "1000": 10,
        "5000": 15,
        "10000": 20,
        "20000": 30,
        "50000": 40
      }
    },
    { 
      id: 'pdf_processing', 
      action: 'pdf_processing', 
      baseCost: 15, 
      minCost: 15, 
      maxCost: 30,
      description: 'PDF file parsing and text extraction',
      isActive: true,
      dependsOnLength: false,
      lengthMultiplier: null,
      lengthThresholds: null
    },
    { 
      id: 'doc_processing', 
      action: 'doc_processing', 
      baseCost: 10, 
      minCost: 10, 
      maxCost: 25,
      description: 'DOC/DOCX file parsing and text extraction',
      isActive: true,
      dependsOnLength: false,
      lengthMultiplier: null,
      lengthThresholds: null
    },
    { 
      id: 'ai_building', 
      action: 'ai_building', 
      baseCost: 20, 
      minCost: 20, 
      maxCost: 50,
      description: 'AI resume structure building and parsing',
      isActive: true,
      dependsOnLength: true,
      lengthMultiplier: 0.002,
      lengthThresholds: {
        "0": 20,
        "1000": 20,
        "5000": 25,
        "10000": 35,
        "20000": 45,
        "50000": 50
      }
    },
    { 
      id: 'ai_enhancement', 
      action: 'ai_enhancement', 
      baseCost: 25, 
      minCost: 25, 
      maxCost: 75,
      description: 'AI content enhancement and professional language',
      isActive: true,
      dependsOnLength: true,
      lengthMultiplier: 0.003,
      lengthThresholds: {
        "0": 25,
        "1000": 25,
        "5000": 40,
        "10000": 55,
        "20000": 65,
        "50000": 75
      }
    },
    { 
      id: 'ai_suggestions', 
      action: 'ai_suggestions', 
      baseCost: 15, 
      minCost: 15, 
      maxCost: 30,
      description: 'AI improvement suggestions and optimization tips',
      isActive: true,
      dependsOnLength: false,
      lengthMultiplier: null,
      lengthThresholds: null
    },
    { 
      id: 'linkedin_processing', 
      action: 'linkedin_processing', 
      baseCost: 20, 
      minCost: 20, 
      maxCost: 40,
      description: 'LinkedIn profile parsing and data extraction',
      isActive: true,
      dependsOnLength: false,
      lengthMultiplier: null,
      lengthThresholds: null
    },
    { 
      id: 'template_application', 
      action: 'template_application', 
      baseCost: 5, 
      minCost: 5, 
      maxCost: 15,
      description: 'Applying professional template to resume',
      isActive: true,
      dependsOnLength: false,
      lengthMultiplier: null,
      lengthThresholds: null
    }
  ];

  for (const cost of resumeBuilderCosts) {
    await prisma.resumeBuilderCost.upsert({
      where: { id: cost.id },
      update: { 
        action: cost.action,
        baseCost: cost.baseCost,
        minCost: cost.minCost,
        maxCost: cost.maxCost,
        description: cost.description,
        isActive: cost.isActive,
        dependsOnLength: cost.dependsOnLength,
        lengthMultiplier: cost.lengthMultiplier,
        lengthThresholds: cost.lengthThresholds as any
      },
      create: {
        ...cost,
        lengthThresholds: cost.lengthThresholds as any
      },
    });
  }

  console.log('✅ AI resume builder costs seeded!');
  console.log('🎉 Production data seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


  // npx ts-node seed.ts