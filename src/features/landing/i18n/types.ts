export type AppLocale = "en" | "es";

export type ActionLink = {
  label: string;
  href: string;
};

export type PlanTier = {
  code: "basic" | "intermediate" | "premium";
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
    login: string;
    logout: string;
    openMenuAriaLabel: string;
    closeMenuAriaLabel: string;
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
  contact: {
    instagramLabel: string;
    instagramHref: string;
    emailLabel: string;
    emailHref: string;
  };
  onboarding: {
    title: string;
    description: string;
    ctaLabel: string;
    pageTitle: string;
    pageDescription: string;
    pendingApprovalTitle: string;
    pendingApprovalDescription: string;
    pendingApprovalCtaLabel: string;
  };
  auth: {
    modalTitle: string;
    modalSubtitle: string;
    nameLabel: string;
    emailLabel: string;
    passwordLabel: string;
    loginCta: string;
    signupCta: string;
    switchToSignup: string;
    switchToLogin: string;
    closeLabel: string;
    requiredForCheckoutMessage: string;
    verifyEmailMessage: string;
    emailNotConfirmedMessage: string;
    invalidCredentialsMessage: string;
    genericError: string;
    accountLabel: string;
    planLabel: string;
    adminPlanLabel: string;
    noPlanLabel: string;
    profileLabel: string;
    subscribersLabel: string;
    formLabel: string;
    cancelSubscriptionLabel: string;
    cancelSubscriptionLoadingLabel: string;
    cancelSubscriptionErrorLabel: string;
    cancelSubscriptionConfirmTitle: string;
    cancelSubscriptionConfirmTextBeforePlan: string;
    cancelSubscriptionConfirmTextAfterPlan: string;
    cancelSubscriptionConfirmCancelLabel: string;
  };
  seo: {
    title: string;
    description: string;
  };
};
