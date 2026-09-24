import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { AUDIENCE, LINKS } from "../lib/site.ts";

const root = fileURLToPath(new URL("../", import.meta.url));
const kit = JSON.parse(readFileSync(new URL("../lib/media-kit.json", import.meta.url), "utf8"));
const pythonFlag = process.argv.indexOf("--python");
const python = pythonFlag >= 0 ? process.argv[pythonFlag + 1] : (process.env.PYTHON || "python");
if (!python) throw new Error("Provide a Python executable after --python.");
const result = spawnSync(python, [fileURLToPath(new URL("./build-media-kit.py", import.meta.url))], {
  input: JSON.stringify({ root, kit, audience: AUDIENCE, links: LINKS }),
  encoding: "utf8",
});
if (result.stdout) process.stdout.write(result.stdout);
if (result.stderr) process.stderr.write(result.stderr);
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
