import { t, Trans } from "@lingui/macro";
import { buttonVariants } from "@reactive-resume/ui";
import { cn } from "@reactive-resume/utils";

type LogoProps = { company: string };

const Logo = ({ company }: LogoProps) => (
  <div
    className={cn(
      "col-span-2 col-start-2 sm:col-start-auto lg:col-span-1",
      company === "twilio" && "sm:col-start-2",
    )}
  >
    <img
      className="block max-h-12 object-contain dark:hidden"
      src={`/brand-logos/dark/${company}.svg`}
      alt={company}
      width={212}
      height={48}
    />
    <img
      className="hidden max-h-12 object-contain dark:block"
      src={`/brand-logos/light/${company}.svg`}
      alt={company}
      width={212}
      height={48}
    />
  </div>
);

const logoList: string[] = ["amazon", "google", "postman", "twilio", "zalando"];

export const LogoCloudSection = () => (
  <section id="logo-cloud" className="relative py-24 sm:py-32">
    <div className="mx-auto max-w-7xl px-6 lg:px-8">
      <div className="text-center">
        <p className="text-center text-xl leading-relaxed text-gray-700 dark:text-gray-300">
          {t`Why professionals worldwide choose Inlirah:`}
        </p>
      </div>

      <p className="mx-auto mt-6 max-w-4xl text-center text-2xl font-bold leading-relaxed text-gray-900 dark:text-white">
        <Trans>
          One platform for your entire professional journey and personal growth.
          Inlirah combines resume crafting, letter writing, and expert knowledge
          into a seamless experience that transforms how professionals build
          their careers.
        </Trans>
      </p>

      <div className="mt-12 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-emerald-500/5 blur-3xl"></div>

        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="text-center p-4">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <span className="text-white text-2xl">📄</span>
            </div>
            <h4 className="font-bold text-gray-900 dark:text-white mb-2">
              {t`Resume Excellence`}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t`ATS-optimized, professionally crafted resumes`}
            </p>
          </div>

          <div className="text-center p-4">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
              <span className="text-white text-2xl">✍️</span>
            </div>
            <h4 className="font-bold text-gray-900 dark:text-white mb-2">
              {t`Perfect Letters`}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t`Professional correspondence for every situation`}
            </p>
          </div>

          <div className="text-center p-4">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
              <span className="text-white text-2xl">📚</span>
            </div>
            <h4 className="font-bold text-gray-900 dark:text-white mb-2">
              {t`Expert Knowledge`}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t`Career insights and powerful hidden life mysteries`}
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-12 grid max-w-lg grid-cols-4 items-center gap-x-8 gap-y-10 sm:max-w-xl sm:grid-cols-6 sm:gap-x-10 lg:mx-0 lg:max-w-none lg:grid-cols-5">
        {logoList.map((company) => (
          <Logo key={company} company={company} />
        ))}
      </div>

      <p className="mx-auto mt-10 max-w-xl text-center text-lg font-medium leading-relaxed text-gray-700 dark:text-gray-300">
        <Trans>
          Join thousands worldwide who have unlocked their full potential with
          Inlirah&apos;s complete career ecosystem.
        </Trans>
      </p>

      <div className="mt-8 flex justify-center">
        <div className="inline-flex divide-x divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="px-4 py-3 text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              95%
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              {t`Success Rate`}
            </div>
          </div>

          <div className="px-4 py-3 text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              6K+
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              {t`Hours Saved`}
            </div>
          </div>

          <div className="px-4 py-3 text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              3-in-1
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              {t`Platform Power`}
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);
