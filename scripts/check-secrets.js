import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
const paths = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" })
  .split("\0")
  .filter(Boolean);
const findings = [];
for (const path of paths) {
  if (/(^|\/)\.env(?:\.|$)/.test(path) && !path.endsWith(".env.example"))
    findings.push(path + ": environment file tracked");
  if (path.endsWith(".log")) findings.push(path + ": log tracked");
  if (!/\.(?:js|json|yaml|yml|md)$/.test(path)) continue;
  let text;
  try {
    text = readFileSync(path, "utf8");
  } catch {
    continue;
  }
  if (/mongodb(?:\+srv)?:\/\/[^\s"'\x60]*@/i.test(text))
    findings.push(path + ": credential-bearing Mongo URI");
  if (
    !path.startsWith("test/") &&
    /\b(?:clientSecret|sessionSecret|googlePass)\s*:\s*["'][^"']{8,}["']/i.test(
      text,
    )
  )
    findings.push(path + ": sensitive literal");
}
if (findings.length) {
  console.error(findings.join("\n"));
  process.exitCode = 1;
} else
  console.log(
    "OK: tracked tree without env files, logs, authenticated Mongo URIs or sensitive configuration literals.",
  );
