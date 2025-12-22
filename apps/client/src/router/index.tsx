import { createBrowserRouter, createRoutesFromElements, Navigate, Route } from "react-router";

import { BackupOtpPage } from "../pages/auth/backup-otp/page";
import { ForgotPasswordPage } from "../pages/auth/forgot-password/page";
import { AuthLayout } from "../pages/auth/layout";
import { LoginPage } from "../pages/auth/login/page";
import { RegisterPage } from "../pages/auth/register/page";
import { ResetPasswordPage } from "../pages/auth/reset-password/page";
import { VerifyEmailPage } from "../pages/auth/verify-email/page";
import { VerifyOtpPage } from "../pages/auth/verify-otp/page";
import { BuilderLayout } from "../pages/builder/layout";
import { builderLoader, BuilderPage } from "../pages/builder/page";
import { DashboardLayout } from "../pages/dashboard/layout";
import { ResumesPage } from "../pages/dashboard/resumes/page";
import { SettingsPage } from "../pages/dashboard/settings/page";
import { HomeLayout } from "../pages/home/layout";
import { HomePage } from "../pages/home/page";
import { ErrorPage } from "../pages/public/error";
import { publicLoader, PublicResumePage } from "../pages/public/page";
import { Providers } from "../providers";
import { AuthGuard } from "./guards/auth";
import { GuestGuard } from "./guards/guest";
import { authLoader } from "./loaders/auth";
// Example in your router configuration
import { PrivacyPolicyPage } from "../pages/home/components/privacy-policy";
import { LearnMorePage } from "../pages/home/sections/hero/learn-more";

import CoverLettersPage from "../pages/dashboard/cover-letters/page";
import CoverLetterEditorPage from "../pages/builder/cover-letter-editor/page";
import { CoverLetterLayout } from '@/client/components/cover-letter/cover-letter-layout';
import { CoverLetterWizardPage } from '../pages/dashboard/cover-letters/wizard/page';
import { DashboardHomePage } from "../pages/dashboard/page";

import { SubscriptionPage } from "../pages/SubscriptionPage";

import { PaymentSuccessPage } from '../pages/PaymentSuccessPage';
import { InvoicePage } from '../pages/InvoicePage';

// Import Admin Components
import { AdminGuard } from './guards/admin';
import { AdminDashboardPage } from '../pages/admin/dashboard/page';
import { AdminSubscriptionPlans } from '../pages/admin/subscription-plans/page';
import { AdminUsersPage } from '../pages/admin/users/page';
import { AdminAnalyticsPage } from '../pages/admin/analytics/page';
import { AdminSettingsPage } from '../pages/admin/settings/page';

// Import Article Management Components - Remove AdminLayout import
import Dashboard from '../pages/articles/Dashboard';
import DashboardWrapper from '../pages/articles/Dashboard';
import ArticlesList from '../pages/articles/admin/articles/ArticlesList';
import ArticleForm from '../pages/articles/admin/articles/ArticleForm';
import CategoriesManagement from '../pages/articles/admin/CategoriesManagement';
import TranslationManagement from '../pages/articles/admin/TranslationManagement';

import ArticlesPage from "../pages/articles/page";
// import ArticlePage from "../pages/articles/article/[slug]/page";
import ArticlePage from "../pages/articles/article/ArticlePage";


// Add this import
import UserProfilePage from "../pages/dashboard/profile/page";

import CategoriesPage from "../components/articles/CategoriesPage";
import AllArticlesPage from '../components/articles/AllArticlesPage';




export const routes = createRoutesFromElements(
  <Route element={<Providers />}>
    <Route errorElement={<ErrorPage />}>
      <Route element={<HomeLayout />}>
        <Route path="/" element={<HomePage />} />

      
      </Route>

      <Route element={<DashboardLayout />}>
        {/* Articles Routes - PUBLIC */}
        <Route path="/dashboard/articles" element={<ArticlesPage />} />
        <Route path="/dashboard/article/:slug" element={<ArticlePage />} />

        <Route path="/dashboard/categories" element={<CategoriesPage />} />

        <Route path="/dashboard/articles/all" element={<AllArticlesPage />} />
      </Route>

      <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
      <Route path="/learn-more" element={<LearnMorePage />} />

      {/* Public Payment Callback Routes (Tranzak redirects here) */}
      <Route path="/payments/callback/tranzak/success" element={<PaymentSuccessPage />} />
      <Route path="/payments/callback/tranzak/failure" element={<PaymentSuccessPage />} />

      {/* Protected Payment Routes */}
      <Route path="/payments">
        <Route element={<AuthGuard />}>
          <Route path="invoice/:paymentId" element={<InvoicePage />} />
          <Route path="invoice/:paymentId/download" element={<InvoicePage />} />
          <Route path="invoice/:paymentId/html" element={<InvoicePage />} />
        </Route>
      </Route>

      <Route path="auth">
        <Route element={<AuthLayout />}>
          <Route element={<GuestGuard />}>
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
          </Route>

          {/* Password Recovery */}
          <Route element={<GuestGuard />}>
            <Route path="forgot-password" element={<ForgotPasswordPage />} />
            <Route path="reset-password" element={<ResetPasswordPage />} />
          </Route>

          {/* Two-Factor Authentication */}
          <Route element={<GuestGuard />}>
            <Route path="verify-otp" element={<VerifyOtpPage />} />
            <Route path="backup-otp" element={<BackupOtpPage />} />
          </Route>

          {/* Email Verification */}
          <Route element={<AuthGuard />}>
            <Route path="verify-email" element={<VerifyEmailPage />} />
          </Route>

          {/* OAuth Callback */}
          <Route path="callback" loader={authLoader} element={<div />} />
        </Route>

        <Route index element={<Navigate replace to="/auth/login" />} />
      </Route>

      <Route path="dashboard">
        <Route element={<AuthGuard />}>
          <Route element={<DashboardLayout />}>
            {/* Dashboard Home */}
            <Route index element={<DashboardHomePage />} />
            <Route path="resumes" element={<ResumesPage />} />
            <Route path="cover-letters" element={<CoverLettersPage />} />
            
            {/* Add the wizard route under dashboard */}
            <Route path="cover-letters/wizard" element={<CoverLetterWizardPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="pricing" element={<SubscriptionPage />} />
            <Route path="profile" element={<UserProfilePage />} />

            {/* ARTICLE ADMIN ROUTES - Now directly under DashboardLayout */}
            <Route path="article-admin">
              <Route index element={<DashboardWrapper />} />
              <Route path="articles" element={<ArticlesList />} />
              <Route path="articles/new" element={<ArticleForm />} />
              <Route path="articles/edit/:id" element={<ArticleForm />} />
              <Route path="articles/drafts" element={<ArticlesList />} />
              <Route path="articles/scheduled" element={<ArticlesList />} />
              <Route path="categories" element={<CategoriesManagement />} />
              <Route path="translations" element={<TranslationManagement />} />
              <Route path="settings" element={<div>Article Settings Page</div>} />
            </Route>
            
            {/* MAIN ADMIN ROUTES */}
            <Route path="admin">
              <Route element={<AdminGuard />}>
                <Route index element={<Navigate replace to="/dashboard/admin/dashboard" />} />
                <Route path="dashboard" element={<AdminDashboardPage />} />
                <Route path="subscription-plans" element={<AdminSubscriptionPlans />} />
                <Route path="users" element={<AdminUsersPage />} />
                <Route path="analytics" element={<AdminAnalyticsPage />} />
                <Route path="settings" element={<AdminSettingsPage />} />
              </Route>
            </Route>

          </Route>
        </Route>
      </Route>

      <Route path="builder">
        <Route element={<AuthGuard />}>
          {/* Resume Builder Routes */}
          <Route element={<BuilderLayout />}>
            <Route path=":id" loader={builderLoader} element={<BuilderPage />} />
          </Route>

          {/* Cover Letter Builder Routes - SEPARATE from BuilderLayout */}
          <Route element={<CoverLetterLayout />}>
            <Route path="cover-letter/new" element={<CoverLetterEditorPage mode="create" />} />
            <Route path="cover-letter/:id/edit" element={<CoverLetterEditorPage mode="edit" />} />
          </Route>

          <Route index element={<Navigate replace to="/dashboard" />} />
        </Route>
      </Route>

      {/* Public Routes */}
      <Route path=":username">
        <Route path=":slug" loader={publicLoader} element={<PublicResumePage />} />
      </Route>
    </Route>
  </Route>,
);

export const router = createBrowserRouter(routes);