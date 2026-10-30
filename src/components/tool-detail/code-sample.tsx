"use client";

import { Check, ChevronDown, Copy } from "lucide-react";
import { useRef, useState } from "react";
import { API_LANGUAGES, type ApiLanguage } from "@/lib/api-sample-code";
import { highlightLine } from "@/lib/highlight-code";
import { useClickOutside } from "@/lib/use-click-outside";

const TOKEN_CLASS = {
  default: "text-text-primary",
  string: "text-success",
  comment: "italic text-text-tertiary",
};

export function CodeSample({
  language,
  onLanguageChange,
  code,
}: {
  language: ApiLanguage;
  onLanguageChange: (language: ApiLanguage) => void;
  code: string;
}) {
  const [copied, setCopied] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useClickOutside(menuRef, menuOpen, () => setMenuOpen(false));

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = code.replace(/\n$/, "").split("\n");

  return (
    <div className="flex h-full min-h-0 flex-col rounded-16 border border-border-secondary bg-surface-primary">
      <div className="flex items-center justify-between gap-3 border-b border-border-secondary p-3">
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setMenuOpen(false);
            }}
            className="flex items-center gap-1.5 rounded-8 bg-surface-tertiary px-3 py-1.5 text-sm text-text-primary hover:bg-surface-hover"
          >
            {language}
            <ChevronDown className="size-3.5" />
          </button>
          {menuOpen && (
            <div
              role="menu"
              className="absolute top-full left-0 z-10 mt-1 min-w-[140px] rounded-10 border border-border-secondary bg-surface-secondary p-1 shadow-lg"
            >
              {API_LANGUAGES.map((lang) => (
                <button
                  key={lang}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    onLanguageChange(lang);
                    setMenuOpen(false);
                  }}
                  className="block w-full rounded-8 px-2.5 py-1.5 text-left text-sm text-text-primary hover:bg-surface-hover"
                >
                  {lang}
                </button>
              ))}
            </div>
          )}
        </div>
        <button type="button" onClick={handleCopy} className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary">
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      <pre className="min-h-0 flex-1 overflow-auto p-4 font-mono text-xs leading-5">
        <code>
          {lines.map((line, i) => (
            <div key={i} className="flex">
              <span className="w-8 shrink-0 pr-4 text-right text-text-tertiary select-none">{i + 1}</span>
              <span className="whitespace-pre">
                {highlightLine(line).map((token, j) => (
                  <span key={j} className={TOKEN_CLASS[token.type]}>
                    {token.text}
                  </span>
                ))}
              </span>
            </div>
          ))}
        </code>
      </pre>
    </div>
  );
}
