import { t, Trans } from "@lingui/macro";
import { 
  Book, 
  Phone, 
  EnvelopeSimpleOpen, 
  Gift,
  RocketLaunch,
  Cpu,
  ShieldCheck,
  Sparkle,
  GraduationCap,
  Briefcase,
  Globe,
  UsersThree
} from "@phosphor-icons/react";
import {
  buttonVariants,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardTitle,
  Badge,
} from "@reactive-resume/ui";
import { cn } from "@reactive-resume/utils";

import { SectionIcon } from "../shared/section-icon";

const CapabilitiesCard = () => (
  <Card className="space-y-4 bg-gradient-to-br from-blue-50/80 to-purple-50/80 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-100 dark:border-blue-800/30">
    <CardContent className="space-y-4">
      <div className="flex items-center gap-3 mb-2">
        
        <CardTitle className="text-xl">
          {t`Unlock Your Full Potential with Cverra`}
        </CardTitle>
      </div>
      
      <CardDescription className="space-y-4 text-foreground/80 dark:text-foreground/80">
        <div className="space-y-3">
          <p className="text-lg font-medium text-blue-700 dark:text-blue-300">
            <Trans>Cverra powerful resume builder gives you the best.</Trans>
          </p>
          
          <div className="space-y-2">
            <h4 className="font-semibold text-foreground dark:text-foreground">
              {t`Cverra handles all kinds of complex resumes with ease:`}
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
              <div className="flex items-start gap-2 p-2 bg-white/50 dark:bg-gray-800/30 rounded-lg">
                <Briefcase className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <span className="text-sm">{t`Executive & C-Level Profiles`}</span>
              </div>
              <div className="flex items-start gap-2 p-2 bg-white/50 dark:bg-gray-800/30 rounded-lg">
                <GraduationCap className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <span className="text-sm">{t`Academic & Research CVs`}</span>
              </div>
              <div className="flex items-start gap-2 p-2 bg-white/50 dark:bg-gray-800/30 rounded-lg">
                <Cpu className="h-5 w-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                <span className="text-sm">{t`Technical & Engineering Roles`}</span>
              </div>
              <div className="flex items-start gap-2 p-2 bg-white/50 dark:bg-gray-800/30 rounded-lg">
                <UsersThree className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <span className="text-sm">{t`Creative & Portfolio Careers`}</span>
              </div>
              <div className="flex items-start gap-2 p-2 bg-white/50 dark:bg-gray-800/30 rounded-lg">
                <Globe className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                <span className="text-sm">{t`International & Multi-language`}</span>
              </div>
              <div className="flex items-start gap-2 p-2 bg-white/50 dark:bg-gray-800/30 rounded-lg">
                <Gift className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <span className="text-sm">{t`Industry-Specific Formats`}</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-2 mt-4">
            <h4 className="font-semibold text-foreground dark:text-foreground">
              {t`Why Cverra Resume Builder?`}
            </h4>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="bg-blue-100/50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700">
                <Sparkle className="h-3 w-3 mr-1" />
                {t`AI-Powered Enhancement`}
              </Badge>
              <Badge variant="outline" className="bg-purple-100/50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700">
                <ShieldCheck className="h-3 w-3 mr-1" />
                {t`ATS Optimized`}
              </Badge>
              <Badge variant="outline" className="bg-green-100/50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700">
                <Cpu className="h-3 w-3 mr-1" />
                {t`Smart Templates`}
              </Badge>
              <Badge variant="outline" className="bg-amber-100/50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700">
                <RocketLaunch className="h-3 w-3 mr-1" />
                {t`Real-time Preview`}
              </Badge>
            </div>
          </div>
        </div>
      </CardDescription>
    </CardContent>
    
    <div className="px-6 pb-6">
      <div className="p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
        <p className="text-center text-sm font-medium text-blue-700 dark:text-blue-300">
          <Trans>Our tool is designed to make you stand out. Your success is our priority.</Trans>
        </p>
      </div>
    </div>
  </Card>
);

const SupportCard = () => (
  <Card className="space-y-4 bg-gradient-to-br from-amber-50/80 to-yellow-50/80 dark:from-amber-900/20 dark:to-yellow-900/20 border border-amber-100 dark:border-amber-800/30">
    <CardContent className="space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-amber-500 to-yellow-500">
          <ShieldCheck size={20} className="text-white" />
        </div>
        <CardTitle className="text-xl">
          {t`We're Here to Support You`}
        </CardTitle>
      </div>
      
      <CardDescription className="space-y-4 text-foreground/80 dark:text-foreground/80">
        <div className="space-y-3">
          <p className="text-lg font-medium text-amber-700 dark:text-amber-300">
            <Trans>Get help whenever you need it. Our support team is always ready to assist.</Trans>
          </p>
          
          <div className="space-y-4">
            <div className="p-4 bg-white/50 dark:bg-gray-800/30 rounded-lg">
              <h4 className="font-semibold text-foreground dark:text-foreground mb-3">
                {t`Documentation & Guides`}
              </h4>
              <p className="text-sm mb-3">
                {t`Comprehensive guides and tutorials to help you make the most of Cverra's features.`}
              </p>
              <a
                className={cn(buttonVariants({ size: "sm", variant: "outline" }), "border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/20 w-full")}
                href="/docs"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Book size={14} weight="bold" className="mr-2" />
                <span className="line-clamp-1">{t`View Documentation`}</span>
              </a>
            </div>
            
            <div className="p-4 bg-white/50 dark:bg-gray-800/30 rounded-lg">
              <h4 className="font-semibold text-foreground dark:text-foreground mb-3">
                {t`Direct Support Channels`}
              </h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-amber-200 dark:border-amber-700">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                    <Phone size={18} className="text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-300">{t`Phone Support`}</p>
                    <a 
                      href="tel:+237680834767" 
                      className="text-lg font-bold text-foreground dark:text-foreground hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                    >
                      +237 680 834 767
                    </a>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-amber-200 dark:border-amber-700">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                    <EnvelopeSimpleOpen size={18} className="text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-300">{t`Email Support`}</p>
                    <a 
                      href="mailto:support@cverra.com" 
                      className="text-lg font-bold text-foreground dark:text-foreground hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                    >
                      support@cverra.com
                    </a>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-white/50 dark:bg-gray-800/30 rounded-lg">
              
            </div>
          </div>
        </div>
      </CardDescription>
    </CardContent>
    
    <div className="px-6 pb-6">
      <div className="p-4 bg-gradient-to-r from-amber-500/10 to-yellow-500/10 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-lg border border-amber-200 dark:border-amber-700">
        <p className="text-center text-sm font-medium text-amber-700 dark:text-amber-300">
          <Trans>Your success matters to us. We're committed to helping you create the perfect resume.</Trans>
        </p>
      </div>
    </div>
  </Card>
);

export const InformationSection = () => {
  return (
    <section id="information" className="grid gap-y-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-x-4">
          <SectionIcon id="information" size={18} name={t`About CV Terra`} />
          <h2 className="line-clamp-1 text-2xl font-bold lg:text-3xl">
            {t`Information`}
          </h2>
        </div>
      </header>

      <main className="grid gap-y-6">
        <CapabilitiesCard />
        <SupportCard />
      </main>
      
      <footer className="mt-6 pt-6 border-t border-border">
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            <Trans>Cverra - Building Careers, One Resume at a Time</Trans>
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-xs text-muted-foreground">
            <span>© {new Date().getFullYear()} Cverra</span>
            <span>•</span>
            <span>{t`All rights reserved`}</span>
            <span>•</span>
            <a href="/privacy-policy" className="hover:text-foreground transition-colors">{t`Privacy Policy`}</a>
            <span>•</span>
            <a href="/terms-of-service" className="hover:text-foreground transition-colors">{t`Terms of Service`}</a>
          </div>
        </div>
      </footer>
    </section>
  );
};