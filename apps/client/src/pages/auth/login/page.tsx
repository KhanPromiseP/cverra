import { zodResolver } from "@hookform/resolvers/zod";
import { t, Trans } from "@lingui/macro";
import { ArrowRight, Eye, EyeSlash, Lock, Envelope, Rocket } from "@phosphor-icons/react";
import { loginSchema } from "@reactive-resume/dto";
import { usePasswordToggle } from "@reactive-resume/hooks";
import {
  Alert,
  AlertTitle,
  Button,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
} from "@reactive-resume/ui";
import { cn } from "@reactive-resume/utils";
import { useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useForm } from "react-hook-form";
import { Link } from "react-router";
import type { z } from "zod";
import { motion } from "framer-motion";

import { useLogin } from "@/client/services/auth";
import { useFeatureFlags } from "@/client/services/feature";

type FormValues = z.infer<typeof loginSchema>;

export const LoginPage = () => {
  const { login, loading } = useLogin();
  const { flags } = useFeatureFlags();
  const [showPassword, setShowPassword] = useState(false);

  const formRef = useRef<HTMLFormElement>(null);
  usePasswordToggle(formRef);

  const form = useForm<FormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: "", password: "" },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      await login(data);
    } catch {
      form.reset();
    }
  };

  return (
    <div className="space-y-8">
      <Helmet>
        <title>
          {t`Sign in to your account`} - {t`Cverra`}
        </title>
      </Helmet>

      {/* Enhanced Header Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-3 text-center"
      >
        
        <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
          {t`Sign in to your account`}
        </h2>
        
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          {t`Continue your career journey with Cverra`}
        </p>

        <div className="pt-1">
          <h6 className="text-gray-500 dark:text-gray-400">
            <span>{t`Don't have an account?`}</span>
            <Button asChild variant="link" className="px-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold group">
              <Link to="/auth/register">
                {t`Create one now`}
                <ArrowRight className="ml-1 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </h6>
        </div>
      </motion.div>

      {flags.isEmailAuthDisabled && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Alert variant="error" className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
            <AlertTitle className="text-red-800 dark:text-red-200">
              {t`Signing in via email is currently disabled by the administrator.`}
            </AlertTitle>
          </Alert>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className={cn(flags.isEmailAuthDisabled && "pointer-events-none select-none blur-sm")}
      >
        <Form {...form}>
          <form
            ref={formRef}
            className="flex flex-col gap-y-3"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            {/* Email Field */}
            <FormField
              name="identifier"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {t`Email or Username`}
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Envelope className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        autoComplete="email"
                        className="lowercase pl-11 pr-4 py-3 h-12 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-blue-500 dark:focus:border-blue-400 transition-colors duration-200 shadow-sm"
                        placeholder="khan@example.com"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormDescription className="text-xs text-gray-500 dark:text-gray-400">
                    {t`You can also enter your username.`}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Password Field */}
            <FormField
              name="password"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {t`Password`}
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        className="pl-11 pr-11 py-1 h-12 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-blue-500 dark:focus:border-blue-400 transition-colors duration-200 shadow-sm"
                        placeholder="Enter your password"
                        {...field}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeSlash className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormDescription className="text-xs text-gray-500 dark:text-gray-400">
                    <Trans>
                      Hold <code className="text-xs font-bold bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded">Ctrl</code> to display your password temporarily.
                    </Trans>
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Action Buttons */}
            <div className="mt-2 flex flex-col sm:flex-row items-center gap-2">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1"
              >
                <Button 
                  type="submit" 
                  disabled={loading} 
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border-0 text-base"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {t`Signing in...`}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4" weight="fill" />
                      {t`Sign in to Cverra`}
                    </div>
                  )}
                </Button>
              </motion.div>

              <Button 
                asChild 
                variant="ghost" 
                className="px-6 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors duration-200"
              >
                <Link to="/auth/forgot-password">
                  {t`Forgot Password?`}
                </Link>
              </Button>
            </div>
          </form>
        </Form>
      </motion.div>

      {/* Enhanced Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-center pt-4 border-t border-gray-200 dark:border-gray-700"
      >
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t`By continuing, you agree to our`}{" "}
          <Link to="/terms" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
            {t`Terms of Service`}
          </Link>{" "}
          {t`and`}{" "}
          <Link to="/privacy" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
            {t`Privacy Policy`}
          </Link>
        </p>
      </motion.div>
    </div>
  );
};