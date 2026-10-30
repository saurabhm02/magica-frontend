// Only the file extension comes from the URL; the display name always comes from AssetItem.name.
export function extensionFromUrl(url: string): string {
  const name = url.split("/").pop()?.split("?")[0] ?? "";
  const dotIndex = name.lastIndexOf(".");
  return dotIndex === -1 ? "" : name.slice(dotIndex + 1).toUpperCase();
}
