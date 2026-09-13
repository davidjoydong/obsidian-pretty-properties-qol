import { TFile, type App } from "obsidian";

function candidatesForImage(image: HTMLImageElement): string[] {
	const embed = image.closest<HTMLElement>(".internal-embed");
	const link = image.closest<HTMLAnchorElement>("a");
	return [
		embed?.getAttribute("src"),
		embed?.getAttribute("data-src"),
		link?.getAttribute("href"),
		image.getAttribute("data-src"),
		image.getAttribute("src")
	].filter((value): value is string => typeof value === "string" && value.trim() !== "");
}

function cleanLinkCandidate(value: string): string | null {
	try {
		const url = new URL(value, window.location.href);
		if (url.protocol === "http:" || url.protocol === "https:") {
			if (url.origin !== window.location.origin) return null;
			return decodeURIComponent(url.pathname.replace(/^\//, ""));
		}
		if (url.protocol === "app:") return decodeURIComponent(url.pathname.replace(/^\/+/, ""));
	} catch {
		// Treat non-URL values as vault link paths, unless decoding fails below.
	}
	try {
		return decodeURIComponent(value).replace(/^\/+/, "");
	} catch {
		return null;
	}
}

const imageExtensions = new Set(["png", "jpg", "jpeg", "gif", "webp", "svg", "avif", "bmp", "ico"]);

export function resolveEmbeddedImage(app: App, image: HTMLImageElement, sourcePath: string): TFile | null {
	for (const candidate of candidatesForImage(image)) {
		const linkPath = cleanLinkCandidate(candidate);
		if (!linkPath) continue;
		const file = app.metadataCache.getFirstLinkpathDest(linkPath, sourcePath);
		if (file instanceof TFile && imageExtensions.has(file.extension.toLowerCase())) return file;

		// Live Preview can expose a renderer URL without the vault-relative
		// attachment path. Fall back to an exact vault filename match after the
		// normal link resolver has had the first chance to disambiguate it.
		const basename = linkPath.split("/").pop();
		if (!basename) continue;
		const fallback = app.vault.getFiles().find((vaultFile) => vaultFile.name === basename);
		if (fallback && imageExtensions.has(fallback.extension.toLowerCase())) return fallback;
	}
	return null;
}
