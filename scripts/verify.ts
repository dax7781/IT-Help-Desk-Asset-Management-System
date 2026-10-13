import { spawn } from "node:child_process";
async function main() {
  for (const args of [
    ["node_modules/next/dist/bin/next", "typegen"],
    ["node_modules/eslint/bin/eslint.js", "."],
    ["node_modules/typescript/bin/tsc", "--noEmit"],
    ["node_modules/vitest/vitest.mjs", "run"],
    ["node_modules/next/dist/bin/next", "build"],
    ["--import", "tsx", "scripts/verify-release.ts", "--browser"],
  ]) {
    const child = spawn(process.execPath, args, {
      stdio: "inherit",
      env: process.env,
    });
    const result = await new Promise<number | null>((resolve, reject) => {
      child.once("exit", resolve);
      child.once("error", reject);
    });
    if (result !== 0)
      throw new Error("Verification failed. See the preceding check output.");
  }
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
