import { t } from "@lingui/macro";
import { motion } from "framer-motion";
import {
  Brain,
  Cloud,
  Files,
  Folder,
  Lock,
  Star,
  TextAa,
  Translate,
  Eye,
  Swatches,
  Layout,
  Briefcase,
} from "@phosphor-icons/react";
import { cn } from "@reactive-resume/utils";

type Feature = {
  icon: React.ReactNode;
  title: string;
  description: string;
};

const features: Feature[] = [
  {
    icon: <Brain size={32} />,
    title: t`Smart AI assistance`,
    description: t`Get intelligent suggestions to craft resumes that stand out to recruiters.`,
  },
  {
    icon: <Files size={32} />,
    title: t`Single or multi-page resumes`,
    description: t`Easily create resumes for different needs, whether concise or detailed without page limits.`,
  },
  {
    icon: <Folder size={32} />,
    title: t`Manage multiple resumes`,
    description: t`Keep different versions of your resumes well organized and accessible with no stress.`,
  },
  {
    icon: <Swatches size={32} />,
    title: t`Customizable color palettes`,
    description: t`Pick the perfect colors to match your personal or corporate brand.`,
  },
  {
    icon: <TextAa size={32} />,
    title: t`Variety of fonts`,
    description: t`Choose from professional fonts to make your resume visually appealing.`,
  },
  {
    icon: <Lock size={32} />,
    title: t`Secure & private`,
    description: t`Protect your resumes with optional password security and access control in your settings.`,
  },
  {
    icon: <Star size={32} />,
    title: t`Custom resume sections`,
    description: t`You are not restricted to a particular format. Add unique sections to highlight achievements, skills, and projects.`,
  },
  {
    icon: <Translate size={32} />,
    title: t`Multilingual support`,
    description: t`Create resumes in multiple languages to reach global opportunities without need for extra translation.`,
  },
  {
    icon: <Eye size={32} />,
    title: t`Analytics & tracking`,
    description: t`Monitor how often your resume is viewed or downloaded by employers.`,
  },
  {
    icon: <Cloud size={32} />,
    title: t`Cloud sync & hosting`,
    description: t`Access your resumes anywhere and choose to self-host or store in the cloud.`,
  },
  {
    icon: <Layout size={32} />,
    title: t`Best responsiveness`,
    description: t`Your resumes look perfect on desktop, tablet, and mobile devices.`,
  },
  {
    icon: <Briefcase size={32} />,
    title: t`High-level professional resumes`,
    description: t`Craft resumes suitable for top industries and enterprise-level roles.`,
  },
];

export const FeaturesSection = () => {
  return (
    <section
      id="features"
      className="relative py-24 sm:py-32 bg-background text-foreground transition-colors"
    >
      <div className="container mx-auto px-6">
        <div className="text-center space-y-6 mb-16">
          <h2 className="text-4xl font-bold">
            {t`Built for professionals who demand excellence.`}
          </h2>
          <p className="max-w-2xl mx-auto text-base leading-relaxed">
            {t`Cverra helps you create, update, and share your professional profiles with elegance and precision.`}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0, transition: { delay: index * 0.1 } }}
              viewport={{ once: true }}
              className="flex flex-col items-center justify-center gap-3 rounded-xl border border-border p-6 text-center bg-muted/50 backdrop-blur-md transition-colors hover:bg-primary/10 dark:hover:bg-primary/20"
            >
              <div className="text-primary dark:text-primary/80">{feature.icon}</div>
              <h4 className="font-semibold text-lg">{feature.title}</h4>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
