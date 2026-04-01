export type AppLocale = "en" | "es";

export type ActionLink = {
  label: string;
  href: string;
};

export type PlanTier = {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  ctaLabel: string;
  highlighted: boolean;
};

export type LandingContent = {
  brand: {
    name: string;
    tagline: string;
  };
  nav: {
    howItWorks: string;
    benefits: string;
    plans: string;
    faq: string;
  };
  hero: {
    title: string;
    description: string;
    primaryAction: ActionLink;
    secondaryAction: ActionLink;
    trustPoints: string[];
  };
  howItWorks: {
    kicker: string;
    title: string;
    stepLabel: string;
    items: Array<{
      title: string;
      description: string;
    }>;
  };
  pricing: {
    kicker: string;
    title: string;
    featuredLabel: string;
    plans: PlanTier[];
  };
  benefits: {
    kicker: string;
    title: string;
    description: string;
    items: string[];
  };
  faq: {
    kicker: string;
    title: string;
    items: Array<{
      question: string;
      answer: string;
    }>;
  };
  finalCta: {
    title: string;
    description: string;
    action: ActionLink;
  };
  footer: {
    disclaimer: string;
    rights: string;
  };
  seo: {
    title: string;
    description: string;
  };
};
