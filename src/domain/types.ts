export type VisualRole = "icon" | "cover" | "banner";

export type NamingStrategy = "original" | "note-role" | "manual";

export type ImageLinkStyle = "shortest" | "full-path";

export interface PluginSettings {
	iconProperty: string;
	coverProperty: string;
	bannerProperty: string;
	importDirectory: string;
	namingStrategy: NamingStrategy;
	imageLinkStyle: ImageLinkStyle;
}

export const DEFAULT_SETTINGS: PluginSettings = {
	iconProperty: "icon",
	coverProperty: "cover",
	bannerProperty: "banner",
	importDirectory: "",
	namingStrategy: "original",
	imageLinkStyle: "shortest"
};

export const VISUAL_ROLES: readonly VisualRole[] = ["icon", "cover", "banner"];

export function roleLabel(role: VisualRole): string {
	return role.charAt(0).toUpperCase() + role.slice(1);
}

export function propertyNameForRole(settings: PluginSettings, role: VisualRole): string {
	if (role === "icon") return settings.iconProperty;
	if (role === "cover") return settings.coverProperty;
	return settings.bannerProperty;
}
