"use client";

import { useMemo, useRef, useState } from "react";
import { TbChevronDown, TbChevronUp } from "react-icons/tb";

import { RoutineGuideContent } from "@/features/my-plan/components/RoutineGuideContent";

type RoutineGuidePanelProps = {
  content: string;
  expandLabel: string;
  collapseLabel: string;
};

export function RoutineGuidePanel({ content, expandLabel, collapseLabel }: RoutineGuidePanelProps) {
  const animationMs = 500;
  const collapsedHeight = 160;
  const contentRef = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animatedHeight, setAnimatedHeight] = useState<number | null>(160);
  const isCollapsible = useMemo(() => {
    const lineCount = content.split("\n").filter((line) => line.trim().length > 0).length;
    return lineCount > 8 || content.length > 340;
  }, [content]);

  const toggleExpanded = () => {
    if (!isCollapsible) {
      return;
    }

    const contentHeight = contentRef.current?.scrollHeight ?? collapsedHeight;
    setIsAnimating(true);

    if (isExpanded) {
      setAnimatedHeight(contentHeight);
      requestAnimationFrame(() => {
        setIsExpanded(false);
        setAnimatedHeight(collapsedHeight);
      });
      return;
    }

    setAnimatedHeight(collapsedHeight);
    requestAnimationFrame(() => {
      setIsExpanded(true);
      setAnimatedHeight(contentHeight);
    });
  };

  const handleTransitionEnd = () => {
    if (!isAnimating) {
      return;
    }

    setIsAnimating(false);
    if (isExpanded) {
      setAnimatedHeight(null);
    } else {
      setAnimatedHeight(collapsedHeight);
    }
  };

  return (
    <div>
      <div
        className="relative print:h-auto print:overflow-visible"
        onTransitionEnd={handleTransitionEnd}
        style={{
          height: !isCollapsible || animatedHeight === null ? "auto" : `${animatedHeight}px`,
          overflow: isCollapsible ? "hidden" : "visible",
          transition: `height ${animationMs}ms ease-in-out`
        }}
      >
        <div ref={contentRef}>
          <RoutineGuideContent content={content} />
        </div>
        {isCollapsible ? (
          <div
            className="routine-guide-overlay pointer-events-none absolute inset-x-0 bottom-0 h-14 sm:h-16 print:hidden"
            style={{
              opacity: isExpanded ? 0 : 1,
              transition: `opacity ${animationMs}ms ease-in-out`
            }}
          />
        ) : null}
      </div>

      {isCollapsible ? (
        <button
          type="button"
          className="text-accent routine-print-action mt-3 inline-flex cursor-pointer items-center gap-1.5 text-sm font-medium transition-colors hover:text-accent-hover hover:underline hover:decoration-2 hover:underline-offset-4"
          onClick={toggleExpanded}
        >
          {isExpanded ? <TbChevronDown className="h-4 w-4 shrink-0" aria-hidden="true" /> : <TbChevronUp className="h-4 w-4 shrink-0" aria-hidden="true" />}
          {isExpanded ? collapseLabel : expandLabel}
        </button>
      ) : null}
    </div>
  );
}
