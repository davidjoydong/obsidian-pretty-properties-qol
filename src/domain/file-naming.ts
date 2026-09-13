import type { NamingStrategy, VisualRole } from "./types";
import { hasPathSeparator } from "./path-utils";

function extensionOf(fileName: string): string {
	const lastDot = fileName.lastIndexOf(".");
	return lastDot > 0 ? fileName.slice(lastDot) : "";
}

function baseName(fileName: string): string {
	const lastSlash = Math.max(fileName.lastIndexOf("/"), fileName.lastIndexOf("\\"));
	const name = lastSlash >= 0 ? fileName.slice(lastSlash + 1) : fileName;
	const extension = extensionOf(name);
	return extension === "" ? name : name.slice(0, -extension.length);
}

export function validateManualFileName(value: string): string | null {
	const trimmed = value.trim();
	if (trimmed === "") return "文件名不能为空。";
	if (hasPathSeparator(trimmed)) return "文件名不能包含路径分隔符。";
	if (trimmed === "." || trimmed === "..") return "文件名无效。";
	return null;
}

export function createImageFileName(
	strategy: NamingStrategy,
	sourceName: string,
	noteName: string,
	role: VisualRole,
	manualName?: string
): string {
	const sourceBase = baseName(sourceName).trim() || "image";
	const extension = extensionOf(sourceName);

	if (strategy === "note-role") {
		return `${noteName.trim() || "note"}-${role}${extension}`;
	}
	if (strategy === "manual") {
		const value = (manualName ?? "").trim();
		return `${baseName(value)}${extension}`;
	}
	return `${sourceBase}${extension}`;
}

export function addConflictSuffix(fileName: string, index: number): string {
	const extension = extensionOf(fileName);
	const base = extension === "" ? fileName : fileName.slice(0, -extension.length);
	return `${base} ${index}${extension}`;
}
