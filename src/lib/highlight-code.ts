export type CodeToken = { text: string; type: "default" | "string" | "comment" };

const STRING_OR_TEMPLATE = /'[^']*'|"[^"]*"|`[^`]*`/g;

// A small, line-based highlighter for the canned sample code we generate ourselves
// (not arbitrary input), so a naive "is this a comment line / is this a string" pass is enough.
export function highlightLine(line: string): CodeToken[] {
  const trimmed = line.trimStart();
  if (trimmed.startsWith("#") || trimmed.startsWith("//")) {
    return [{ text: line, type: "comment" }];
  }

  const tokens: CodeToken[] = [];
  let lastIndex = 0;
  for (const match of line.matchAll(STRING_OR_TEMPLATE)) {
    if (match.index! > lastIndex) tokens.push({ text: line.slice(lastIndex, match.index), type: "default" });
    tokens.push({ text: match[0], type: "string" });
    lastIndex = match.index! + match[0].length;
  }
  if (lastIndex < line.length) tokens.push({ text: line.slice(lastIndex), type: "default" });
  return tokens.length ? tokens : [{ text: line, type: "default" }];
}
