function normalizePath(value: string): string {
	return value.split("/").filter((segment) => segment !== "" && segment !== ".").join("/");
}

export function validateVaultRelativeDirectory(value: string): string | null {
	const trimmed = value.trim().replaceAll("\\", "/");
	if (trimmed === "") return null;
	if (trimmed.startsWith("/") || /^[A-Za-z]:\//.test(trimmed)) {
		return "导入目录必须是仓库内的相对路径。";
	}
	const segments = trimmed.split("/");
	if (segments.some((segment) => segment === "..")) {
		return "导入目录不能包含 .. 路径穿越。";
	}
	const normalized = normalizePath(trimmed);
	if (normalized === "." || normalized === ".." || normalized.startsWith("../")) return "导入目录不能包含 .. 路径穿越。";
	return null;
}

export function normalizeVaultRelativeDirectory(value: string): string {
	const trimmed = value.trim().replaceAll("\\", "/");
	return trimmed === "" ? "" : normalizePath(trimmed).replace(/^\/+|\/+$/g, "");
}

export function joinVaultPath(directory: string, fileName: string): string {
	const normalizedDirectory = normalizeVaultRelativeDirectory(directory);
	return normalizedDirectory === "" ? fileName : `${normalizedDirectory}/${fileName}`;
}

export function hasPathSeparator(value: string): boolean {
	return value.includes("/") || value.includes("\\");
}
