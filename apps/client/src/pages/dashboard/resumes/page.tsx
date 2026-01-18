import { t } from "@lingui/macro";
import { List, SquaresFour } from "@phosphor-icons/react";
import { ScrollArea, Tabs, TabsContent, TabsList, TabsTrigger } from "@reactive-resume/ui";
import { motion } from "framer-motion";
import { useState } from "react";
import { Helmet } from "react-helmet-async";

import { GridView } from "./_layouts/grid";
import { ListView } from "./_layouts/list";

type Layout = "grid" | "list";

export const ResumesPage = () => {
  const [layout, setLayout] = useState<Layout>("grid");

  return (
    <>
      <Helmet>
        <title>
          {t`Resumes`} - {t`Cverra`}
        </title>
      </Helmet>

      {/* Removed pb-[300px] - use minimal padding */}
      <div className="min-h-screen pb-16"> {/* Changed to pb-16 */}
        <Tabs
          value={layout}
          className="space-y-4"
          onValueChange={(value) => {
            setLayout(value as Layout);
          }}
        >
          <div className="flex items-center justify-between">
            <motion.h1
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-4xl font-bold tracking-tight"
            >
              {t`Resume Dashboard`}
            </motion.h1>

            <TabsList>
              <TabsTrigger value="grid" className="size-8 p-0 sm:h-8 sm:w-auto sm:px-4">
                <SquaresFour />
                <span className="ml-2 hidden sm:block">{t`Grid`}</span>
              </TabsTrigger>
              <TabsTrigger value="list" className="size-8 p-0 sm:h-8 sm:w-auto sm:px-4">
                <List />
                <span className="ml-2 hidden sm:block">{t`List`}</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* FIXED: Removed fixed height, use flex-1 for proper content flow */}
          <div className="flex-1 overflow-y-auto"> {/* Changed from ScrollArea to div */}
            <TabsContent value="grid" className="mt-4">
              <GridView />
            </TabsContent>
            <TabsContent value="list" className="mt-4">
              <ListView />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </>
  );
};