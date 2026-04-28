import { AppLocale, LandingContent } from "@/features/landing/i18n/types";

const messages: Record<AppLocale, LandingContent> = {
  en: {
    brand: {
      name: "LRP Method",
      tagline: "Personal online coaching"
    },
    nav: {
      howItWorks: "How it works",
      benefits: "Benefits",
      plans: "Plans",
      faq: "FAQ",
      login: "Log in",
      logout: "Log out",
      openMenuAriaLabel: "Open navigation menu",
      closeMenuAriaLabel: "Close navigation menu"
    },
    hero: {
      title: "Simple coaching that helps you stay consistent",
      description:
        "Personalized training plans and practical nutrition guidance through monthly subscriptions.",
      primaryAction: {
        label: "Start on Instagram",
        href: "https://www.instagram.com/lrpmethod/"
      },
      secondaryAction: {
        label: "See plans",
        href: "#plans"
      },
      trustPoints: ["Fully online", "Weekly follow-up", "Adapted to your level"]
    },
    howItWorks: {
      kicker: "How it works",
      title: "A simple 3-step process",
      stepLabel: "Step",
      items: [
        {
          title: "Choose your plan",
          description: "Pick the subscription that fits your current goal and schedule."
        },
        {
          title: "Share your profile",
          description:
            "After subscribing, you share measurements, photos, goals, availability, training experience, and limitations."
        },
        {
          title: "Get your personalized plan",
          description:
            "You receive your workout structure, nutrition guidance, and ongoing adjustments."
        }
      ]
    },
    pricing: {
      kicker: "Plans",
      title: "Choose your coaching tier",
      featuredLabel: "Most selected",
      activePlanCtaLabel: "Current plan",
      checkoutErrorMessage: "We couldn't start checkout right now. Please try again.",
      premiumComingSoonLabel: "Coming soon",
      alreadySubscribedModalTitle: "You already have an active plan",
      alreadySubscribedModalTextBeforePlan: "You are already subscribed to",
      alreadySubscribedModalTextAfterPlan: ". Unsubscribe first before switching to a new plan.",
      alreadySubscribedModalOkLabel: "OK",
      plans: [
        {
          code: "basic",
          name: "Basic",
          price: "$19.900",
          period: "/month",
          description: "A simple non-personalized starter plan.",
          features: [
            "Generic training plans for 3 or 4 days",
            "General diet and nutrition information with practical tips"
          ],
          ctaLabel: "Choose Basic",
          highlighted: false
        },
        {
          code: "intermediate",
          name: "Intermediate",
          price: "$33.500",
          period: "/month",
          description: "Best value for steady progress.",
          features: [
            "Personalized workout routine",
            "Nutrition guide",
            "2 adjustments per month",
            "Download routines in PDF"
          ],
          ctaLabel: "Choose Intermediate",
          highlighted: true
        },
        {
          code: "premium",
          name: "Premium",
          price: "$59.970",
          period: "/month",
          description: "Complete support.",
          features: [
            "Personalized workout routine",
            "Nutrition guide",
            "2 adjustments per month",
            "Download routines in PDF",
            "Closer WhatsApp follow-up"
          ],
          ctaLabel: "Choose Premium",
          highlighted: false
        }
      ]
    },
    benefits: {
      kicker: "Benefits",
      title: "Designed to keep you progressing",
      description:
        "The system focuses on adherence, clarity, and adjustments around your routine.",
      items: [
        "Plan built around your real routine and limitations",
        "Clear progression instead of random workouts",
        "Simple nutrition guidance you can sustain",
        "Human coaching and accountability every week"
      ]
    },
    faq: {
      kicker: "FAQ",
      title: "Frequently asked questions",
      items: [
        {
          question: "How fast do I get my plan?",
          answer: "Usually within 24 to 72 hours after you complete your profile."
        },
        {
          question: "Is this for beginners or advanced users?",
          answer:
            "Both. The structure is adapted to your current level, goals, and schedule."
        },
        {
          question: "Do you provide medical nutrition plans?",
          answer:
            "No. This includes general nutrition guidance and does not replace licensed nutrition support."
        },
        {
          question: "Can I cancel anytime?",
          answer: "Yes, you can stop your subscription before the next monthly cycle."
        }
      ]
    },
    finalCta: {
      title: "Start your personalized coaching today",
      description:
        "If you want a realistic plan you can follow, this is the next step.",
      action: {
        label: "Message us on Instagram",
        href: "https://www.instagram.com/lrpmethod/"
      }
    },
    footer: {
      disclaimer:
        "This service provides personalized training and general nutrition guidance only. It does not replace medical advice, diagnosis, treatment, or licensed nutrition counseling.",
      rights: "All rights reserved."
    },
    contact: {
      instagramLabel: "Instagram",
      instagramHref: "https://www.instagram.com/lrpmethod/",
      emailLabel: "Email",
      emailHref: "mailto:contacto@lrpmethod.com"
    },
    onboarding: {
      title: "Initial Assessment Form",
      description: "Complete your data so we can build your training and nutrition plan.",
      ctaLabel: "Complete form",
      pageTitle: "LRP Method Initial Assessment",
      pageDescription: "Fill in your profile and context so we can prepare your coaching plan.",
      pendingApprovalTitle: "Payment verification in progress",
      pendingApprovalDescription:
        "As soon as your payment is confirmed, your onboarding form will be unlocked automatically.",
      pendingApprovalCtaLabel: "Refresh status"
    },
    auth: {
      modalTitle: "Access your account",
      modalSubtitle: "Log in before continuing to payment.",
      forgotPasswordTitle: "Recover your password",
      forgotPasswordSubtitle: "Enter your email and we will send you a reset link.",
      nameLabel: "Full name",
      emailLabel: "Email",
      passwordLabel: "Password",
      confirmPasswordLabel: "Confirm password",
      loginCta: "Log in",
      signupCta: "Create account",
      forgotPasswordCta: "Send reset email",
      forgotPasswordLinkLabel: "Forgot your password?",
      backToLoginLabel: "Back to log in",
      switchToSignup: "Create a new account",
      switchToLogin: "Already have an account? Log in",
      closeLabel: "Close",
      requiredForCheckoutMessage: "You need to log in before paying for this plan.",
      verifyEmailMessage: "Account created. Check your email to verify and then log in.",
      forgotPasswordSuccessMessage: "If that email exists, we sent a password reset link.",
      emailNotConfirmedMessage: "Please confirm your email first. Check your inbox and then try again.",
      invalidCredentialsMessage: "The email or password is incorrect.",
      passwordMismatchMessage: "Passwords do not match.",
      resetPasswordPageTitle: "Set your new password",
      resetPasswordPageDescription: "Use a new password with at least 6 characters.",
      resetPasswordSuccessMessage: "Password updated. You can now log in.",
      resetPasswordRedirectingMessage: "Redirecting to login",
      resetPasswordInvalidLinkMessage: "Invalid or expired link. Request a new recovery email.",
      resetPasswordGenericError: "We could not update your password right now. Please try again.",
      resetPasswordInvalidTokenMessage: "The recovery token is invalid or expired.",
      resetPasswordConfirmCta: "Update password",
      genericError: "Something went wrong. Please try again.",
      accountLabel: "Account",
      planLabel: "Plan",
      adminPlanLabel: "Admin",
      noPlanLabel: "No active plan",
      profileLabel: "Profile",
      myPlanLabel: "My Plan",
      subscribersLabel: "Subscribers",
      formLabel: "Form",
      cancelSubscriptionLabel: "Unsubscribe",
      cancelSubscriptionLoadingLabel: "Canceling...",
      cancelSubscriptionErrorLabel: "We could not cancel your subscription right now.",
      cancelSubscriptionConfirmTitle: "Confirm unsubscribe",
      cancelSubscriptionConfirmTextBeforePlan: "Are you sure you want to unsubscribe from",
      cancelSubscriptionConfirmTextAfterPlan: "?",
      cancelSubscriptionConfirmCancelLabel: "Cancel"
    },
    seo: {
      title: "LRP Method | Online Fitness Coaching & Nutrition Guidance",
      description:
        "Personalized online fitness coaching with training plans, nutrition guidance, and monthly follow-up. Choose the plan that fits your goals."
    }
  },
  es: {
    brand: {
      name: "LRP Method",
      tagline: "Coaching online personalizado"
    },
    nav: {
      howItWorks: "Como funciona",
      benefits: "Beneficios",
      plans: "Planes",
      faq: "FAQ",
      login: "Ingresar",
      logout: "Salir",
      openMenuAriaLabel: "Abrir menu de navegacion",
      closeMenuAriaLabel: "Cerrar menu de navegacion"
    },
    hero: {
      title: "Coaching simple para ayudarte a ser constante",
      description:
        "Planes de entrenamiento personalizados y guia nutricional practica por suscripcion mensual.",
      primaryAction: {
        label: "Empezar por Instagram",
        href: "https://www.instagram.com/lrpmethod/"
      },
      secondaryAction: {
        label: "Ver planes",
        href: "#plans"
      },
      trustPoints: ["100% online", "Seguimiento semanal", "Adaptado a tu nivel"]
    },
    howItWorks: {
      kicker: "Como funciona",
      title: "Un proceso simple de 3 pasos",
      stepLabel: "Paso",
      items: [
        {
          title: "Elegi tu plan",
          description: "Selecciona la suscripcion que mejor se adapte a tu objetivo y horarios."
        },
        {
          title: "Completa tu perfil",
          description:
            "Despues de suscribirte, completas un breve formulario con tus medidas, fotos, objetivos, horarios, experiencia y posibles limitaciones."
        },
        {
          title: "Recibe tu plan personalizado",
          description:
            "Recibes la estructura de entrenamiento, guia nutricional y ajustes continuos."
        }
      ]
    },
    pricing: {
      kicker: "Planes",
      title: "Elige tu nivel de coaching",
      featuredLabel: "El mas elegido",
      activePlanCtaLabel: "Plan comprado",
      checkoutErrorMessage: "No pudimos iniciar el checkout en este momento. Intentalo de nuevo.",
      premiumComingSoonLabel: "Proximamente",
      alreadySubscribedModalTitle: "Ya tienes un plan activo",
      alreadySubscribedModalTextBeforePlan: "Ya estas suscripto al plan",
      alreadySubscribedModalTextAfterPlan: ". Desuscribite primero antes de suscribirte a otro plan.",
      alreadySubscribedModalOkLabel: "OK",
      plans: [
        {
          code: "basic",
          name: "Basico",
          price: "$19.900",
          period: "/mes",
          description: "Plan inicial simple y no personalizado.",
          features: [
            "Planes genericos de entrenamiento de 3 o 4 dias",
            "Dieta general e informacion nutricional con tips practicos"
          ],
          ctaLabel: "Elegir Basico",
          highlighted: false
        },
        {
          code: "intermediate",
          name: "Intermedio",
          price: "$33.500",
          period: "/mes",
          description: "La mejor relacion precio-resultado.",
          features: [
            "Rutina personalizada",
            "Guia de alimentacion",
            "2 ajustes mensuales",
            "Descargar rutinas en PDF"
          ],
          ctaLabel: "Elegir Intermedio",
          highlighted: true
        },
        {
          code: "premium",
          name: "Premium",
          price: "$59.970",
          period: "/mes",
          description: "Acompanamiento completo.",
          features: [
            "Rutina personalizada",
            "Guia de alimentacion",
            "2 ajustes mensuales",
            "Descargar rutinas en PDF",
            "Seguimiento mas cercano por WhatsApp"
          ],
          ctaLabel: "Elegir Premium",
          highlighted: false
        }
      ]
    },
    benefits: {
      kicker: "Beneficios",
      title: "Pensado para sostener progreso",
      description:
        "El sistema prioriza adherencia, claridad y ajustes en base a tu rutina real.",
      items: [
        "Plan adaptado a tu contexto y limitaciones",
        "Progresion clara en lugar de entrenamientos al azar",
        "Guia nutricional simple y sostenible",
        "Acompañamiento humano y seguimiento semanal"
      ]
    },
    faq: {
      kicker: "FAQ",
      title: "Preguntas frecuentes",
      items: [
        {
          question: "Cuanto tarda en llegar mi plan?",
          answer: "Normalmente entre 24 y 72 horas despues de completar tu perfil."
        },
        {
          question: "Es para principiantes o avanzados?",
          answer:
            "Para ambos. La estructura se adapta a tu nivel actual, objetivos y disponibilidad."
        },
        {
          question: "Incluye planes nutricionales medicos?",
          answer:
            "No. Incluye guia nutricional general y no reemplaza asesoramiento nutricional profesional."
        },
        {
          question: "Puedo cancelar cuando quiera?",
          answer: "Si, puedes cancelar antes del siguiente ciclo mensual."
        }
      ]
    },
    finalCta: {
      title: "Empieza hoy tu coaching personalizado",
      description:
        "Si quieres un plan realista que puedas sostener, este es el siguiente paso.",
      action: {
        label: "Escribenos por Instagram",
        href: "https://www.instagram.com/lrpmethod/"
      }
    },
    footer: {
      disclaimer:
        "Este servicio brinda entrenamiento personalizado y guia nutricional general. No reemplaza consejo medico, diagnostico, tratamiento ni asesoramiento nutricional licenciado.",
      rights: "Todos los derechos reservados."
    },
    contact: {
      instagramLabel: "Instagram",
      instagramHref: "https://www.instagram.com/lrpmethod/",
      emailLabel: "Email",
      emailHref: "mailto:contacto@lrpmethod.com"
    },
    onboarding: {
      title: "Formulario de Evaluacion Inicial",
      description: "Completa tus datos para que armemos tu plan de entrenamiento y alimentacion.",
      ctaLabel: "Completar formulario",
      pageTitle: "Evaluacion Inicial LRP Method",
      pageDescription: "Completa tu perfil y contexto para preparar tu plan de coaching.",
      pendingApprovalTitle: "Estamos verificando tu pago",
      pendingApprovalDescription:
        "Apenas se confirme tu pago, se habilita automaticamente el formulario de onboarding.",
      pendingApprovalCtaLabel: "Actualizar estado"
    },
    auth: {
      modalTitle: "Accede a tu cuenta",
      modalSubtitle: "Inicia sesión antes de continuar al pago.",
      forgotPasswordTitle: "Recupera tu contraseña",
      forgotPasswordSubtitle: "Ingresa tu email y te enviaremos un enlace de recuperacion.",
      nameLabel: "Nombre completo",
      emailLabel: "Email",
      passwordLabel: "Contraseña",
      confirmPasswordLabel: "Confirmar contraseña",
      loginCta: "Ingresar",
      signupCta: "Crear cuenta",
      forgotPasswordCta: "Enviar email de recuperacion",
      forgotPasswordLinkLabel: "¿Olvidaste tu Contraseña?",
      backToLoginLabel: "Volver a ingresar",
      switchToSignup: "Crea una cuenta nueva",
      switchToLogin: "¿Ya tienes cuenta? Inicia sesión",
      closeLabel: "Cerrar",
      requiredForCheckoutMessage: "Necesitas iniciar sesión antes de pagar este plan.",
      verifyEmailMessage: "Cuenta creada. Revisa tu email para verificar y luego inicia sesión.",
      forgotPasswordSuccessMessage: "Si ese email existe, enviamos un enlace para recuperar tu contraseña.",
      emailNotConfirmedMessage: "Primero confirma tu email. Revisa tu bandeja y vuelve a intentar.",
      invalidCredentialsMessage: "El email o la contraseña son incorrectos.",
      passwordMismatchMessage: "Las contraseñas no coinciden.",
      resetPasswordPageTitle: "Configura tu nueva contraseña",
      resetPasswordPageDescription: "Usa una contraseña nueva de al menos 6 caracteres.",
      resetPasswordSuccessMessage: "Contraseña actualizada. Ya puedes iniciar sesión.",
      resetPasswordRedirectingMessage: "Redirigiendo al login",
      resetPasswordInvalidLinkMessage: "Enlace invalido o vencido. Solicita un nuevo email de recuperacion.",
      resetPasswordGenericError: "No pudimos actualizar tu contraseña en este momento. Intentalo de nuevo.",
      resetPasswordInvalidTokenMessage: "El token de recuperacion es invalido o vencido.",
      resetPasswordConfirmCta: "Actualizar contraseña",
      genericError: "Algo salio mal. Intentalo de nuevo.",
      accountLabel: "Cuenta",
      planLabel: "Plan",
      adminPlanLabel: "Admin",
      noPlanLabel: "Sin plan activo",
      profileLabel: "Perfil",
      myPlanLabel: "Mi Plan",
      subscribersLabel: "Subscriptores",
      formLabel: "Formulario",
      cancelSubscriptionLabel: "Desuscribirme",
      cancelSubscriptionLoadingLabel: "Cancelando...",
      cancelSubscriptionErrorLabel: "No pudimos cancelar tu suscripcion en este momento.",
      cancelSubscriptionConfirmTitle: "Confirmar desuscripcion",
      cancelSubscriptionConfirmTextBeforePlan: "Estas seguro de que quieres desuscribirte del plan",
      cancelSubscriptionConfirmTextAfterPlan: "?",
      cancelSubscriptionConfirmCancelLabel: "Cancelar"
    },
    seo: {
      title: "LRP Method | Coaching Fitness Online y Guia de Alimentacion",
      description:
        "Coaching fitness online con planes de entrenamiento, guia de alimentacion y seguimiento mensual. Elige el plan que mejor se adapta a tu objetivo."
    }
  }
};

export function getLandingContent(locale: AppLocale): LandingContent {
  return messages[locale];
}
