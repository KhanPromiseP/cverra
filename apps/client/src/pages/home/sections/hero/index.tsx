import { t } from "@lingui/macro";
import { ArrowRight } from "@phosphor-icons/react";
import { buttonVariants, Badge } from "@reactive-resume/ui";

import { cn } from "@reactive-resume/utils";
import { motion } from "framer-motion";
import Tilt from "react-parallax-tilt";

import { defaultTiltProps } from "@/client/constants/parallax-tilt";

import { HeroCTA } from "./call-to-action";
import { Decoration } from "./decoration";

export const HeroSection = () => (
  <section id="hero" className="relative min-h-screen overflow-hidden">
    {/* Decorations */}
    <Decoration.Grid />
    <Decoration.Gradient />

    <div className="mx-auto max-w-7xl px-6 lg:flex lg:h-screen lg:items-center lg:px-12">
      {/* Hero Text */}
      <motion.div
        className="mx-auto mt-32 max-w-3xl shrink-0 lg:mx-0 lg:mt-0 lg:max-w-xl lg:pt-8 text-center lg:text-left"
        viewport={{ once: true }}
        initial={{ opacity: 0, x: -100 }}
        whileInView={{ opacity: 1, x: 0 }}
      >
        <Badge variant="secondary" className="mb-4 text-lg uppercase tracking-wider">
          {t`Welcome to the ultimate resume builder`}
        </Badge>

        <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-600 dark:from-blue-400 dark:to-indigo-400">
          {t`Cverra - Your Super Professional Resume Builder`}
        </h1>

        <p className="mt-6 text-lg leading-8 text-muted-foreground">
          {t`Save hours of hard work with resumes that impress recruiters, students, and professionals alike.`}
        </p>

        <div className="mt-10 flex flex-col sm:flex-row sm:items-center gap-4">
          <HeroCTA />
        </div>
      </motion.div>

      {/* Hero Image */}
      <div className="mx-auto mt-16 flex max-w-2xl sm:mt-24 lg:ml-10 lg:mr-0 lg:mt-0 lg:max-w-none lg:flex-none xl:ml-20">
        <motion.div
          className="w-full"
          viewport={{ once: true }}
          initial={{ opacity: 0, x: 100 }}
          whileInView={{ opacity: 1, x: 0 }}
        >
          <Tilt {...defaultTiltProps}>
            <img
              width={600}
              height={278}
              src="https://i.pinimg.com/736x/f0/54/1b/f0541b0b670f019fd5cbfc875df533b2.jpg"
              alt={t`Cverra Resume Builder Screenshot`}
              className="w-full max-w-[36rem] rounded-xl shadow-2xl ring-1 ring-foreground/10 dark:ring-white/20 bg-background/5"
            />
          </Tilt>
        </motion.div>
      </div>
    </div>
  </section>
);
