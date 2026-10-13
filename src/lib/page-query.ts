export function pageQuery(
  raw: Record<string, string | string[] | undefined>,
  keys: string[],
) {
  return Object.fromEntries(
    keys
      .filter((key) => typeof raw[key] === "string" && raw[key])
      .map((key) => [key, raw[key] as string]),
  );
}
