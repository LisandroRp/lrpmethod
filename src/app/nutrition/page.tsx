import Link from "next/link";
import { redirect } from "next/navigation";
import { TbBook2, TbChevronDown, TbDownload, TbFileText, TbLock, TbSalad } from "react-icons/tb";

import { LandingHeader } from "@/features/landing/components/LandingHeader";
import { getLandingContent } from "@/features/landing/i18n/messages";
import { AppLocale } from "@/features/landing/i18n/types";
import { NutritionPdfSelector } from "@/features/nutrition/components/NutritionPdfSelector";
import { getRequestLocale } from "@/lib/i18n/get-request-locale";
import { listNutritionResourcesByUserId, type NutritionResource } from "@/lib/server/nutrition-admin";
import { findCurrentActiveSubscriptionByUserId, isUserAdmin } from "@/lib/server/supabase-admin";
import { getCurrentAuthenticatedUser } from "@/lib/server/supabase-auth";

type PlanCode = "basic" | "intermediate" | "premium";

type NutritionPdfResource = {
  id: string;
  title: string;
  uploadedAtLabel: string;
  publishedAt: string;
  href: string;
  minimumPlanRank: 1 | 2 | 3;
};

type NutritionCopy = {
  pageTitle: string;
  pageDescription: string;
  lockedTitle: string;
  lockedDescription: string;
  lockedCtaLabel: string;
  basicsKicker: string;
  basicsTitle: string;
  basicsDescription: string;
  examplesLabel: string;
  guideItems: Array<{
    title: string;
    description: string;
    details: string;
    examples: string[];
  }>;
  pdfTitle: string;
  pdfDescription: string;
  pdfLockedTitle: string;
  pdfLockedDescription: string;
  pdfEmptyTitle: string;
  pdfEmptyDescription: string;
  pdfSelectPlaceholder: string;
  pdfDownloadLabel: string;
  premiumTitle: string;
  premiumDescription: string;
};

function getNutritionCopy(locale: AppLocale): NutritionCopy {
  if (locale === "es") {
    return {
      pageTitle: "Alimentacion",
      pageDescription: "Guias simples para acompanar tu entrenamiento sin complicarte de mas.",
      lockedTitle: "Necesitas un plan activo",
      lockedDescription: "La seccion de alimentacion se habilita cuando tenes una suscripcion activa.",
      lockedCtaLabel: "Ver planes",
      basicsKicker: "Guia general",
      basicsTitle: "Tips nutricionales basicos",
      basicsDescription:
        "Estas recomendaciones son generales y no reemplazan una consulta medica o nutricional profesional.",
      examplesLabel: "Ejemplos",
      guideItems: [
        {
          title: "Arma platos completos",
          description: "Usa una estructura simple para que cada comida tenga mejor calidad nutricional.",
          details:
            "Como regla general, pensa el plato en bloques: una fuente de proteina, una porcion de carbohidratos, verduras o frutas, y una porcion moderada de grasas. No hace falta pesar todo para empezar; primero conviene ordenar la calidad y la frecuencia de tus comidas.",
          examples: [
            "Almuerzo: pollo, arroz o papa, ensalada grande y aceite de oliva.",
            "Cena: huevos o carne magra, verduras salteadas y una porcion chica de palta o frutos secos.",
            "Opcion rapida: yogur natural, fruta, avena y un punado chico de nueces."
          ]
        },
        {
          title: "Prioriza constancia antes que perfeccion",
          description: "La dieta que podes sostener suele ganar frente a reglas extremas.",
          details:
            "Evita cambiar todo junto de un dia para el otro. Elegi dos o tres habitos base y sostenelos durante la semana: horarios relativamente estables, proteina en comidas principales y menos picoteo sin hambre. Cuando eso ya sale facil, recien ahi ajusta cantidades o detalles.",
          examples: [
            "Preparar dos comidas base para tener resuelto el dia siguiente.",
            "Mantener una merienda planificada si llegas con mucha hambre a la cena.",
            "Dejar comidas libres como parte del plan, no como una falla."
          ]
        },
        {
          title: "Hidratate durante el dia",
          description: "La hidratacion impacta en energia, rendimiento y recuperacion.",
          details:
            "No hace falta obsesionarse con litros exactos, pero si tener una referencia. Si entrenas, transpiras mucho o hace calor, probablemente necesites mas agua y algo de sal/electrolitos. La sed, el color de la orina y el dolor de cabeza frecuente pueden darte pistas.",
          examples: [
            "Arrancar el dia con un vaso grande de agua.",
            "Llevar botella al entrenamiento y tomar antes de tener mucha sed.",
            "Sumar agua en comidas principales si durante el dia te olvidas."
          ]
        },
        {
          title: "Cuida la proteina",
          description: "La proteina ayuda a recuperarte y sostener masa muscular.",
          details:
            "Una buena idea practica es que cada comida principal tenga una fuente clara de proteina. No tiene que ser siempre carne: tambien pueden ser huevos, lacteos, legumbres, tofu o combinaciones. Para objetivos de fuerza o recomposicion corporal, este punto suele marcar diferencia.",
          examples: [
            "Desayuno: yogur griego, huevos o queso magro.",
            "Almuerzo/cena: carne, pollo, pescado, huevos, tofu o legumbres.",
            "Snack: yogur, licuado proteico o sandwich simple con buena fuente proteica."
          ]
        },
        {
          title: "Ordena el entorno",
          description: "Lo que tenes a mano influye mucho en lo que terminas comiendo.",
          details:
            "No se trata de prohibir alimentos, sino de hacer mas facil la decision que queres repetir. Si tenes opciones utiles visibles y listas, dependes menos de la fuerza de voluntad cuando estas cansado o apurado.",
          examples: [
            "Tener fruta lavada, yogur o huevos listos para resolver snacks.",
            "Guardar snacks muy tentadores fuera de vista si te cuesta regularlos.",
            "Comprar proteinas y verduras con anticipacion para dos o tres dias."
          ]
        },
        {
          title: "Ajusta segun objetivo",
          description: "No come igual alguien que quiere bajar grasa que alguien que quiere rendir mas.",
          details:
            "La calidad de alimentos importa, pero el contexto tambien. Si buscas bajar grasa, conviene controlar porciones y saciedad. Si buscas ganar fuerza o masa muscular, puede hacer falta comer un poco mas y cuidar carbohidratos alrededor del entrenamiento.",
          examples: [
            "Bajar grasa: mas verduras, proteina alta y porciones medidas de carbohidratos.",
            "Rendimiento: incluir carbohidratos antes o despues de entrenar.",
            "Masa muscular: evitar saltear comidas si eso te deja corto de energia."
          ]
        }
      ],
      pdfTitle: "Planes de alimentacion",
      pdfDescription: "Historial de PDFs subidos. Abri el que corresponda segun la fecha de carga.",
      pdfLockedTitle: "Disponible desde Intermedio",
      pdfLockedDescription: "Los planes de alimentacion descargables se habilitan para planes Intermedio y Premium.",
      pdfEmptyTitle: "Todavia no hay PDFs cargados",
      pdfEmptyDescription: "La biblioteca esta lista para mostrar varias guias a medida que se vayan actualizando.",
      pdfSelectPlaceholder: "Selecciona un plan de alimentacion",
      pdfDownloadLabel: "Descargar PDF",
      premiumTitle: "Contenido Premium",
      premiumDescription: "El plan Premium puede incluir guias mas especificas por objetivo, contexto y preferencias."
    };
  }

  return {
    pageTitle: "Nutrition",
    pageDescription: "Simple guidance to support your training without overcomplicating the process.",
    lockedTitle: "You need an active plan",
    lockedDescription: "The nutrition section unlocks when you have an active subscription.",
    lockedCtaLabel: "View plans",
    basicsKicker: "General guide",
    basicsTitle: "Basic nutrition tips",
    basicsDescription:
      "These recommendations are general and do not replace medical or licensed nutrition support.",
    examplesLabel: "Examples",
    guideItems: [
      {
        title: "Build complete plates",
        description: "Use a simple structure so each meal has better nutritional quality.",
        details:
          "As a general rule, think of the plate in blocks: protein, carbohydrates, vegetables or fruit, and a moderate portion of fats. You do not need to weigh everything to start; first improve quality and consistency.",
        examples: [
          "Lunch: chicken, rice or potatoes, a large salad, and olive oil.",
          "Dinner: eggs or lean meat, sauteed vegetables, and a small portion of avocado or nuts.",
          "Quick option: plain yogurt, fruit, oats, and a small handful of nuts."
        ]
      },
      {
        title: "Prioritize consistency over perfection",
        description: "The diet you can sustain usually beats extreme rules.",
        details:
          "Avoid changing everything overnight. Choose two or three base habits and keep them through the week: relatively stable meal times, protein in main meals, and less grazing when you are not hungry.",
        examples: [
          "Prep two simple base meals for the next day.",
          "Plan a snack if you usually arrive very hungry to dinner.",
          "Keep flexible meals as part of the plan, not as a failure."
        ]
      },
      {
        title: "Stay hydrated",
        description: "Hydration affects energy, performance, and recovery.",
        details:
          "You do not need to obsess over exact liters, but you should have a reference. If you train, sweat a lot, or it is hot, you may need more water and some salt or electrolytes.",
        examples: [
          "Start the day with a large glass of water.",
          "Bring a bottle to training and drink before you feel very thirsty.",
          "Add water to main meals if you forget during the day."
        ]
      },
      {
        title: "Keep protein in mind",
        description: "Protein supports recovery and muscle retention.",
        details:
          "A practical idea is to include a clear protein source in every main meal. It does not always need to be meat: eggs, dairy, legumes, tofu, and combinations can work too.",
        examples: [
          "Breakfast: Greek yogurt, eggs, or lean cheese.",
          "Lunch/dinner: meat, chicken, fish, eggs, tofu, or legumes.",
          "Snack: yogurt, a protein shake, or a simple sandwich with protein."
        ]
      },
      {
        title: "Shape your environment",
        description: "What is available around you strongly affects what you eat.",
        details:
          "This is not about banning foods. It is about making the choice you want to repeat easier. Useful options that are visible and ready reduce reliance on willpower when you are tired or busy.",
        examples: [
          "Keep washed fruit, yogurt, or eggs ready for snacks.",
          "Keep highly tempting snacks out of sight if they are hard to regulate.",
          "Buy protein and vegetables ahead for two or three days."
        ]
      },
      {
        title: "Adjust to your goal",
        description: "Fat loss, performance, and muscle gain need different food strategies.",
        details:
          "Food quality matters, but context matters too. For fat loss, portions and satiety matter. For strength or muscle gain, eating enough and placing carbs around training can help.",
        examples: [
          "Fat loss: more vegetables, high protein, and measured carb portions.",
          "Performance: include carbs before or after training.",
          "Muscle gain: avoid skipping meals if it leaves you low on energy."
        ]
      }
    ],
    pdfTitle: "Nutrition plans",
    pdfDescription: "Uploaded PDF history. Open the one that matches the upload date.",
    pdfLockedTitle: "Available from Intermediate",
    pdfLockedDescription: "Downloadable nutrition plans are available for Intermediate and Premium plans.",
    pdfEmptyTitle: "No PDFs uploaded yet",
    pdfEmptyDescription: "The library is ready to show multiple guides as they are updated over time.",
    pdfSelectPlaceholder: "Select a nutrition plan",
    pdfDownloadLabel: "Download PDF",
    premiumTitle: "Premium content",
    premiumDescription: "Premium can include more specific guides by goal, context, and preferences."
  };
}

function listNutritionPdfResources(resources: NutritionResource[], locale: AppLocale): NutritionPdfResource[] {
  return resources.map((resource) => ({
    id: resource.id,
    title: resource.title,
    uploadedAtLabel: new Date(resource.createdAt).toLocaleDateString(locale === "es" ? "es-AR" : "en-US"),
    publishedAt: resource.createdAt,
    href: `/api/nutrition/resources/${resource.id}/download`,
    minimumPlanRank: resource.minimumPlanCode === "premium" ? 3 : 2
  }));
}

function getPlanRank(planCode: PlanCode | null) {
  if (planCode === "premium") {
    return 3;
  }

  if (planCode === "intermediate") {
    return 2;
  }

  if (planCode === "basic") {
    return 1;
  }

  return 0;
}

export default async function NutritionPage() {
  const locale = await getRequestLocale();
  const content = getLandingContent(locale);
  const copy = getNutritionCopy(locale);
  const user = await getCurrentAuthenticatedUser();

  if (!user) {
    redirect("/?auth=1");
  }

  const [subscription, admin, nutritionResources] = await Promise.all([
    findCurrentActiveSubscriptionByUserId(user.id),
    isUserAdmin(user.id),
    listNutritionResourcesByUserId(user.id).catch(() => [])
  ]);
  const activePlanCode = subscription?.plan_code ?? null;
  const planRank = admin ? 3 : getPlanRank(activePlanCode);
  const hasActivePlan = planRank > 0;
  const canAccessPdfPlans = planRank >= 2;
  const canAccessPremium = planRank >= 3;
  const nutritionPdfResources = listNutritionPdfResources(nutritionResources, locale)
    .filter((resource) => planRank >= resource.minimumPlanRank)
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  return (
    <div className="bg-canvas text-primary min-h-screen">
      <LandingHeader content={content} showSectionLinks={false} />

      <main className="px-4 py-8 sm:px-6 sm:py-10">
        <div className="mx-auto w-full max-w-6xl">
          <header className="mb-6">
            <p className="section-kicker">{copy.basicsKicker}</p>
            <h1 className="text-2xl font-semibold sm:text-3xl">{copy.pageTitle}</h1>
            <p className="text-muted mt-2 max-w-3xl text-sm sm:text-base">{copy.pageDescription}</p>
          </header>

          {!hasActivePlan ? (
            <section className="panel overflow-hidden p-0">
              <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_18rem]">
                <div className="p-6 sm:p-8">
                  <span className="bg-canvas border-subtle inline-flex h-12 w-12 items-center justify-center rounded-full border text-accent">
                    <TbLock className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <h2 className="mt-4 text-xl font-semibold">{copy.lockedTitle}</h2>
                  <p className="text-muted mt-2 max-w-xl text-sm sm:text-base">{copy.lockedDescription}</p>
                  <Link href="/#plans" className="btn-primary mt-6 inline-flex">
                    {copy.lockedCtaLabel}
                  </Link>
                </div>
                <div className="bg-canvas border-subtle flex min-h-56 items-center justify-center border-t p-6 lg:border-t-0 lg:border-l">
                  <TbSalad className="h-24 w-24 text-accent" aria-hidden="true" />
                </div>
              </div>
            </section>
          ) : (
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(20rem,0.9fr)]">
              <section className="panel border-accent/30 p-5 sm:p-6">
                <div className="flex items-start gap-3">
                  <span className="bg-canvas border-subtle mt-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-accent">
                    <TbBook2 className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <h2 className="text-accent text-lg font-semibold">{copy.basicsTitle}</h2>
                    <p className="text-muted mt-1 text-sm">{copy.basicsDescription}</p>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  {copy.guideItems.map((item) => (
                    <details key={item.title} className="group bg-canvas border-subtle rounded-xl border p-4">
                      <summary className="flex cursor-pointer list-none items-start justify-between gap-4">
                        <span>
                          <span className="block text-sm font-semibold">{item.title}</span>
                          <span className="text-muted mt-1 block text-sm leading-relaxed">{item.description}</span>
                        </span>
                        <TbChevronDown className="text-accent mt-0.5 h-5 w-5 shrink-0 transition-transform group-open:rotate-180" aria-hidden="true" />
                      </summary>
                      <div className="border-subtle mt-4 border-t pt-4">
                        <p className="text-muted text-sm leading-relaxed">{item.details}</p>
                        <div className="mt-4">
                          <p className="text-accent text-xs font-semibold uppercase tracking-[0.12em]">{copy.examplesLabel}</p>
                          <ul className="mt-2 space-y-2">
                            {item.examples.map((example) => (
                              <li key={example} className="text-muted flex gap-2 text-sm leading-relaxed">
                                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--color-accent)]" aria-hidden="true" />
                                <span>{example}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </details>
                  ))}
                </div>
              </section>

              <aside className="space-y-5">
                <section className="panel border-accent/30 p-5 sm:p-6">
                  <div className="flex items-start gap-3">
                    <span className="bg-canvas border-subtle mt-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-accent">
                      {canAccessPdfPlans ? <TbDownload className="h-5 w-5" aria-hidden="true" /> : <TbLock className="h-5 w-5" aria-hidden="true" />}
                    </span>
                    <div>
                      <h2 className="text-accent text-lg font-semibold">{copy.pdfTitle}</h2>
                      <p className="text-muted mt-1 text-sm">{copy.pdfDescription}</p>
                    </div>
                  </div>

                  <div className="bg-canvas border-subtle mt-5 rounded-xl border p-4">
                    {canAccessPdfPlans ? (
                      nutritionPdfResources.length ? (
                        <NutritionPdfSelector downloadLabel={copy.pdfDownloadLabel} options={nutritionPdfResources} placeholder={copy.pdfSelectPlaceholder} />
                      ) : (
                        <>
                          <TbFileText className="h-7 w-7 text-accent" aria-hidden="true" />
                          <h3 className="mt-3 text-sm font-semibold">{copy.pdfEmptyTitle}</h3>
                          <p className="text-muted mt-2 text-sm">{copy.pdfEmptyDescription}</p>
                        </>
                      )
                    ) : (
                      <>
                        <h3 className="text-sm font-semibold">{copy.pdfLockedTitle}</h3>
                        <p className="text-muted mt-2 text-sm">{copy.pdfLockedDescription}</p>
                        <Link href="/#plans" className="btn-secondary mt-4 inline-flex">
                          {copy.lockedCtaLabel}
                        </Link>
                      </>
                    )}
                  </div>
                </section>

                <section className={`panel p-5 sm:p-6 ${canAccessPremium ? "border-accent/30" : "opacity-75"}`}>
                  <h2 className="text-accent text-lg font-semibold">{copy.premiumTitle}</h2>
                  <p className="text-muted mt-2 text-sm">{copy.premiumDescription}</p>
                </section>
              </aside>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
