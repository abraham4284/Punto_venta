import type { LucideIcon } from "lucide-react";

import { FeatureCard } from "./FeatureCard";

export type FeatureItem = {
  title: string;
  description: string;
  icon: LucideIcon;
  items?: string[];
};

export type FeatureSection = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  items: FeatureItem[];
  callout?: {
    title: string;
    description: string;
  };
};

type FeatureSectionBlockProps = {
  section: FeatureSection;
  tone?: "white" | "muted";
};

export const FeatureSectionBlock = ({
  section,
  tone = "white",
}: FeatureSectionBlockProps) => {
  return (
    <section
      id={section.id}
      className={
        tone === "muted"
          ? "scroll-mt-20 bg-slate-50 py-20"
          : "scroll-mt-20 bg-white py-20"
      }
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl space-y-4">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">
            {section.eyebrow}
          </p>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {section.title}
          </h2>
          <p className="text-base leading-7 text-muted-foreground">
            {section.description}
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {section.items.map((item) => (
            <FeatureCard key={item.title} {...item} />
          ))}
        </div>

        {section.callout && (
          <div className="mt-8 rounded-2xl border border-primary/20 bg-primary/5 p-6">
            <h3 className="text-xl font-semibold">{section.callout.title}</h3>
            <p className="mt-3 max-w-4xl text-sm leading-6 text-muted-foreground">
              {section.callout.description}
            </p>
          </div>
        )}
      </div>
    </section>
  );
};
