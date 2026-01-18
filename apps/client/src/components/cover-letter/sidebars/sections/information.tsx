import { t, Trans } from "@lingui/macro";
import { 
  Book, 
  Phone, 
  EnvelopeSimpleOpen
} from "@phosphor-icons/react";
import {
  buttonVariants,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardTitle,
} from "@reactive-resume/ui";
import { cn } from "@reactive-resume/utils";

const CapabilitiesCard = () => (
  <Card className="space-y-4 bg-gradient-to-br from-blue-50/80 to-purple-50/80 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-100 dark:border-blue-800/30">
    <CardContent className="space-y-4">
      <CardTitle className="text-xl">
        {t`Inlirah Letter Crafting Tool`}
      </CardTitle>
      
      <CardDescription className="space-y-4 text-foreground/80 dark:text-foreground/80">
        <div className="space-y-3">
          <p className="text-lg font-medium text-blue-700 dark:text-blue-300">
            <Trans>Inlirah handles all kinds of letters with ease.</Trans>
          </p>
          
          <div className="space-y-2">
            <h4 className="font-semibold text-foreground dark:text-foreground">
              {t`Professional & Personal Letters:`}
            </h4>
            
            <div className="grid grid-cols-1 gap-2 mt-3">
              <p className="text-sm">• {t`Job application letters`}</p>
              <p className="text-sm">• {t`Internship letters`}</p>
              <p className="text-sm">• {t`Business correspondence`}</p>
              <p className="text-sm">• {t`Personal family letters`}</p>
              <p className="text-sm">• {t`Appreciation letters`}</p>
              <p className="text-sm">• {t`And much more...`}</p>
            </div>
          </div>
        </div>
      </CardDescription>
    </CardContent>
    
    <div className="px-6 pb-6">
      <div className="p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
        <p className="text-center text-sm font-medium text-blue-700 dark:text-blue-300">
          <Trans>Our tool is designed to help you communicate effectively in any situation.</Trans>
        </p>
      </div>
    </div>
  </Card>
);

const SupportCard = () => (
  <Card className="space-y-4 bg-gradient-to-br from-amber-50/80 to-yellow-50/80 dark:from-amber-900/20 dark:to-yellow-900/20 border border-amber-100 dark:border-amber-800/30">
    <CardContent className="space-y-4">
      <CardTitle className="text-xl">
        {t`Support`}
      </CardTitle>
      
      <CardDescription className="space-y-4 text-foreground/80 dark:text-foreground/80">
        <div className="space-y-3">
          <div className="p-4 bg-white/50 dark:bg-gray-800/30 rounded-lg">
            <h4 className="font-semibold text-foreground dark:text-foreground mb-3">
              {t`Documentation`}
            </h4>
            <p className="text-sm mb-3">
              {t`Guides and tutorials for all letter types.`}
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
              {t`Contact Support`}
            </h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                  <Phone size={18} className="text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-300">{t`Phone`}</p>
                  <a 
                    href="tel:+237680834767" 
                    className="text-lg font-bold text-foreground dark:text-foreground hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                  >
                    +237 680 834 767
                  </a>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                  <EnvelopeSimpleOpen size={18} className="text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-300">{t`Email`}</p>
                  <a 
                    href="mailto:support@Inlirah.com" 
                    className="text-lg font-bold text-foreground dark:text-foreground hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                  >
                    support@iinlirah.com
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardDescription>
    </CardContent>
  </Card>
);

export const InformationSection = () => {
  return (
    <section id="information" className="grid gap-y-6">
      <header className="flex items-center gap-x-4">
        <h2 className="line-clamp-1 text-2xl font-bold lg:text-3xl">
          {t`Information`}
        </h2>
      </header>

      <main className="grid gap-y-6">
        <CapabilitiesCard />
        <SupportCard />
      </main>
      
      <footer className="mt-6 pt-6 border-t border-border">
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            <Trans>Inlirah - Building Careers, One Letter at a Time</Trans>
          </p>
          <div className="flex flex-wrap justify-center gap-2 text-xs text-muted-foreground">
            <span>© {new Date().getFullYear()} Inlirah</span>
            <span>•</span>
            <span>{t`All rights reserved`}</span>
            <span>•</span>
            <a href="/privacy-policy" className="hover:text-foreground transition-colors">{t`Privacy`}</a>
            <span>•</span>
            <a href="/terms-of-service" className="hover:text-foreground transition-colors">{t`Terms`}</a>
          </div>
        </div>
      </footer>
    </section>
  );
};