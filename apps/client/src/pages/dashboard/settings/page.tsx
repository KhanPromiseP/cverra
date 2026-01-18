import { t } from "@lingui/macro";
import { ScrollArea, Separator } from "@reactive-resume/ui";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";

import { AccountSettings } from "./_sections/account";
import { DangerZoneSettings } from "./_sections/danger";
import { ProfileSettings } from "./_sections/profile";
import { SecuritySettings } from "./_sections/security";

export const SettingsPage = () => (
  <>
    <Helmet>
      <title>
        {t`Settings`} - {t`Inlirah`}
      </title>
    </Helmet>

    <div className="space-y-6">
      <motion.h1
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        className="text-4xl justify-center flex mb-20 font-bold tracking-tight"
      >
        {t`Settings`}
      </motion.h1>

      <Separator />

      {/* Mobile Layout - Single Column with Danger Zone at Bottom */}
      <div className="space-y-12 lg:hidden">
        {/* Account Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="mb-4 text-2xl font-semibold tracking-tight">{t`Account`}</h2>
          <AccountSettings />
        </motion.div>

        <Separator />

        {/* Profile Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <h2 className="mb-4 text-2xl font-semibold tracking-tight">{t`Profile`}</h2>
          <ProfileSettings />
        </motion.div>

        <Separator />

        {/* Security Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="mb-4 text-2xl font-semibold tracking-tight">{t`Security`}</h2>
          <SecuritySettings />
        </motion.div>

        <Separator />

        {/* Danger Zone - Always at Bottom on Mobile */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <h2 className="mb-4 text-2xl font-semibold tracking-tight text-red-600 dark:text-red-500">
            {t`Danger Zone`}
          </h2>
          <DangerZoneSettings />
        </motion.div>
      </div>

      {/* Desktop Layout - Two Columns */}
      <div className="hidden lg:flex lg:flex-row lg:gap-8">
        {/* Left Column - General Settings */}
        <div className="flex-1 space-y-6 lg:max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-6"
          >
            <div>
              <h2 className="mb-4 text-2xl font-semibold tracking-tight">{t`General`}</h2>
              <div className="space-y-12">
                <AccountSettings />
                <Separator />
                <ProfileSettings />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Vertical Separator */}
        <div className="hidden lg:block">
          <Separator orientation="vertical" />
        </div>

        {/* Right Column - Security & Danger Zone */}
        <div className="flex-1 space-y-6 lg:max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-12"
          >
            {/* Security Section */}
            <div>
              <h2 className="mb-4 text-2xl font-semibold tracking-tight">{t`Security`}</h2>
              <SecuritySettings />
            </div>

            <Separator />

            {/* Danger Zone Section */}
            <div>
              <h2 className="mb-4 text-2xl font-semibold tracking-tight text-red-600 dark:text-red-500">
                {t`Danger Zone`}
              </h2>
              <DangerZoneSettings />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  </>
);