import { MarkdownView, setIcon, type App, type Component, type TFile } from "obsidian";
import { propertyNameForRole, roleLabel, VISUAL_ROLES, type PluginSettings, type VisualRole } from "../domain/types";

export interface PropertyRowButtonOptions {
	app: App;
	settings: () => PluginSettings;
	component: Component;
	onSelect: (role: VisualRole, note: TFile | null) => void;
}

export class PropertyRowButtonController {
	private observer?: MutationObserver;
	private readonly options: PropertyRowButtonOptions;

	constructor(options: PropertyRowButtonOptions) {
		this.options = options;
	}

	start(): void {
		const buttonFromEvent = (event: Event): HTMLElement | null =>
			event.target instanceof Element ? event.target.closest<HTMLElement>("[data-ppqol-role]") : null;
		const blockPropertyRowEvent = (event: Event): HTMLElement | null => {
			const button = buttonFromEvent(event);
			if (!button) return null;
			event.preventDefault();
			event.stopImmediatePropagation();
			event.stopPropagation();
			return button;
		};
		const activate = (button: HTMLElement) => {
			const role = button.dataset.ppqolRole;
			if (role && VISUAL_ROLES.includes(role as VisualRole)) {
				this.options.onSelect(role as VisualRole, this.noteForButton(button));
			}
		};
		const handlePointerDown = (event: PointerEvent) => {
			if (event.button !== 0) return;
			const button = blockPropertyRowEvent(event);
			if (!button) return;
			activate(button);
		};
		const handleMouseDown = (event: MouseEvent) => {
			if (event.button === 0) blockPropertyRowEvent(event);
		};
		const handleClick = (event: MouseEvent) => {
			blockPropertyRowEvent(event);
		};
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key !== "Enter" && event.key !== " ") return;
			const button = blockPropertyRowEvent(event);
			if (button) activate(button);
		};

		// Capture at window level so the event is stopped before Obsidian's
		// document-level metadata handlers can activate and later commit the
		// empty property editor over the imported link.
		window.addEventListener("pointerdown", handlePointerDown, true);
		window.addEventListener("mousedown", handleMouseDown, true);
		window.addEventListener("click", handleClick, true);
		window.addEventListener("keydown", handleKeyDown, true);
		this.scan();
		this.observer = new MutationObserver(() => this.scan());
		this.observer.observe(document.body, { childList: true, subtree: true });
		this.options.component.register(() => {
			window.removeEventListener("pointerdown", handlePointerDown, true);
			window.removeEventListener("mousedown", handleMouseDown, true);
			window.removeEventListener("click", handleClick, true);
			window.removeEventListener("keydown", handleKeyDown, true);
			this.observer?.disconnect();
			for (const button of Array.from(document.querySelectorAll<HTMLElement>("[data-ppqol-role]"))) button.remove();
			for (const row of Array.from(document.querySelectorAll<HTMLElement>(".ppqol-property-row"))) row.classList.remove("ppqol-property-row");
		});
	}

	refresh(): void {
		this.scan();
	}

	private noteForButton(button: HTMLElement): TFile | null {
		for (const leaf of this.options.app.workspace.getLeavesOfType("markdown")) {
			const view = leaf.view;
			if (view instanceof MarkdownView && view.file && view.containerEl.contains(button)) return view.file;
		}
		return null;
	}

	private scan(): void {
		const settings = this.options.settings();
		const names = new Map(VISUAL_ROLES.map((role) => [propertyNameForRole(settings, role), role]));
		// Obsidian's active-leaf class has changed across desktop releases. The
		// metadata-property class is sufficiently specific and keeps this working
		// in both Live Preview and Reading View without depending on that class.
		const rows = new Set<HTMLElement>(Array.from(document.querySelectorAll<HTMLElement>(".metadata-property")));
		for (const keyEl of Array.from(document.querySelectorAll<HTMLElement>(".metadata-property-key"))) {
			const row = keyEl.closest<HTMLElement>(".metadata-property") ?? keyEl.parentElement?.parentElement;
			if (row) rows.add(row);
		}
		for (const row of rows) {
			const keyElement = row.querySelector<HTMLElement>(".metadata-property-key");
			const key = (keyElement?.textContent?.trim() ||
				(keyElement instanceof HTMLInputElement ? keyElement.value.trim() : "") ||
				keyElement?.querySelector<HTMLInputElement>("input")?.value.trim() ||
				keyElement?.getAttribute("data-property-name")?.trim()) ?? "";
			if (!key) continue;
			const role = names.get(key);
			for (const button of Array.from(row.querySelectorAll<HTMLElement>("[data-ppqol-role]"))) {
				if (button.dataset.ppqolRole !== role) button.remove();
			}
			if (!role) {
				row.classList.remove("ppqol-property-row");
				continue;
			}
			row.classList.add("ppqol-property-row");
			if (row.querySelector(`[data-ppqol-role="${role}"]`)) continue;
			const button = document.createElement("button");
			button.classList.add("clickable-icon", "ppqol-property-button");
			button.type = "button";
			button.dataset.ppqolRole = role;
			button.setAttribute("aria-label", `Choose ${roleLabel(role)} image`);
			row.appendChild(button);
			button.title = `Choose ${roleLabel(role)} image`;
			setIcon(button, "image-plus");
		}
	}
}
