// import { t, Trans } from "@lingui/macro";
// import { ArrowRight, Info, SealCheck } from "@phosphor-icons/react";
// import { Alert, AlertDescription, AlertTitle, Button } from "@reactive-resume/ui";
// import { useEffect } from "react";
// import { Helmet } from "react-helmet-async";
// import { Link, useNavigate, useSearchParams } from "react-router";

// import { useToast } from "@/client/hooks/use-toast";
// import { queryClient } from "@/client/libs/query-client";
// import { useVerifyEmail } from "@/client/services/auth";

// export const VerifyEmailPage = () => {
//   const { toast } = useToast();
//   const navigate = useNavigate();
//   const [searchParams] = useSearchParams();
//   const token = searchParams.get("token");

//   const { verifyEmail, loading } = useVerifyEmail();

//   useEffect(() => {
//     const handleVerifyEmail = async (token: string) => {
//       await verifyEmail({ token });
//       await queryClient.invalidateQueries({ queryKey: ["user"] });

//       toast({
//         variant: "success",
//         icon: <SealCheck size={16} weight="bold" />,
//         title: t`Your email address has been verified successfully.`,
//       });

//       void navigate("/dashboard/resumes", { replace: true });
//     };

//     if (!token) return;

//     void handleVerifyEmail(token);
//   }, [token, navigate, verifyEmail]);

//   return (
//     <div className="space-y-6">
//       <Helmet>
//         <title>
//           {t`Verify your email address`} - {t`Inrah`}
//         </title>
//       </Helmet>

//       <div className="space-y-2">
//         <h2 className="text-2xl font-semibold tracking-tight">{t`Verify your email address`}</h2>
//         <p className="leading-relaxed opacity-75">
//           <Trans>
//             You should have received an email from <strong>Inrah</strong> with a link to
//             verify your account.
//           </Trans>
//         </p>
//       </div>

//       <Alert variant="info">
//         <Info size={18} />
//         <AlertTitle>{t`Please note that this step is completely optional.`}</AlertTitle>
//         <AlertDescription>
//           {t`We verify your email address only to ensure that we can send you a password reset link in case you forget your password.`}
//         </AlertDescription>
//       </Alert>

//       <Button asChild disabled={loading}>
//         <Link to="/dashboard">
//           {t`Go to Dashboard`}
//           <ArrowRight className="ml-2" />
//         </Link>
//       </Button>
//     </div>
//   );
// };


import { t, Trans } from "@lingui/macro";
import { ArrowRight, Info, SealCheck, EnvelopeSimple, WarningCircle } from "@phosphor-icons/react";
import { Alert, AlertDescription, AlertTitle, Button } from "@reactive-resume/ui";
import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate, useSearchParams } from "react-router";

import { useToast } from "@/client/hooks/use-toast";
import { queryClient } from "@/client/libs/query-client";
import { useVerifyEmail } from "@/client/services/auth";
import { useResendVerificationEmail } from "@/client/services/auth"; // Add this import

export const VerifyEmailPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [hasAttemptedVerification, setHasAttemptedVerification] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const { verifyEmail, loading: verifyLoading } = useVerifyEmail();
  const { resendVerificationEmail, loading: resendLoading } = useResendVerificationEmail();

  useEffect(() => {
    const handleVerifyEmail = async (token: string) => {
      setVerificationStatus('loading');
      try {
        await verifyEmail({ token });
        await queryClient.invalidateQueries({ queryKey: ["user"] });

        setVerificationStatus('success');
        setHasAttemptedVerification(true);

        toast({
          variant: "success",
          icon: <SealCheck size={16} weight="bold" />,
          title: t`Your email address has been verified successfully.`,
          description: t`You can now access all features of your account.`,
        });

        // Delay navigation slightly to show success message
        setTimeout(() => {
          void navigate("/dashboard/resumes", { replace: true });
        }, 2000);
      } catch (error) {
        setVerificationStatus('error');
        setHasAttemptedVerification(true);
        
        toast({
          variant: "error",
          icon: <WarningCircle size={16} weight="bold" />,
          title: t`Verification failed`,
          description: t`The verification link is invalid or has expired. Please request a new verification email.`,
        });
      }
    };

    if (!token) return;

    void handleVerifyEmail(token);
  }, [token, navigate, verifyEmail]);

  const handleResendEmail = async () => {
    try {
      await resendVerificationEmail();
      
      toast({
        variant: "success",
        icon: <EnvelopeSimple size={16} weight="bold" />,
        title: t`Verification email sent`,
        description: t`Check your inbox for the new verification link.`,
      });
    } catch (error) {
      toast({
        variant: "error",
        icon: <WarningCircle size={16} weight="bold" />,
        title: t`Failed to resend email`,
        description: t`Please try again later or contact support if the problem persists.`,
      });
    }
  };

  const renderContent = () => {
    if (verificationStatus === 'loading') {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-lg font-medium">{t`Verifying your email...`}</h3>
            <p className="text-sm opacity-75">
              {t`Please wait while we verify your email address.`}
            </p>
          </div>
        </div>
      );
    }

    if (verificationStatus === 'success') {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-center text-green-500">
            <SealCheck size={64} weight="bold" />
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-lg font-medium">{t`Email Verified Successfully!`}</h3>
            <p className="text-sm opacity-75">
              {t`Redirecting you to the dashboard...`}
            </p>
          </div>
        </div>
      );
    }

    if (verificationStatus === 'error' || hasAttemptedVerification) {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-center text-red-500">
            <WarningCircle size={64} weight="bold" />
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-lg font-medium">{t`Verification Failed`}</h3>
            <p className="text-sm opacity-75">
              {t`The verification link is invalid or has expired.`}
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <Button onClick={handleResendEmail} loading={resendLoading} disabled={resendLoading}>
              <EnvelopeSimple className="mr-2" size={16} />
              {t`Resend Verification Email`}
            </Button>
            <Button asChild variant="outline">
              <Link to="/dashboard">
                {t`Go to Dashboard`}
                <ArrowRight className="ml-2" size={16} />
              </Link>
            </Button>
          </div>
        </div>
      );
    }

    // Default view - no token or initial state
    return (
      <>
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight">{t`Verify your email address`}</h2>
          <p className="leading-relaxed opacity-75">
            <Trans>
              We've sent a verification link to your email address. Click the link in the email to verify your account.
            </Trans>
          </p>
        </div>

        <Alert variant="info">
          <Info size={18} />
          <AlertTitle>{t`Didn't receive the email?`}</AlertTitle>
          <AlertDescription>
            <Trans>
              Check your spam folder, or click the button below to resend the verification email.
            </Trans>
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          <Button 
            onClick={handleResendEmail} 
            loading={resendLoading} 
            disabled={resendLoading}
            className="w-full"
          >
            <EnvelopeSimple className="mr-2" size={16} />
            {t`Resend Verification Email`}
          </Button>
          
          <Alert variant="warning">
            <Info size={18} />
            <AlertTitle>{t`Note`}</AlertTitle>
            <AlertDescription>
              <Trans>
                You can access Inrah features without verification, but email verification is required for password recovery and important notifications!
              </Trans>
            </AlertDescription>
          </Alert>

          <Button asChild variant="outline" className="w-full">
            <Link to="/dashboard">
              {t`Continue to Dashboard`}
              <ArrowRight className="ml-2" />
            </Link>
          </Button>
        </div>
      </>
    );
  };

  return (
    <div className="container max-w-md mx-auto">
      <div className="space-y-6 p-6 bg-card rounded-lg border shadow-sm">
        <Helmet>
          <title>
            {t`Verify your email address`} - {t`Inrah`}
          </title>
        </Helmet>

        {renderContent()}
      </div>
    </div>
  );
};