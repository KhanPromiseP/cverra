import { t, Trans } from "@lingui/macro";
import { 
  CreditCard,
  DollarSign,
  Wallet,
  Shield,
  RefreshCw,
  TrendingUp,
  HelpCircle,
  Smartphone,
  Zap,
  Sparkles,
  CheckCircle2,
  Clock,
  AlertCircle,
  Globe,
  Calculator,
  Target,
  BarChart,
  Users,
  ArrowRight,
  Calendar,
  Lock
} from "lucide-react";
import { cn } from "@reactive-resume/utils";
import { Link } from "react-router";

// Tip Component
const Tip = ({ children }: { children: React.ReactNode }) => (
  <div className="p-4 rounded-lg bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/10 dark:to-cyan-900/10 border border-blue-200 dark:border-blue-800 my-6">
    <div className="flex items-start gap-3">
      <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
      <div className="flex-1">
        <p className="text-sm text-blue-800 dark:text-blue-300 font-medium">{t`Quick Tip`}</p>
        <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">{children}</p>
      </div>
    </div>
  </div>
);

// Section Header Component
interface SectionHeaderProps {
  id: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
}

const SectionHeader = ({ id, title, description, icon }: SectionHeaderProps) => {
  return (
    <div className="relative group">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 flex items-center justify-center">
              {icon}
            </div>
          )}
          <div>
            <h2 id={id} className="text-2xl font-bold text-gray-900 dark:text-white">
              {title}
            </h2>
            {description && (
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {description}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const PaymentsPremiumTrustSection = () => {
  return (
    <div id="payments-premium-trust" className="scroll-mt-28 space-y-16">
      {/* Hero Section */}
      <div className="mb-12">
        <div className="bg-gradient-to-r from-blue-50 via-purple-50 to-cyan-50 dark:from-blue-900/20 dark:via-purple-900/20 dark:to-cyan-900/20 rounded-2xl p-8 border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 flex items-center justify-center flex-shrink-0">
              <CreditCard className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                {t`Payments & Premium Guide`}
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl">
                <Trans>
                  Everything you need to know about coins, subscriptions, and payments on Inlirah. 
                  Get the best value for premium features with flexible payment options.
                </Trans>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Navigation */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <button
          onClick={() => document.getElementById('understanding-coins')?.scrollIntoView({ behavior: 'smooth' })}
          className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/10 dark:to-cyan-900/10 rounded-xl border border-blue-200 dark:border-blue-800 hover:scale-105 transition-transform"
        >
          <div className="flex flex-col items-center text-center">
            <DollarSign className="w-6 h-6 text-blue-600 dark:text-blue-400 mb-2" />
            <span className="font-medium text-sm text-gray-900 dark:text-white">{t`Coins`}</span>
          </div>
        </button>
        <button
          onClick={() => document.getElementById('payment-options')?.scrollIntoView({ behavior: 'smooth' })}
          className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 rounded-xl border border-green-200 dark:border-green-800 hover:scale-105 transition-transform"
        >
          <div className="flex flex-col items-center text-center">
            <CreditCard className="w-6 h-6 text-green-600 dark:text-green-400 mb-2" />
            <span className="font-medium text-sm text-gray-900 dark:text-white">{t`Payment Methods`}</span>
          </div>
        </button>
        <button
          onClick={() => document.getElementById('subscriptions')?.scrollIntoView({ behavior: 'smooth' })}
          className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/10 dark:to-pink-900/10 rounded-xl border border-purple-200 dark:border-purple-800 hover:scale-105 transition-transform"
        >
          <div className="flex flex-col items-center text-center">
            <RefreshCw className="w-6 h-6 text-purple-600 dark:text-purple-400 mb-2" />
            <span className="font-medium text-sm text-gray-900 dark:text-white">{t`Subscriptions`}</span>
          </div>
        </button>
        <button
          onClick={() => document.getElementById('smart-spending')?.scrollIntoView({ behavior: 'smooth' })}
          className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 rounded-xl border border-amber-200 dark:border-amber-800 hover:scale-105 transition-transform"
        >
          <div className="flex flex-col items-center text-center">
            <TrendingUp className="w-6 h-6 text-amber-600 dark:text-amber-400 mb-2" />
            <span className="font-medium text-sm text-gray-900 dark:text-white">{t`Smart Spending`}</span>
          </div>
        </button>
      </div>

      {/* Understanding Coins */}
      <section id="understanding-coins" className="scroll-mt-24">
        <SectionHeader
          id="understanding-coins"
          title={t`Understanding Coins`}
          description={t`Inlirah's currency for premium features`}
          icon={<DollarSign className="w-6 h-6" />}
        />

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t`What Are Coins?`}
            </h3>
            <div className="space-y-4">
              {[
                {
                  point: t`Virtual Currency`,
                  description: t`Coins are Inlirah's internal currency for accessing premium features`,
                  icon: <Wallet className="w-4 h-4" />
                },
                {
                  point: t`Exchange Rate`,
                  description: t`1 USD = 10 coins (standard conversion rate)`,
                  icon: <Calculator className="w-4 h-4" />
                },
                {
                  point: t`No Expiration`,
                  description: t`Coins never expire and remain in your wallet`,
                  icon: <Clock className="w-4 h-4" />
                },
                {
                  point: t`Universal Use`,
                  description: t`Use coins for AI features, premium templates, and advanced tools`,
                  icon: <Target className="w-4 h-4" />
                }
              ].map((item, index) => (
                <div key={index} className="flex items-start gap-3 p-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                    {item.icon}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">{item.point}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{item.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/10 dark:to-cyan-900/10 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t`Coin Values at a Glance`}
            </h3>
            <div className="space-y-4">
              {[
                { amount: "$5", coins: "50 coins", use: t`Try a few AI features` },
                { amount: "$10", coins: "100 coins", use: t`Enhance 2-3 documents` },
                { amount: "$20", coins: "200 coins", use: t`Comprehensive resume + letter` },
                { amount: "$50", coins: "500 coins", use: t`Premium package for multiple projects` }
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">{item.amount}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{item.coins}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-700 dark:text-gray-300">{item.use}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <Tip>
          {t`Start with a small coin purchase to test premium features, then consider a subscription if you use coins regularly.`}
        </Tip>
      </section>

      {/* Two Ways to Get Coins */}
      <section id="getting-coins" className="scroll-mt-24">
        <SectionHeader
          id="getting-coins"
          title={t`Two Ways to Get Coins`}
          description={t`Choose between subscriptions or direct purchases`}
          icon={<Wallet className="w-6 h-6" />}
        />

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Subscription Plans */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/10 dark:to-pink-900/10 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                <RefreshCw className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {t`Subscription Plans`}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t`Best value for regular users`}
                </p>
              </div>
            </div>
            
            <div className="space-y-3">
              {[
                { feature: t`Recurring automatic payments`, icon: <CheckCircle2 className="w-4 h-4" /> },
                { feature: t`Save up to 50%`, icon: <CheckCircle2 className="w-4 h-4" /> },
                { feature: t`Bonus coins with plans`, icon: <CheckCircle2 className="w-4 h-4" /> },
                { feature: t`Cancel anytime`, icon: <CheckCircle2 className="w-4 h-4" /> },
                { feature: t`Priority support`, icon: <CheckCircle2 className="w-4 h-4" /> }
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    {item.icon}
                  </div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">{item.feature}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-purple-200 dark:border-purple-700">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">{t`Available Tiers:`}</h4>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                  <div className="font-medium text-gray-900 dark:text-white">Basic</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Entry-level</div>
                </div>
                <div className="p-2 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-lg">
                  <div className="font-medium text-gray-900 dark:text-white">Pro</div>
                  <div className="text-xs text-purple-600 dark:text-purple-400">Most Popular</div>
                </div>
                <div className="p-2 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                  <div className="font-medium text-gray-900 dark:text-white">Premium</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Power users</div>
                </div>
              </div>
            </div>
          </div>

          {/* Direct Purchases */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 rounded-xl p-6 border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {t`Direct Coin Purchases`}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t`Flexible one-time payments`}
                </p>
              </div>
            </div>
            
            <div className="space-y-3">
              {[
                { feature: t`One-time payments`, icon: <CheckCircle2 className="w-4 h-4" /> },
                { feature: t`Flexible amounts ($5-100+)`, icon: <CheckCircle2 className="w-4 h-4" /> },
                { feature: t`Instant delivery`, icon: <CheckCircle2 className="w-4 h-4" /> },
                { feature: t`No commitment`, icon: <CheckCircle2 className="w-4 h-4" /> },
                { feature: t`Multiple payment options`, icon: <CheckCircle2 className="w-4 h-4" /> }
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    {item.icon}
                  </div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">{item.feature}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-green-200 dark:border-green-700">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">{t`Quick Amounts:`}</h4>
              <div className="flex flex-wrap gap-2">
                {["$5", "$10", "$20", "$50", "$100"].map((amount) => (
                  <div key={amount} className="px-3 py-1 bg-white/50 dark:bg-gray-800/50 rounded-full text-sm">
                    {amount}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t`Which Option is Right for You?`}
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                {t`Choose Subscription If:`}
              </h4>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• {t`You use premium features regularly`}</li>
                <li>• {t`You want the best value per coin`}</li>
                <li>• {t`You prefer automatic payments`}</li>
                <li>• {t`You need consistent coin supply`}</li>
              </ul>
            </div>
            <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                {t`Choose Direct Purchase If:`}
              </h4>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• {t`You use premium features occasionally`}</li>
                <li>• {t`You want complete payment control`}</li>
                <li>• {t`You prefer pay-as-you-go`}</li>
                <li>• {t`You're trying premium features first`}</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Payment Methods */}
      <section id="payment-options" className="scroll-mt-24">
        <SectionHeader
          id="payment-options"
          title={t`Payment Methods`}
          description={t`Secure payment options for every user`}
          icon={<CreditCard className="w-6 h-6" />}
        />

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {t`Stripe (Recommended)`}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t`Global payment processing`}
                </p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">{t`Supported Methods:`}</h4>
                <div className="flex flex-wrap gap-2">
                  {["Credit Cards", "Debit Cards", "Apple Pay", "Google Pay", "Bank Transfers"].map((method) => (
                    <span key={method} className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs">
                      {method}
                    </span>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">{t`Supported Currencies:`}</h4>
                <div className="flex flex-wrap gap-2">
                  {["USD", "EUR", "GBP", "CAD", "AUD"].map((currency) => (
                    <span key={currency} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs">
                      {currency}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-start gap-2">
                  <Shield className="w-4 h-4 text-blue-500 mt-0.5" />
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    {t`PCI compliant with bank-level security and fraud protection`}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                <Smartphone className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {t`Tranzak (Mobile Money)`}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t`Local payment solutions`}
                </p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">{t`Supported Methods:`}</h4>
                <div className="flex flex-wrap gap-2">
                  {["Mobile Money", "UBA", "Visa/Mastercard"].map((method) => (
                    <span key={method} className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded text-xs">
                      {method}
                    </span>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">{t`Supported Currencies:`}</h4>
                <div className="flex flex-wrap gap-2">
                  {["XAF", "USD", "EUR"].map((currency) => (
                    <span key={currency} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs">
                      {currency}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex items-start gap-2">
                  <Globe className="w-4 h-4 text-green-500 mt-0.5" />
                  <p className="text-sm text-green-700 dark:text-green-300">
                    {t`Perfect for users in Africa and other regions with mobile money preferences`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </section>

      {/* Account Management */}
      <section id="account-management" className="scroll-mt-24">
        <SectionHeader
          id="account-management"
          title={t`Managing Your Account`}
          description={t`Track and control your coins and subscriptions`}
          icon={<BarChart className="w-6 h-6" />}
        />

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/10 dark:to-purple-900/10 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t`For Logged In Users`}
            </h3>
            <div className="space-y-4">
              {[
                { feature: t`View Available Coins`, description: t`Check current balance instantly` },
                { feature: t`See Coin Sources`, description: t`Track subscription vs purchase coins` },
                { feature: t`Manage Subscription`, description: t`Change plans or cancel anytime` },
                { feature: t`Purchase History`, description: t`Receive transactions invoice after each purchase` },

              ].map((item, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">{item.feature}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{item.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
    {t`For New Users`}
  </h3>
  <div className="space-y-4">
    <div className="p-4 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 border border-green-200 dark:border-green-800">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <h4 className="font-medium text-gray-900 dark:text-white">{t`Welcome Bonus!`}</h4>
          <p className="text-xs text-green-600 dark:text-green-400">
            {t`Get free coins just for signing up`}
          </p>
        </div>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        {t`All new users receive free welcome coins to try premium features immediately after account creation.`}
      </p>
    </div>
    
    <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50">
      <h4 className="font-medium text-gray-900 dark:text-white mb-2">{t`Getting Started:`}</h4>
      <ol className="text-sm text-gray-600 dark:text-gray-400 space-y-1 pl-4 list-decimal">
        <li><span className="font-medium">{t`Create Free Account`}</span> - {t`Get welcome coins instantly`}</li>
        <li><span className="font-medium">{t`Explore Features`}</span> - {t`Try free and premium tools`}</li>
        <li><span className="font-medium">{t`Purchase Coins`}</span> - {t`Add more when needed (from $5)`}</li>
        <li><span className="font-medium">{t`Consider Subscription`}</span> - {t`For regular usage`}</li>
      </ol>
    </div>
    
   
  </div>
</div>
        </div>
      </section>

      {/* Smart Spending Tips */}
      <section id="smart-spending" className="scroll-mt-24">
        <SectionHeader
          id="smart-spending"
          title={t`Smart Spending Tips`}
          description={t`Maximize value and control your budget`}
          icon={<TrendingUp className="w-6 h-6" />}
        />

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Calculator className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {t`Calculate Your Needs`}
              </h3>
            </div>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
              <li>• {t`Estimate your monthly usage`}</li>
              <li>• {t`Compare subscription vs purchase costs`}</li>
              <li>• {t`Start with coins, upgrade if usage increases`}</li>
              <li>• {t`Track which features use most coins`}</li>
            </ul>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Zap className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {t`Maximize Value`}
              </h3>
            </div>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
              <li>• {t`Yearly subscriptions save up to 50%`}</li>
              <li>• {t`Pro Plan offers best overall value`}</li>
              <li>• {t`Bundle purchases for large amounts`}</li>
              <li>• {t`Use quick purchase buttons for control`}</li>
            </ul>
          </div>

          
        </div>

        <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 rounded-xl p-6 border border-amber-200 dark:border-amber-800">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
            {t`Pro Tip: Hybrid Approach`}
          </h3>
          <p className="text-gray-700 dark:text-gray-300">
            {t`Many successful users start with direct coin purchases to test features, then switch to a subscription once they understand their usage patterns. This approach minimizes risk while maximizing value.`}
          </p>
        </div>
      </section>

      {/* Security & Trust */}
      <section id="security-trust" className="scroll-mt-24">
        <SectionHeader
          id="security-trust"
          title={t`Security & Trust`}
          description={t`Your protection is our priority`}
          icon={<Shield className="w-6 h-6" />}
        />

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t`Your Protection`}
            </h3>
            <div className="space-y-4">
              {[
                { feature: t`Secure Payments`, description: t`PCI compliant processing` },
                { feature: t`Data Privacy`, description: t`Your information is encrypted` },
                { feature: t`24/7 Support`, description: t`Help available anytime` },
                { feature: t`Fraud Protection`, description: t`Advanced monitoring systems` }
              ].map((item, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-3 h-3 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">{item.feature}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{item.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t`Important Notes`}
            </h3>
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <div className="flex items-start gap-2">
                  <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    {t`Subscription coins are delivered on renewal date`}
                  </p>
                </div>
              </div>
              
              <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
                <div className="flex items-start gap-2">
                  <Zap className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5" />
                  <p className="text-sm text-green-700 dark:text-green-300">
                    {t`Purchased coins are added instantly after payment`}
                  </p>
                </div>
              </div>
              
              <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                <div className="flex items-start gap-2">
                  <Lock className="w-4 h-4 text-purple-600 dark:text-purple-400 mt-0.5" />
                  <p className="text-sm text-purple-700 dark:text-purple-300">
                    {t`All coins remain if you cancel subscription`}
                  </p>
                </div>
              </div>
              
              <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-gray-600 dark:text-gray-400 mt-0.5" />
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {t`No hidden fees - Price shown is final price`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 rounded-xl p-6 border border-green-200 dark:border-green-800">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
            {t`Before Contacting Support`}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="w-8 h-8 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center mx-auto mb-2">
                <BarChart className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-sm text-gray-700 dark:text-gray-300">{t`Check balance`}</span>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center mx-auto mb-2">
                <Clock className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-sm text-gray-700 dark:text-gray-300">{t`Review transactions`}</span>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center mx-auto mb-2">
                <CreditCard className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-sm text-gray-700 dark:text-gray-300">{t`Verify payment method`}</span>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center mx-auto mb-2">
                <HelpCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-sm text-gray-700 dark:text-gray-300">{t`Read documentation`}</span>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="scroll-mt-24">
        <SectionHeader
          id="faq"
          title={t`Frequently Asked Questions`}
          description={t`Quick answers to common questions`}
          icon={<HelpCircle className="w-6 h-6" />}
        />

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="space-y-6">
            {[
              {
                question: t`Can I use both subscription and direct purchases?`,
                answer: t`Yes! You can have an active subscription AND purchase additional coins whenever you need them.`
              },
              {
                question: t`What happens if I cancel my subscription?`,
                answer: t`You keep all your coins. No more payments, but no more automatic coin delivery.`
              },
              {
                question: t`Are there any hidden fees?`,
                answer: t`No. The price shown includes all fees. We take charge of any aditional fee some payment providers may add as transaction fee.`
              },
              {
                question: t`How quickly do coins arrive?`,
                answer: t`Instantly for purchases, on schedule for subscriptions.`
              }
            ].map((faq, index) => (
              <div key={index} className="pb-6 border-b border-gray-200 dark:border-gray-700 last:border-0 last:pb-0">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{faq.question}</h3>
                <p className="text-gray-600 dark:text-gray-400">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <div className="text-center py-12">
        <div className="max-w-2xl mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center mx-auto mb-6">
            <CreditCard className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            {t`Ready to Get Started?`}
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            {t`Choose the payment option that works best for you and unlock premium features today.`}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/dashboard/pricing"
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              <Wallet className="w-5 h-5" />
              <span>{t`View Subscription Plans`}</span>
            </Link>
            <Link
              to="/dashboard"
              className="px-6 py-3 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-2"
            >
              <ArrowRight className="w-5 h-5" />
              <span>{t`Go to Dashboard`}</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};