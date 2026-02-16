import { zodResolver } from "@hookform/resolvers/zod";
import { t } from "@lingui/macro";
import { ArrowLeft, MailboxIcon, CheckCircle } from "@phosphor-icons/react";
import { forgotPasswordSchema } from "@reactive-resume/dto";
import {
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
import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import type { z } from "zod";

import { useForgotPassword } from "@/client/services/auth";

type FormValues = z.infer<typeof forgotPasswordSchema>;

export const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState<boolean>(false);
  const { forgotPassword, loading } = useForgotPassword();

  const form = useForm<FormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (data: FormValues) => {
    await forgotPassword(data);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="container max-w-md mx-auto px-4 py-16">
        <Helmet>
          <title>
            {t`Check your email`} - {t`Inlirah`}
          </title>
        </Helmet>

        <div className="space-y-8">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckCircle size={32} className="text-green-600 dark:text-green-400" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight">{t`Check your email`}</h1>
              <p className="text-gray-600 dark:text-gray-400">
                {t`We've sent a password reset link to your email address.`}
              </p>
            </div>
          </div>

          {/* Green success alert - more obvious */}
          <Alert variant="success">
            <AlertDescription className="text-sm">
              {t`A password reset link should have been sent to your inbox, if an account existed with the email you provided.`}
              <div className="mt-2 text-xs text-green-700 dark:text-green-300">
                {t`Check your spam folder if you don't see it within a few minutes.`}
              </div>
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <Button
              onClick={() => navigate("/auth/login")}
              className="w-full"
              variant="primary"
            >
              {t`Back to login`}
            </Button>
            <Button
              onClick={() => setSubmitted(false)}
              className="w-full"
              variant="outline"
            >
              {t`Send another link`}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-md mx-auto px-4 py-16">
      <Helmet>
        <title>
          {t`Reset password`} - {t`Inlirah`}
        </title>
      </Helmet>

      <div className="space-y-8">
        <div className="space-y-2 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-4">
            <MailboxIcon size={24} className="text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">{t`Reset your password`}</h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t`Enter your email to receive a password reset link.`}
          </p>
        </div>

        <Form {...form}>
          <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              name="email"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t`Email`}</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <MailboxIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                      <Input
                        placeholder="you@example.com"
                        autoComplete="email"
                        className="pl-10"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-3">
              <Button
                type="submit"
                disabled={loading}
                className="w-full"
              >
                {loading ? t`Sending...` : t`Send reset link`}
              </Button>
              
              <Button
                variant="ghost"
                onClick={() => navigate("/auth/login")}
                className="w-full"
              >
                <ArrowLeft size={16} className="mr-2" />
                {t`Back to login`}
              </Button>
            </div>
          </form>
        </Form>

        <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
            {t`Check your spam folder if you don't see the email.`}
          </p>
        </div>
      </div>
    </div>
  );
};