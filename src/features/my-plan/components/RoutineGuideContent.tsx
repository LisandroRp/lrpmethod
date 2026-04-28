type RoutineGuideContentProps = {
  content: string;
};

type RoutineGuideBlock =
  | { type: "heading"; content: string }
  | { type: "paragraph"; content: string }
  | { type: "unordered-list"; items: string[] }
  | { type: "ordered-list"; items: string[] };

function parseGuideBlocks(content: string): RoutineGuideBlock[] {
  const lines = content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const blocks: RoutineGuideBlock[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];

    if (line.startsWith("## ")) {
      blocks.push({ type: "heading", content: line.replace(/^##\s+/, "") });
      index += 1;
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      const items: string[] = [];
      let pointer = index;
      while (pointer < lines.length && /^[-*]\s+/.test(lines[pointer])) {
        items.push(lines[pointer].replace(/^[-*]\s+/, ""));
        pointer += 1;
      }

      blocks.push({ type: "unordered-list", items });
      index = pointer;
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      let pointer = index;
      while (pointer < lines.length && /^\d+\.\s+/.test(lines[pointer])) {
        items.push(lines[pointer].replace(/^\d+\.\s+/, ""));
        pointer += 1;
      }

      blocks.push({ type: "ordered-list", items });
      index = pointer;
      continue;
    }

    blocks.push({ type: "paragraph", content: line });
    index += 1;
  }

  return blocks;
}

export function RoutineGuideContent({ content }: RoutineGuideContentProps) {
  const blocks = parseGuideBlocks(content);

  if (!blocks.length) {
    return null;
  }

  return (
    <div className="space-y-3">
      {blocks.map((block, blockIndex) => {
        if (block.type === "heading") {
          return (
            <h3 key={`heading-${blockIndex}-${block.content}`} className="text-accent text-base font-semibold sm:text-lg">
              {block.content}
            </h3>
          );
        }

        if (block.type === "unordered-list") {
          return (
            <ul key={`unordered-${blockIndex}`} className="text-muted list-disc space-y-1 pl-5 text-sm sm:text-base">
              {block.items.map((item, itemIndex) => (
                <li key={`unordered-item-${blockIndex}-${itemIndex}`}>{item}</li>
              ))}
            </ul>
          );
        }

        if (block.type === "ordered-list") {
          return (
            <ol key={`ordered-${blockIndex}`} className="text-muted list-decimal space-y-1 pl-5 text-sm sm:text-base">
              {block.items.map((item, itemIndex) => (
                <li key={`ordered-item-${blockIndex}-${itemIndex}`}>{item}</li>
              ))}
            </ol>
          );
        }

        return (
          <p key={`paragraph-${blockIndex}-${block.content}`} className="text-muted text-sm leading-relaxed sm:text-base">
            {block.content}
          </p>
        );
      })}
    </div>
  );
}
