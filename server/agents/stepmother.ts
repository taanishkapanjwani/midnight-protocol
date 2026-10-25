// Agent 3 - The Wicked Stepmother (deterministic adversary): picks and applies reproducible crises.
// Implementation lives in ../crises.ts; this module is the agent's public interface.
export { applyCrisis as stepmotherApply, proposeCrisis as stepmotherPropose, randomCrisis as stepmotherRandom, CRISIS_INFO } from "../crises";
