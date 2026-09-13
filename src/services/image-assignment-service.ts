import { Notice, type App, type TFile } from "obsidian";
import { isSupportedImageFile } from "../domain/image-validation";
import type { PluginSettings, VisualRole } from "../domain/types";
import { importImageFile } from "./image-import-service";
import { setImageProperty } from "./frontmatter-service";

export async function assignImportedImage(
	app: App,
	note: TFile,
	settings: PluginSettings,
	role: VisualRole,
	file: File,
	manualName?: string
): Promise<void> {
	if (!isSupportedImageFile(file)) {
		new Notice("所选文件不是受支持的图片格式。");
		return;
	}
	if (settings.namingStrategy === "manual" && !manualName) {
		new Notice("未提供图片文件名。");
		return;
	}

	let imported: TFile | undefined;
	try {
		imported = await importImageFile(app, file, settings.importDirectory, note.basename, role, settings.namingStrategy, manualName);
		try {
			await setImageProperty(app, note, settings, role, imported);
		} catch (error) {
			try {
				await app.vault.delete(imported);
			} catch {
				new Notice(`属性写入失败，且无法清理已导入文件：${error instanceof Error ? error.message : "未知错误"}`);
				return;
			}
			throw error;
		}
	} catch (error) {
		new Notice(error instanceof Error ? error.message : "图片导入失败。");
	}
}
