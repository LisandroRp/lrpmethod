import { onboardingDisplaySections, formatOnboardingAnswerValue } from "@/features/onboarding/answerLabels";
import { OnboardingAnswersInput } from "@/features/onboarding/schema";

type AdminOnboardingAnswersProps = {
  answers: OnboardingAnswersInput;
};

export function AdminOnboardingAnswers({ answers }: AdminOnboardingAnswersProps) {
  return (
    <div className="space-y-6">
      {onboardingDisplaySections.map((section) => (
        <section key={section.title} className="panel p-5">
          <h2 className="text-accent text-lg font-semibold">{section.title}</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {section.fields.map((field) => (
              <div key={field.key} className="border-subtle rounded-xl border p-4">
                <p className="text-muted text-xs font-medium tracking-[0.2em] uppercase">{field.label}</p>
                <p className="text-primary mt-2 text-sm leading-relaxed whitespace-pre-wrap">
                  {formatOnboardingAnswerValue(field.key, answers[field.key])}
                </p>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
