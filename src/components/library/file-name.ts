export function fileNameFromUrl(url: string): { name: string; ext: string } {
  const name = url.split("/").pop()?.split("?")[0] || url;
  const dotIndex = name.lastIndexOf(".");
  const ext = dotIndex === -1 ? "" : name.slice(dotIndex + 1).toUpperCase();
  return { name, ext };
}
