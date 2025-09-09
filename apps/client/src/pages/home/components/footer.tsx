import { t } from "@lingui/macro";
import { Separator } from "@reactive-resume/ui";
import { Link } from "react-router";

import { Logo } from "@/client/components/logo";

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-background border-t border-gray-200 dark:border-gray-700">
      <Separator />

      <div className="container grid py-12 sm:grid-cols-3 lg:grid-cols-4">
        <div className="flex flex-col gap-y-2">
          <Logo size={96} className="-ml-2" />

          <p className="prose prose-sm prose-zinc leading-relaxed opacity-70 dark:prose-invert">
            {t`Cverra – Create high-quality CVs quickly and professionally.`}
          </p>

          <p className="text-sm opacity-60 mt-4">
            © {currentYear} Cverra. {t`All rights reserved.`}
          </p>
        </div>

        <div className="relative col-start-4 flex flex-col items-end justify-end">
          <div className="mb-14 space-y-6 text-right">
            <Link
              to="/privacy-policy"
              className="block text-sm font-medium hover:text-primary transition-colors"
            >
              {t`Privacy Policy`}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
