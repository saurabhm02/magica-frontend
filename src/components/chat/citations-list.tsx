import type { ContentBlock } from "@/contracts/content-blocks";

type Citation = Extract<ContentBlock, { type: "citations" }>["citations"][number];

export function CitationsList({ citations }: { citations: Citation[] }) {
  if (citations.length === 0) return null;

  return (
    <div className="flex flex-col gap-1 text-xs text-text-tertiary">
      <span className="font-medium text-text-secondary">Sources</span>
      <ul className="flex flex-col gap-0.5">
        {citations.map((citation, i) => (
          <li key={i}>
            <a
              href={citation.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-secondary underline hover:text-text-primary"
            >
              {citation.title || new URL(citation.url).hostname}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
