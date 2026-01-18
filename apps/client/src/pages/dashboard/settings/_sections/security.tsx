import { zodResolver } from "@hookform/resolvers/zod";
import { t, Trans } from "@lingui/macro";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Alert,
  AlertDescription,
  Button,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
} from "@reactive-resume/ui";
import { AnimatePresence, motion } from "framer-motion";
import { DeviceMobile, QrCode, ShieldCheck, ShieldWarning, CheckCircle } from "@phosphor-icons/react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useToast } from "@/client/hooks/use-toast";
import { useUpdatePassword } from "@/client/services/auth";
import { useUser } from "@/client/services/user";
import { useDialog } from "@/client/stores/dialog";

const formSchema = z.object({
  currentPassword: z.string().min(6),
  newPassword: z.string().min(6),
});

type FormValues = z.infer<typeof formSchema>;

export const SecuritySettings = () => {
  const { user } = useUser();
  const { toast } = useToast();
  const { open } = useDialog("two-factor");
  const { updatePassword, loading } = useUpdatePassword();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { currentPassword: "", newPassword: "" },
  });

  const onReset = () => {
    form.reset({ currentPassword: "", newPassword: "" });
  };

  const onSubmit = async (data: FormValues) => {
    await updatePassword({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    });

    toast({
      variant: "success",
      title: t`Your password has been updated successfully.`,
    });

    onReset();
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold leading-relaxed tracking-tight">{t`Security`}</h3>
        <p className="leading-relaxed opacity-75">
          {t`In this section, you can change your password and enable/disable two-factor authentication.`}
        </p>
      </div>

      <Accordion type="multiple" defaultValue={["password", "two-factor"]}>
        <AccordionItem value="password">
          <AccordionTrigger>{t`Password`}</AccordionTrigger>
          <AccordionContent>
            <Form {...form}>
              <form className="grid gap-6 sm:grid-cols-2" onSubmit={form.handleSubmit(onSubmit)}>
                <FormField
                  name="currentPassword"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t`Current Password`}</FormLabel>
                      <FormControl>
                        <Input type="password" autoComplete="current-password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  name="newPassword"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t`New Password`}</FormLabel>
                      <FormControl>
                        <Input type="password" autoComplete="new-password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <AnimatePresence presenceAffectsLayout>
                  {form.formState.isDirty && (
                    <motion.div
                      layout
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="flex items-center space-x-2 self-center sm:col-start-2"
                    >
                      <Button type="submit" disabled={loading}>
                        {t`Change Password`}
                      </Button>
                      <Button type="reset" variant="ghost" onClick={onReset}>
                        {t`Discard`}
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </form>
            </Form>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="two-factor">
          <AccordionTrigger>{t`Two-Factor Authentication`}</AccordionTrigger>
          <AccordionContent>
            {user?.twoFactorEnabled ? (
              <div className="space-y-6">
                <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950/50">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-full bg-green-100 p-1.5 dark:bg-green-900">
                      <ShieldCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium text-green-800 dark:text-green-300">
                        {t`Two-factor authentication is enabled`}
                      </p>
                      <p className="text-sm text-green-700 dark:text-green-400">
                        {t`Your account is protected with an extra layer of security.`}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-lg border p-4">
                    <h4 className="mb-2 font-medium">{t`What happens now?`}</h4>
                    <ul className="space-y-2 text-sm opacity-75">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                        <span>{t`You'll need a 6-digit code from your authenticator app each time you sign in`}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                        <span>{t`Keep your backup codes in a safe place`}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                        <span>{t`Use backup codes if you lose access to your phone`}</span>
                      </li>
                    </ul>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button
                      variant="outline"
                      onClick={() => {
                        // Note: You might want to create a "backup-codes" mode in your dialog
                        // to show backup codes, or handle this differently
                        toast({
                          variant: "info",
                          title: t`Backup Codes`,
                          description: t`Backup codes were shown during setup. If you lost them, you'll need to disable and re-enable 2FA.`,
                        });
                      }}
                      className="flex-1"
                    >
                      {t`View Backup Codes`}
                    </Button>
                    <Button
                      variant="warning"
                      onClick={() => {
                        open("delete");
                      }}
                      className="flex-1"
                    >
                      {t`Disable 2FA`}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <Alert variant="warning" className="border-amber-200">
                  <ShieldWarning className="h-4 w-4" />
                  <AlertDescription>
                    <strong>{t`Your account is not fully secured.`}</strong>{" "}
                    {t`Enable 2FA to add an extra layer of protection.`}
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <div className="rounded-lg border p-4">
                    <h4 className="mb-3 font-medium">{t`How Two-Factor Authentication Works`}</h4>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="flex flex-col items-center text-center">
                        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                          <DeviceMobile className="h-6 w-6" />
                        </div>
                        <div className="font-medium">{t`Get an App`}</div>
                        <p className="mt-1 text-sm opacity-75">
                          {t`Download Google Authenticator or similar`}
                        </p>
                      </div>
                      <div className="flex flex-col items-center text-center">
                        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                          <QrCode className="h-6 w-6" />
                        </div>
                        <div className="font-medium">{t`Scan QR Code`}</div>
                        <p className="mt-1 text-sm opacity-75">
                          {t`We'll show you a QR code to scan`}
                        </p>
                      </div>
                      <div className="flex flex-col items-center text-center">
                        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                          <span className="text-lg font-bold">#</span>
                        </div>
                        <div className="font-medium">{t`Enter Code`}</div>
                        <p className="mt-1 text-sm opacity-75">
                          {t`Use 6-digit codes when signing in`}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border p-4">
                    <h4 className="mb-3 font-medium">{t`Recommended Authenticator Apps`}</h4>
                    <div className="grid gap-3">
                      <a
                        href="https://apps.apple.com/app/google-authenticator/id388497605"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-accent"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                            <span className="text-lg">📱</span>
                          </div>
                          <div>
                            <div className="font-medium">Google Authenticator</div>
                            <div className="text-sm opacity-60">{t`Simple and reliable`}</div>
                          </div>
                        </div>
                        <div className="text-sm opacity-60">→</div>
                      </a>
                      <a
                        href="https://authy.com/download/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-accent"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0F9D58]">
                            <span className="text-lg text-white">☁️</span>
                          </div>
                          <div>
                            <div className="font-medium">Authy</div>
                            <div className="text-sm opacity-60">{t`Cloud backup (recommended)`}</div>
                          </div>
                        </div>
                        <div className="text-sm opacity-60">→</div>
                      </a>
                    </div>
                    <p className="mt-3 text-xs opacity-60">
                      {t`Already have one installed? Great! You can proceed with setup.`}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <Button
                      onClick={() => {
                        open("create");
                      }}
                      className="w-full"
                    >
                      {t`Enable Two-Factor Authentication`}
                    </Button>
                    
                    <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-950/30">
                      <p className="text-sm">
                        <span className="font-medium">{t`Takes 2 minutes to set up`}</span>
                        <span className="opacity-75"> • {t`One-time process`}</span>
                      </p>
                      <p className="mt-1 text-xs opacity-60">
                        {t`After setup, you'll get backup codes to save in case you lose your phone.`}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};