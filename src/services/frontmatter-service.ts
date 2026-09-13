import type { App, TFile } from "obsidian";
import type { PluginSettings, VisualRole } from "../domain/types";
import { propertyNameForRole, VISUAL_ROLES } from "../domain/types";

function isSupportedPropertyValue(value: unknown): value is string | null | undefined {
	return value === null || value === undefined || typeof value === "string";
}

export async function setImageProperty(
	app: App,
	file: TFile,
	settings: PluginSettings,
	role: VisualRole,
	image: TFile
): Promise<void> {
	const propertyName = propertyNameForRole(settings, role);
	const linkText = settings.imageLinkStyle === "shortest"
		? app.metadataCache.fileToLinktext(image, file.path, false)
		: image.path;
	await app.fileManager.processFrontMatter(file, (frontmatter) => {
		const currentValue: unknown = frontmatter[propertyName];
		if (!isSupportedPropertyValue(currentValue)) {
			throw new Error(`属性“${propertyName}”不是普通文本或链接属性。`);
		}
		frontmatter[propertyName] = `[[${linkText}]]`;
	});
}

export async function prepareImageProperties(
	app: App,
	file: TFile,
	settings: PluginSettings
): Promise<void> {
	await app.fileManager.processFrontMatter(file, (frontmatter) => {
		const managedNames = VISUAL_ROLES.map((role) => propertyNameForRole(settings, role));
		const managed = new Map<string, unknown>();
		for (const propertyName of managedNames) {
			managed.set(propertyName, Object.prototype.hasOwnProperty.call(frontmatter, propertyName) ? frontmatter[propertyName] : "");
		}

		const remaining = Object.entries(frontmatter).filter(([key]) => !managed.has(key));
		for (const key of Object.keys(frontmatter)) delete frontmatter[key];
		for (const [key, value] of managed) frontmatter[key] = value;
		for (const [key, value] of remaining) frontmatter[key] = value;
	});
}
