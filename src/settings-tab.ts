import { Notice, PluginSettingTab, Setting, type App, type Plugin } from "obsidian";
import { validateVaultRelativeDirectory } from "./domain/path-utils";
import type { ImageLinkStyle, NamingStrategy, PluginSettings } from "./domain/types";

type SettingsPlugin = Plugin & { settings: PluginSettings };

export interface SettingsTabOptions {
	onSettingsChanged?: () => void;
}

export class PrettyPropertiesQolSettingTab extends PluginSettingTab {
	private readonly plugin: SettingsPlugin;
	private readonly options: SettingsTabOptions;

	constructor(app: App, plugin: SettingsPlugin, options: SettingsTabOptions = {}) {
		super(app, plugin);
		this.plugin = plugin;
		this.options = options;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();
		containerEl.createEl("h2", { text: "Pretty Properties QoL" });

		containerEl.createEl("h3", { text: "Property names" });
		this.addPropertySetting(containerEl, "Icon property", "iconProperty");
		this.addPropertySetting(containerEl, "Cover property", "coverProperty");
		this.addPropertySetting(containerEl, "Banner property", "bannerProperty");

		new Setting(containerEl)
			.setName("Import directory")
			.setDesc("Vault-relative directory for imported images. Leave empty to use the vault root.")
			.addText((text) => {
				text.setPlaceholder("Vault root").setValue(this.plugin.settings.importDirectory);
				text.onChange(async (value) => {
					const error = validateVaultRelativeDirectory(value);
					if (error) {
						new Notice(error);
						text.setValue(this.plugin.settings.importDirectory);
						return;
					}
					this.plugin.settings.importDirectory = value.trim().replaceAll("\\", "/");
					await this.plugin.saveData(this.plugin.settings);
					this.options.onSettingsChanged?.();
				});
			});

		new Setting(containerEl)
			.setName("Imported file naming")
			.setDesc("Choose how imported images are named in the vault.")
			.addDropdown((dropdown) => {
				dropdown
					.addOption("original", "Original file name")
					.addOption("note-role", "Note name + role")
					.addOption("manual", "Ask me each time")
					.setValue(this.plugin.settings.namingStrategy)
					.onChange(async (value) => {
						this.plugin.settings.namingStrategy = value as NamingStrategy;
						await this.plugin.saveData(this.plugin.settings);
						this.options.onSettingsChanged?.();
					});
				});

		new Setting(containerEl)
			.setName("Image property link style")
			.setDesc("Choose whether image properties use the shortest unambiguous link or the full vault path.")
			.addDropdown((dropdown) => {
				dropdown
					.addOption("shortest", "Shortest unambiguous link")
					.addOption("full-path", "Full vault path")
					.setValue(this.plugin.settings.imageLinkStyle)
					.onChange(async (value) => {
						this.plugin.settings.imageLinkStyle = value as ImageLinkStyle;
						await this.plugin.saveData(this.plugin.settings);
					});
			});
	}

	private addPropertySetting(containerEl: HTMLElement, name: string, key: "iconProperty" | "coverProperty" | "bannerProperty"): void {
		new Setting(containerEl)
			.setName(name)
			.setDesc("The property name used for this visual role.")
			.addText((text) => {
				text.setValue(this.plugin.settings[key]);
				text.onChange(async (value) => {
					const candidate = value.trim();
					const current = this.plugin.settings;
					const otherNames = [current.iconProperty, current.coverProperty, current.bannerProperty].filter((other) => other !== current[key]);
					if (candidate === "") {
						new Notice("属性名不能为空。");
						text.setValue(current[key]);
						return;
					}
					if (otherNames.includes(candidate)) {
						new Notice("三个图片属性名不能重复。");
						text.setValue(current[key]);
						return;
					}
					current[key] = candidate;
					await this.plugin.saveData(current);
					this.options.onSettingsChanged?.();
				});
			});
	}
}
