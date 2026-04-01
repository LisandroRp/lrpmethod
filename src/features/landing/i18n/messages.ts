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
      faq: "FAQ"
    },
    hero: {
      title: "Simple coaching that helps you stay consistent",
      description:
        "Personalized training plans and practical nutrition guidance through monthly subscriptions.",
      primaryAction: {
        label: "Start on Instagram",
        href: "#final-cta"
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
      plans: [
        {
          name: "Basic",
          price: "$29.900",
          period: "/month",
          description: "Ideal to get started.",
          features: [
            "Personalized workout routine",
            "1 adjustment per month",
            "Basic WhatsApp follow-up"
          ],
          ctaLabel: "Choose Basic",
          highlighted: false
        },
        {
          name: "Intermediate",
          price: "$44.900",
          period: "/month",
          description: "Best value for steady progress.",
          features: [
            "Personalized workout routine",
            "Meal plan or nutrition guide",
            "2 adjustments per month",
            "WhatsApp follow-up"
          ],
          ctaLabel: "Choose Intermediate",
          highlighted: true
        },
        {
          name: "Premium",
          price: "$64.900",
          period: "/month",
          description: "Complete support.",
          features: [
            "Personalized workout routine",
            "Nutrition guide",
            "Weekly adjustments",
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
        href: "https://instagram.com/"
      }
    },
    footer: {
      disclaimer:
        "This service provides personalized training and general nutrition guidance only. It does not replace medical advice, diagnosis, treatment, or licensed nutrition counseling.",
      rights: "All rights reserved."
    },
    seo: {
      title: "LRP Method | Online Fitness Coaching",
      description: "Simple MVP landing page for online fitness coaching subscriptions."
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
      faq: "FAQ"
    },
    hero: {
      title: "Coaching simple para ayudarte a ser constante",
      description:
        "Planes de entrenamiento personalizados y guia nutricional practica por suscripcion mensual.",
      primaryAction: {
        label: "Empezar por Instagram",
        href: "#final-cta"
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
            "Despues de suscribirte, compartes medidas, fotos, objetivos, disponibilidad, experiencia y limitaciones."
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
      plans: [
        {
          name: "Basico",
          price: "$29.900",
          period: "/mes",
          description: "Ideal para empezar.",
          features: [
            "Rutina personalizada",
            "1 ajuste por mes",
            "Seguimiento basico por WhatsApp"
          ],
          ctaLabel: "Elegir Basico",
          highlighted: false
        },
        {
          name: "Intermedio",
          price: "$44.900",
          period: "/mes",
          description: "La mejor relacion precio-resultado.",
          features: [
            "Rutina personalizada",
            "Plan de comidas o guia de alimentacion",
            "2 ajustes mensuales",
            "Seguimiento por WhatsApp"
          ],
          ctaLabel: "Elegir Intermedio",
          highlighted: true
        },
        {
          name: "Premium",
          price: "$64.900",
          period: "/mes",
          description: "Acompanamiento completo.",
          features: [
            "Rutina personalizada",
            "Guia de alimentacion",
            "Ajustes semanales",
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
        href: "https://instagram.com/"
      }
    },
    footer: {
      disclaimer:
        "Este servicio brinda entrenamiento personalizado y guia nutricional general. No reemplaza consejo medico, diagnostico, tratamiento ni asesoramiento nutricional licenciado.",
      rights: "Todos los derechos reservados."
    },
    seo: {
      title: "LRP Method | Coaching Fitness Online",
      description: "Landing MVP simple para validar un servicio de coaching fitness online por suscripcion."
    }
  }
};

export function getLandingContent(locale: AppLocale): LandingContent {
  return messages[locale];
}
