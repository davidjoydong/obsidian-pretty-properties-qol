import { normalizePath, TFile, type App } from "obsidian";
import { addConflictSuffix, createImageFileName } from "../domain/file-naming";
import { joinVaultPath, normalizeVaultRelativeDirectory } from "../domain/path-utils";
import type { NamingStrategy, VisualRole } from "../domain/types";

async function ensureFolder(app: App, directory: string): Promise<void> {
	if (directory === "") return;
	let current = "";
	for (const segment of directory.split("/")) {
		current = current === "" ? segment : `${current}/${segment}`;
		if (!app.vault.getAbstractFileByPath(current)) await app.vault.createFolder(current);
	}
}

function uniquePath(app: App, directory: string, fileName: string): string {
	let candidate = normalizePath(joinVaultPath(directory, fileName));
	let index = 1;
	while (app.vault.getAbstractFileByPath(candidate)) {
		candidate = normalizePath(joinVaultPath(directory, addConflictSuffix(fileName, index)));
		index += 1;
	}
	return candidate;
}

export async function importImageFile(
	app: App,
	file: File,
	directory: string,
	noteName: string,
	role: VisualRole,
	strategy: NamingStrategy,
	manualName?: string
): Promise<TFile> {
	const normalizedDirectory = normalizeVaultRelativeDirectory(directory);
	await ensureFolder(app, normalizedDirectory);
	const fileName = createImageFileName(strategy, file.name, noteName, role, manualName);
	const path = uniquePath(app, normalizedDirectory, fileName);
	const created = await app.vault.createBinary(path, await file.arrayBuffer());
	if (!(created instanceof TFile)) throw new Error("导入图片后无法读取仓库文件。");
	return created;
}
