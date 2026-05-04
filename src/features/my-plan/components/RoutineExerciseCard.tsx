"use client";

import { useMemo, useState } from "react";
import { TbChevronDown, TbChevronUp, TbPlayerPlayFilled } from "react-icons/tb";

type RoutineExerciseCardProps = {
  heading: string;
  primaryMuscleLabel: string;
  primaryMuscleName: string | null;
  summary: string | null;
  description: string | null;
  overview: string | null;
  instructions: string | null;
  tips: string | null;
  notesLabel: string;
  notes: string | null;
  expandLabel: string;
  collapseLabel: string;
  overviewLabel: string;
  instructionsLabel: string;
  tipsLabel: string;
  videoCtaLabel: string;
  openExternalLabel: string;
  videoUrl: string | null;
  sourceUrl?: string | null;
};

function toSentenceCapitalized(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return value;
  }

  const numberedPrefixMatch = trimmed.match(/^(\d+\.\s+)(.+)$/);
  if (numberedPrefixMatch) {
    const [, prefix, text] = numberedPrefixMatch;
    return `${prefix}${text.charAt(0).toUpperCase()}${text.slice(1)}`;
  }

  return `${trimmed.charAt(0).toUpperCase()}${trimmed.slice(1)}`;
}

function getEmbedUrl(rawUrl: string) {
  try {
    const parsed = new URL(rawUrl);

    if (parsed.hostname.includes("youtu.be")) {
      const id = parsed.pathname.replace("/", "");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }

    if (parsed.hostname.includes("youtube.com")) {
      if (parsed.pathname.includes("/shorts/")) {
        const id = parsed.pathname.split("/shorts/")[1]?.split("/")[0];
        return id ? `https://www.youtube.com/embed/${id}` : null;
      }

      if (parsed.pathname === "/watch") {
        const id = parsed.searchParams.get("v");
        return id ? `https://www.youtube.com/embed/${id}` : null;
      }

      if (parsed.pathname.includes("/embed/")) {
        return rawUrl;
      }
    }

    // Only YouTube is embedded in-app. Other providers are opened externally.
  } catch {
    return null;
  }

  return null;
}

function Arrow({ isOpen }: { isOpen: boolean }) {
  return <span className="text-accent">{isOpen ? "▲" : "▼"}</span>;
}

export function RoutineExerciseCard({
  heading,
  primaryMuscleLabel,
  primaryMuscleName,
  summary,
  description,
  overview,
  instructions,
  tips,
  notesLabel,
  notes,
  expandLabel,
  collapseLabel,
  overviewLabel,
  instructionsLabel,
  tipsLabel,
  videoCtaLabel,
  openExternalLabel,
  videoUrl,
  sourceUrl
}: RoutineExerciseCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isOverviewExpanded, setIsOverviewExpanded] = useState(Boolean(overview?.trim()));
  const [isInstructionsExpanded, setIsInstructionsExpanded] = useState(!Boolean(overview?.trim()) && Boolean(instructions?.trim()));
  const [isTipsExpanded, setIsTipsExpanded] = useState(
    !Boolean(overview?.trim()) && !Boolean(instructions?.trim()) && Boolean(tips?.trim())
  );
  const hasOverview = Boolean(overview?.trim());
  const hasInstructions = Boolean(instructions?.trim());
  const hasTips = Boolean(tips?.trim());
  const embedUrl = useMemo(() => (videoUrl ? getEmbedUrl(videoUrl) : null), [videoUrl]);
  const externalVideoUrl = sourceUrl ?? videoUrl;
  const hasExpandedContent = hasOverview || hasInstructions || hasTips || Boolean(embedUrl) || Boolean(externalVideoUrl);

  return (
    <article className="card cursor-pointer" onClick={() => setIsExpanded((current) => !current)}>
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-accent text-sm font-semibold">{toSentenceCapitalized(heading)}</h3>
        {hasExpandedContent ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setIsExpanded((current) => !current);
            }}
            aria-label={isExpanded ? collapseLabel : expandLabel}
            className="text-accent hover:text-accent-hover mt-0.5 shrink-0 cursor-pointer rounded-md p-1 transition-colors"
          >
            {isExpanded ? <TbChevronUp className="h-5 w-5" /> : <TbChevronDown className="h-5 w-5" />}
          </button>
        ) : null}
      </div>
      {primaryMuscleName ? (
        <p className="text-muted mt-1 text-xs">
          {primaryMuscleLabel}: <span className="text-primary">{primaryMuscleName}</span>
        </p>
      ) : null}

      {summary ? <p className="text-primary mt-2 text-sm font-medium">{summary}</p> : null}

      {hasExpandedContent ? (
        <div className="mt-2">
          <div
            className={`grid transition-all duration-500 ease-in-out ${isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
          >
            <div className="overflow-hidden">
              {hasOverview ? (
                <div>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setIsOverviewExpanded((current) => !current);
                    }}
                    className="text-primary hover:text-primary inline-flex items-center gap-1 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    {overviewLabel}
                    <Arrow isOpen={isOverviewExpanded} />
                  </button>
                  <div className={`grid transition-all duration-500 ease-in-out ${isOverviewExpanded ? "mt-1 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                    <div className="overflow-hidden">
                      <p className="text-muted text-sm">{overview}</p>
                    </div>
                  </div>
                </div>
              ) : null}

              {hasInstructions ? (
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setIsInstructionsExpanded((current) => !current);
                    }}
                    className="text-primary hover:text-primary inline-flex items-center gap-1 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    {instructionsLabel}
                    <Arrow isOpen={isInstructionsExpanded} />
                  </button>
                  <div
                    className={`grid transition-all duration-500 ease-in-out ${isInstructionsExpanded ? "mt-1 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
                  >
                    <div className="overflow-hidden">
                      <p className="text-muted text-sm">{instructions}</p>
                    </div>
                  </div>
                </div>
              ) : null}

              {hasTips ? (
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setIsTipsExpanded((current) => !current);
                    }}
                    className="text-primary hover:text-primary inline-flex items-center gap-1 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    {tipsLabel}
                    <Arrow isOpen={isTipsExpanded} />
                  </button>
                  <div className={`grid transition-all duration-500 ease-in-out ${isTipsExpanded ? "mt-1 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                    <div className="overflow-hidden">
                      <p className="text-muted text-sm">{tips}</p>
                    </div>
                  </div>
                </div>
              ) : null}

              {embedUrl ? (
                <div className="border-subtle bg-canvas mt-3 overflow-hidden rounded-xl border" onClick={(event) => event.stopPropagation()}>
                  <div className="relative w-full pt-[56.25%]">
                    <iframe
                      src={embedUrl}
                      title={heading}
                      className="absolute inset-0 h-full w-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="strict-origin-when-cross-origin"
                    />
                  </div>
                </div>
              ) : 
              externalVideoUrl ? (
                <a
                  href={externalVideoUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="group mt-3 block"
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="border-subtle bg-canvas hover:border-accent/70 hover:bg-canvas-soft hover:shadow-accent/20 rounded-xl border p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
                    <div className="flex items-center gap-3">
                      <span className="bg-accent text-canvas group-hover:bg-accent-hover inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors">
                        <TbPlayerPlayFilled className="h-5 w-5" />
                      </span>

                      <div className="min-w-0">
                        <p className="text-accent group-hover:text-accent-hover text-sm font-semibold transition-colors">{videoCtaLabel}</p>
                        <p className="text-muted text-xs">{openExternalLabel}</p>
                      </div>
                    </div>
                  </div>
                </a>
              ) : null
              }
            </div>
          </div>
        </div>
      ) : null}

      {notes ? (
        <p className="text-muted mt-2 text-sm">
          <span className="text-primary font-medium">{notesLabel}:</span> {notes}
        </p>
      ) : null}

    </article>
  );
}
