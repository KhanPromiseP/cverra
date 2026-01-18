import { zodResolver } from "@hookform/resolvers/zod";
import { i18n } from "@lingui/core";
import { msg, t } from "@lingui/macro";
import {
  QrCode,
  Shield,
  ShieldCheck,
  ShieldWarning,
  DeviceMobile,
  Download,
  CheckCircle,
  Info,
  ArrowLeft,
  ArrowRight,
  CaretRight,
  Copy,
  Check,
  WarningCircle,
} from "@phosphor-icons/react";
import {
  Alert,
  AlertDescription,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Separator,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@reactive-resume/ui";
import { QRCodeSVG } from "qrcode.react";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useToast } from "@/client/hooks/use-toast";
import { queryClient } from "@/client/libs/query-client";
import { useDisable2FA, useEnable2FA, useSetup2FA } from "@/client/services/auth";
import { useDialog } from "@/client/stores/dialog";

const formSchema = z.object({
  uri: z.literal("").or(z.string().optional()),
  code: z
    .literal("")
    .or(z.string().regex(/^\d{6}$/, i18n._(msg`Code must be exactly 6 digits long.`))),
  backupCodes: z.array(z.string()),
});

type FormValues = z.infer<typeof formSchema>;

export const TwoFactorDialog = () => {
  const { toast } = useToast();
  const { isOpen, mode, open, close } = useDialog("two-factor");
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);

  const isCreate = mode === "create";
  const isUpdate = mode === "update";
  const isDelete = mode === "delete";
  const isDuplicate = mode === "duplicate";

  const { setup2FA, loading: setupLoading } = useSetup2FA();
  const { enable2FA, loading: enableLoading } = useEnable2FA();
  const { disable2FA, loading: disableLoading } = useDisable2FA();

  const loading = setupLoading || enableLoading || disableLoading;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { uri: "", code: "", backupCodes: [] },
  });

  const uri = form.watch("uri");
  const secret = uri?.split("secret=")[1]?.split("&")[0] || "";

  // Get QR code from server
  useEffect(() => {
    const initialize = async () => {
      const data = await setup2FA();
      form.setValue("uri", data.message);
    };

    if (isCreate) void initialize();
  }, [isCreate]);

  const onSubmit = async (values: FormValues) => {
    if (isCreate) {
      open("update");
      return;
    }

    if (isUpdate) {
      if (!values.code) return;

      const data = await enable2FA({ code: values.code });
      form.setValue("backupCodes", data.backupCodes);
      await queryClient.invalidateQueries({ queryKey: ["user"] });

      open("duplicate");
      return;
    }

    if (isDuplicate) {
      close();
      return;
    }

    if (isDelete) {
      const data = await disable2FA();
      toast({ variant: "success", title: data.message });
      await queryClient.invalidateQueries({ queryKey: ["user"] });
      close();
      return;
    }
  };

  const copySecret = () => {
    if (secret) {
      navigator.clipboard.writeText(secret);
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
      toast({
        variant: "success",
        title: t`Secret key copied to clipboard`,
        description: t`Paste this into your authenticator app if you can't scan the QR code.`,
      });
    }
  };

  const downloadBackupCodes = () => {
    const backupCodes = form.getValues("backupCodes");
    if (!backupCodes.length) return;

    const blob = new Blob([backupCodes.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Inlirah-backup-codes.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      variant: "success",
      title: t`Backup codes downloaded`,
      description: t`Save this file in a secure location.`,
    });
  };

  if (isDelete) {
    return (
      <AlertDialog open={isOpen} onOpenChange={close}>
        <AlertDialogContent>
          <Form {...form}>
            <form className="space-y-4">
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <ShieldWarning className="h-5 w-5" />
                  {t`Disable Two-Factor Authentication?`}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {t`You will no longer need a verification code when signing in. This reduces your account security.`}
                </AlertDialogDescription>
              </AlertDialogHeader>

              <Alert variant="warning" className="border-amber-200 bg-amber-50">
                <WarningCircle className="h-4 w-4" />
                <AlertDescription>
                  {t`Without 2FA, your account is protected only by your password.`}
                </AlertDescription>
              </Alert>

              <AlertDialogFooter>
                <AlertDialogCancel>{t`Keep 2FA Enabled`}</AlertDialogCancel>
                <AlertDialogAction
                  variant="warning"
                  onClick={form.handleSubmit(onSubmit)}
                  disabled={loading}
                >
                  {loading ? t`Disabling...` : t`Disable 2FA`}
                </AlertDialogAction>
              </AlertDialogFooter>
            </form>
          </Form>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={close}>
      <DialogContent className="!max-w-lg">
        <Form {...form}>
          <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>
                <div className="flex items-center gap-3">
                  {isCreate && <QrCode className="h-6 w-6" />}
                  {isUpdate && <DeviceMobile className="h-6 w-6" />}
                  {isDuplicate && <ShieldCheck className="h-6 w-6" />}
                  <h2 className="text-xl">
                    {isCreate && t`Set Up Two-Factor Authentication`}
                    {isUpdate && t`Verify Setup`}
                    {isDuplicate && t`Backup Codes`}
                  </h2>
                </div>
              </DialogTitle>
              <DialogDescription>
                {isCreate && t`Protect your account with an extra layer of security.`}
                {isUpdate && t`Confirm setup by entering a code from your authenticator app.`}
                {isDuplicate && t`Save these codes in case you lose access to your phone.`}
              </DialogDescription>
            </DialogHeader>

            {isCreate && (
              <div className="space-y-6">
                <div className="rounded-lg border p-4">
                  <h3 className="mb-4 flex items-center gap-2 font-medium">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                      1
                    </div>
                    {t`Get an authenticator app`}
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {[
                      {
                        name: "Google Authenticator",
                        desc: "Simple & reliable",
                        url: "https://apps.apple.com/app/google-authenticator/id388497605",
                        icon: "📱",
                      },
                      {
                        name: "Authy",
                        desc: "With cloud backup",
                        url: "https://authy.com/download/",
                        icon: "☁️",
                      },
                      {
                        name: "Microsoft Authenticator",
                        desc: "Microsoft ecosystem",
                        url: "https://www.microsoft.com/en-us/security/mobile-authenticator-app",
                        icon: "🔐",
                      },
                      {
                        name: "LastPass Authenticator",
                        desc: "Password manager users",
                        url: "https://lastpass.com/auth/",
                        icon: "🔒",
                      },
                    ].map((app) => (
                      <a
                        key={app.name}
                        href={app.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-accent"
                      >
                        <span className="text-2xl">{app.icon}</span>
                        <div className="flex-1">
                          <div className="font-medium">{app.name}</div>
                          <div className="text-xs opacity-60">{app.desc}</div>
                        </div>
                        <CaretRight className="h-4 w-4 opacity-40" />
                      </a>
                    ))}
                  </div>
                  <p className="mt-3 text-xs opacity-60">
                    {t`Already have one installed? Great! Continue to the next step.`}
                  </p>
                </div>

                <div className="rounded-lg border p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="mb-1 flex items-center gap-2 font-medium">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                          2
                        </div>
                        {t`Scan the QR code`}
                      </h3>
                      <p className="text-sm opacity-75">
                        {t`Open your app and tap "Add Account" or the + icon`}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowManualEntry(!showManualEntry)}
                    >
                      {showManualEntry ? t`Show QR Code` : t`Can't scan?`}
                    </Button>
                  </div>

                  {showManualEntry ? (
                    <div className="mt-4 space-y-3">
                      <div>
                        <div className="mb-2 flex items-center justify-between">
                          <FormLabel className="text-sm">{t`Manual Entry`}</FormLabel>
                          <TooltipProvider>
                              <Tooltip
                                content={copiedSecret ? t`Copied!` : t`Copy secret key`}
                              >
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={copySecret}
                                    type="button"
                                  >
                                    {copiedSecret ? (
                                      <Check className="h-4 w-4" />
                                    ) : (
                                      <Copy className="h-4 w-4" />
                                    )}
                                  </Button>
                                </TooltipTrigger>
                              </Tooltip>
                            </TooltipProvider>
                        </div>
                        <div className="rounded bg-muted p-3">
                          <code className="block break-all font-mono text-sm">
                            {secret}
                          </code>
                        </div>
                        <FormDescription className="mt-2">
                          {t`In your authenticator app, choose "Enter a setup key" and paste this code.`}
                        </FormDescription>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 space-y-4">
                      <div className="flex justify-center">
                        <div className="rounded-lg border p-4">
                          <QRCodeSVG
                            value={uri ?? ""}
                            size={192}
                            includeMargin
                            className="mx-auto"
                          />
                        </div>
                      </div>
                      <FormDescription className="text-center">
                        {t`Point your app's camera at this QR code.`}
                      </FormDescription>
                    </div>
                  )}
                </div>

                <Alert className="border-blue-200 bg-blue-50">
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    {t`After scanning, your app will show 6-digit codes for "Inlirah". Continue to the next step to verify.`}
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {isUpdate && (
              <div className="space-y-6">
                <div className="rounded-lg border p-4">
                  <h3 className="mb-4 flex items-center gap-2 font-medium">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                      3
                    </div>
                    {t`Enter verification code`}
                  </h3>
                  <FormField
                    name="code"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t`6-digit code from your app`}</FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={6}
                            placeholder="123456"
                            autoFocus
                            className="text-center text-2xl tracking-widest"
                            {...field}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                              field.onChange(value);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                        <FormDescription>
                          {t`Open your authenticator app and enter the code shown for "Inlirah".`}
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                </div>

                <Alert variant="info">
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    {t`Codes refresh every 30 seconds. If it doesn't work, wait for a new code and try again.`}
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {isDuplicate && (
              <div className="space-y-6">
                <Alert variant="warning">
                  <WarningCircle className="h-4 w-4" />
                  <AlertDescription>
                    {t`Save these backup codes now! This is your only chance to see them.`}
                  </AlertDescription>
                </Alert>

                <div className="rounded-lg border p-4">
                  <h3 className="mb-4 flex items-center justify-between font-medium">
                    <span className="flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5" />
                      {t`Your Backup Codes`}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={downloadBackupCodes}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      {t`Download`}
                    </Button>
                  </h3>

                  <FormField
                    name="backupCodes"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <div className="grid grid-cols-2 gap-3 rounded bg-muted/50 p-4">
                          {field.value.map((code, index) => (
                            <div
                              key={code}
                              className="flex items-center justify-between rounded border bg-background px-3 py-2"
                            >
                              <code className="font-mono">{code}</code>
                              <span className="text-xs opacity-50">#{index + 1}</span>
                            </div>
                          ))}
                        </div>
                        <FormDescription className="mt-4">
                          <div className="space-y-2">
                            <p>{t`Each code can be used once to sign in if you lose access to your authenticator app.`}</p>
                            <ul className="ml-4 list-disc space-y-1 text-sm">
                              <li>{t`Store them in a password manager`}</li>
                              <li>{t`Print them and keep them in a safe place`}</li>
                              <li>{t`Don't save them on your computer or email`}</li>
                            </ul>
                          </div>
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                </div>

                <Alert className="border-green-200 bg-green-50">
                  <ShieldCheck className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    <strong>{t`Two-factor authentication is now enabled!`}</strong>{" "}
                    {t`You'll need to enter a code from your authenticator app each time you sign in.`}
                  </AlertDescription>
                </Alert>
              </div>
            )}

            <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="flex-1 text-xs opacity-60">
                {isCreate && t`Step 1 of 3`}
                {isUpdate && t`Step 2 of 3`}
                {isDuplicate && t`Step 3 of 3 - Complete!`}
              </div>
              <div className="flex gap-2">
                {isCreate && (
                  <Button type="submit" className="min-w-[100px]" disabled={loading}>
                    {loading ? t`Preparing...` : t`Continue`}
                  </Button>
                )}
                {isUpdate && (
                  <>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => open("create")}
                      disabled={loading}
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      {t`Back`}
                    </Button>
                    <Button type="submit" className="min-w-[100px]" disabled={loading}>
                      {loading ? t`Verifying...` : t`Verify & Continue`}
                    </Button>
                  </>
                )}
                {isDuplicate && (
                  <Button type="submit" className="min-w-[100px]" disabled={loading}>
                    {t`Finish Setup`}
                  </Button>
                )}
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};