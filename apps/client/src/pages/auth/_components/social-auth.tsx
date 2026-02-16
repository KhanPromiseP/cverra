import { t } from "@lingui/macro";
import { Fingerprint, GithubLogo, GoogleLogo } from "@phosphor-icons/react";
import { Button } from "@reactive-resume/ui";

import { useAuthProviders } from "@/client/services/auth/providers";

export const SocialAuth = () => {
  const { providers } = useAuthProviders();

  if (!providers || providers.length === 0) return null;

  return (
    <div className="">
    {/* <div className="grid grid-cols-2 gap-4"> */}
      {/* {providers.includes("github") && (
        <Button asChild size="lg" className="w-full !bg-[#222] !text-white hover:!bg-[#222]/80">
          <a href="/api/auth/github">
            <GithubLogo className="mr-3 size-4" />
            {t`GitHub`}
          </a>
        </Button>
      )} */}

      {/* Google Auth */}
      <Button
        asChild
        size="lg"
        className="w-full !bg-[#4285F4] !text-white font-medium hover:!bg-[#4285F4]/90 transition-all"
      >
        <a
          href="/api/auth/google"
          className="flex items-center justify-center gap-3"
        >
          <GoogleLogo className="size-6" weight="bold" />
          <span className="text-sm tracking-wide">
            {t`Continue with Google`}
          </span>
        </a>
      </Button>

      {providers.includes("openid") && (
        <Button
          asChild
          size="lg"
          className="w-full !bg-[#dc2626] !text-white hover:!bg-[#dc2626]/80"
        >
          <a href="/api/auth/openid">
            <Fingerprint className="mr-3 size-4" />
            {import.meta.env.VITE_OPENID_NAME}
          </a>
        </Button>
      )}
    </div>
  );
};
