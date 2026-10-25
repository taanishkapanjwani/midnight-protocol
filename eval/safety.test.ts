// npm run test:safety - proves each safety defense works (no API key needed).
import { runSafetyTests } from "../server/selftest";

const results = await runSafetyTests();
for (const r of results) console.log(`${r.passed ? "PASS" : "FAIL"}  ${r.name}\n      risk: ${r.risk}\n      evidence: ${r.evidence}\n`);
const failed = results.filter((r) => !r.passed).length;
console.log(`${results.length - failed}/${results.length} safety tests passed`);
process.exit(failed ? 1 : 0);
