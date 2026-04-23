import type { TextImageProvider } from "./text-image-provider.js";
import { AzureOpenAIProvider } from "./azure-openai-provider.js";
import { GeminiProvider } from "./gemini-provider.js";
import { ElevenLabsService } from "./elevenlabs-service.js";

export function createTextImageProvider(providerOverride?: string): TextImageProvider {
	const providerId = (providerOverride ?? process.env.TEXT_IMAGE_PROVIDER ?? process.env.AI_PROVIDER ?? "gemini")
		.trim()
		.toLowerCase();

	if (providerId === "azure" || providerId === "azure-openai") {
		return new AzureOpenAIProvider();
	}

	return new GeminiProvider();
}

export const textImageProvider = createTextImageProvider();
export const elevenLabsService = new ElevenLabsService();
