import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

import { registerAlphaTools } from "./research-tools/alpha.js";
import { registerDiscoveryCommands } from "./research-tools/discovery.js";
import { registerFeynmanModelCommand } from "./research-tools/feynman-model.js";
import { installFeynmanHeader } from "./research-tools/header.js";
import { registerHelpCommand } from "./research-tools/help.js";
import { registerHuggingFaceTools } from "./research-tools/huggingface.js";
import { registerInitCommand, registerOutputsCommand } from "./research-tools/project.js";
import { registerServiceTierControls } from "./research-tools/service-tier.js";

export default function researchTools(pi: ExtensionAPI): void {
	const cache: { agentSummaryPromise?: Promise<{ agents: string[]; chains: string[] }> } = {};

	// Pi 0.66.x folds post-switch/resume lifecycle into session_start.
	pi.on("session_start", async (_event, ctx) => {
		await installFeynmanHeader(pi, ctx, cache);
	});

	registerAlphaTools(pi);
	registerHuggingFaceTools(pi);
	registerDiscoveryCommands(pi);
	registerFeynmanModelCommand(pi);
	registerHelpCommand(pi);
	registerInitCommand(pi);
	registerOutputsCommand(pi);
	registerServiceTierControls(pi);
}
