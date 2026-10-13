import { formatOnboardingAnswerValue, onboardingDisplaySections } from "@/features/onboarding/answerLabels";
import type { OnboardingAnswersInput } from "@/features/onboarding/schema";

export function getPromptFilename(kind: "routine" | "nutrition", answers: OnboardingAnswersInput) {
  const name = answers.fullName
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80) || "alumno";

  return `lrp-${kind}-prompt-${name}.md`;
}

export function buildPromptAnswerSections(
  answers: OnboardingAnswersInput,
  includedFields?: ReadonlySet<keyof OnboardingAnswersInput>
) {
  return onboardingDisplaySections
    .map((section) => {
      const rows = section.fields
        .filter((field) => !includedFields || includedFields.has(field.key))
        .map((field) => `- **${field.label}:** ${formatOnboardingAnswerValue(field.key, answers[field.key])}`);

      return rows.length ? `## ${section.title}\n${rows.join("\n")}` : null;
    })
    .filter((section): section is string => section !== null)
    .join("\n\n");
}
