"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { MediaAsset } from "./media-asset";

export function AssistantText({
  text,
  cursor,
  renderedUrls,
}: {
  text: string;
  cursor?: boolean;
  renderedUrls?: Set<string>;
}) {
  if (!text && !cursor) return null;

  return (
    <div className="text-sm text-text-primary leading-relaxed">
      {text ? (
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            img: ({ src, alt }) => {
              if (!src || typeof src !== "string") return null;
              if (renderedUrls?.has(src)) return null;
              renderedUrls?.add(src);
              return (
                <MediaAsset
                  asset={{
                    type: "image",
                    url: src,
                    title: typeof alt === "string" ? alt : undefined,
                  }}
                />
              );
            },
            a: ({ href, children }) => (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-text-primary underline hover:text-text-secondary"
              >
                {children}
              </a>
            ),
            p: ({ children }) => (
              <div className="mb-2 last:mb-0 leading-relaxed whitespace-pre-wrap">{children}</div>
            ),
            code: ({ className, children, ...props }) => {
              const isInline = !className && typeof children === "string" && !children.includes("\n");
              if (isInline) {
                return (
                  <code
                    className="rounded bg-surface-tertiary px-1 py-0.5 text-xs font-mono text-text-primary"
                    {...props}
                  >
                    {children}
                  </code>
                );
              }
              return (
                <code
                  className="block overflow-x-auto rounded-10 bg-surface-tertiary p-3 text-xs font-mono text-text-primary my-2"
                  {...props}
                >
                  {children}
                </code>
              );
            },
          }}
        >
          {text}
        </ReactMarkdown>
      ) : null}
      {cursor && <span className="animate-pulse ml-0.5">▍</span>}
    </div>
  );
}
