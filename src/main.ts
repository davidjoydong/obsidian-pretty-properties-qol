import { MarkdownView, Notice, Plugin, TFile } from "obsidian";
import { DEFAULT_SETTINGS, type PluginSettings, type VisualRole } from "./domain/types";
import { validateVaultRelativeDirectory } from "./domain/path-utils";
import { setImageProperty, prepareImageProperties } from "./services/frontmatter-service";
import { assignImportedImage } from "./services/image-assignment-service";
import { pickImageFile } from "./ui/image-file-picker";
import { FileNameModal } from "./ui/file-name-modal";
import { PrettyPropertiesQolSettingTab } from "./settings-tab";
import { PropertyRowButtonController } from "./ui/property-row-buttons";
import { notifyMissingMarkdownNote, registerImageContextMenu } from "./ui/context-menu";

export default class PrettyPropertiesQolPlugin extends Plugin {
	settings: PluginSettings = DEFAULT_SETTINGS;

	async onload(): Promise<void> {
		this.settings = { ...DEFAULT_SETTINGS, ...(await this.loadData() as Partial<PluginSettings> | null) };
		if (validateVaultRelativeDirectory(this.settings.importDirectory) !== null) this.settings.importDirectory = "";
		const propertyButtons = new PropertyRowButtonController({
			app: this.app,
			settings: () => this.settings,
			component: this,
			onSelect: (role, note) => void this.chooseAndAssignImported(role, note)
		});
		this.addSettingTab(new PrettyPropertiesQolSettingTab(this.app, this, { onSettingsChanged: () => propertyButtons.refresh() }));

		for (const role of ["icon", "cover", "banner"] as const) {
			this.addCommand({
				id: `choose-${role}-image`,
				name: `Choose ${role[0].toUpperCase()}${role.slice(1)} image`,
				callback: () => void this.chooseAndAssignImported(role)
			});
		}
		this.addCommand({
			id: "prepare-image-properties",
			name: "Prepare image properties",
			checkCallback: (checking) => {
				const file = this.activeMarkdownFile();
				if (checking) return Boolean(file);
				if (!file) {
					notifyMissingMarkdownNote();
					return false;
				}
				void prepareImageProperties(this.app, file, this.settings).catch((error: unknown) => new Notice(error instanceof Error ? error.message : "Unable to prepare image properties."));
				return true;
			}
		});

		registerImageContextMenu({
			app: this.app,
			component: this,
			onAssign: (role, image, note) => void this.assignExistingImage(role, image, note)
		});
		propertyButtons.start();
	}

	private activeMarkdownFile(): TFile | null {
		return this.app.workspace.getActiveViewOfType(MarkdownView)?.file ?? null;
	}

	private async assignExistingImage(role: VisualRole, image: TFile, note: TFile): Promise<void> {
		try {
			await setImageProperty(this.app, note, this.settings, role, image);
		} catch (error) {
			new Notice(error instanceof Error ? error.message : "Unable to set image property.");
		}
	}

	private async chooseAndAssignImported(role: VisualRole, targetNote?: TFile | null): Promise<void> {
		const note = targetNote === undefined ? this.activeMarkdownFile() : targetNote;
		if (!note) {
			notifyMissingMarkdownNote();
			return;
		}
		const file = await pickImageFile();
		if (!file) return;
		if (this.settings.namingStrategy === "manual") {
			new FileNameModal(this.app, (manualName) => void assignImportedImage(this.app, note, this.settings, role, file, manualName)).open();
			return;
		}
		await assignImportedImage(this.app, note, this.settings, role, file);
	}
}
