import { MarkdownView, Notice, TFile, type App, type Component, type Menu } from "obsidian";
import { resolveEmbeddedImage } from "../services/embedded-image-resolver";
import type { VisualRole } from "../domain/types";

export interface ImageContextMenuOptions {
	app: App;
	component: Component;
	onAssign: (role: VisualRole, image: TFile, note: TFile) => void;
}

export function registerImageContextMenu(options: ImageContextMenuOptions): void {
	let pending: { image: TFile; note: TFile } | null = null;
	let clearPendingTimer: number | undefined;
	const populatedMenus = new WeakSet<Menu>();

	const rememberImageContext = (event: MouseEvent) => {
		const target = findImageAtEvent(event);
		const view = options.app.workspace.getActiveViewOfType(MarkdownView);
		if (!target || !view?.file || !isInsideMarkdownView(target)) {
			pending = null;
			return;
		}
		const image = resolveEmbeddedImage(options.app, target, view.file.path);
		pending = image ? { image, note: view.file } : null;
		if (clearPendingTimer !== undefined) window.clearTimeout(clearPendingTimer);
		clearPendingTimer = window.setTimeout(() => {
			pending = null;
			clearPendingTimer = undefined;
		}, 250);
	};
	const rememberRightMouseDown = (event: MouseEvent) => {
		if (event.button === 2) rememberImageContext(event);
	};

	const addNativeMenuItems = (menu: Menu, expectedImage?: TFile) => {
		const context = pending;
		if (!context || populatedMenus.has(menu)) return;
		if (expectedImage && expectedImage.path !== context.image.path) return;
		populatedMenus.add(menu);
		menu.addSeparator();
		for (const role of ["icon", "cover", "banner"] as const) {
			menu.addItem((item) => item
				.setTitle(`Set as ${role[0].toUpperCase()}${role.slice(1)}`)
				.setIcon("image-plus")
				.onClick(() => options.onAssign(role, context.image, context.note)));
		}
	};

	// Capture only enough context to identify the clicked image, then let
	// Obsidian build its own menu and append our actions to that same instance.
	document.addEventListener("mousedown", rememberRightMouseDown, true);
	document.addEventListener("contextmenu", rememberImageContext, true);
	options.component.registerEvent(options.app.workspace.on("file-menu", (menu, file) => {
		if (file instanceof TFile) addNativeMenuItems(menu, file);
	}));
	options.component.registerEvent(options.app.workspace.on("editor-menu", (menu) => addNativeMenuItems(menu)));
	options.component.register(() => {
		document.removeEventListener("mousedown", rememberRightMouseDown, true);
		document.removeEventListener("contextmenu", rememberImageContext, true);
		if (clearPendingTimer !== undefined) window.clearTimeout(clearPendingTimer);
	});
}

function findImageAtEvent(event: MouseEvent): HTMLImageElement | null {
	const fromPath = event.composedPath().find((item): item is HTMLImageElement => item instanceof HTMLImageElement);
	if (fromPath) return fromPath;
	const fromPoint = document.elementsFromPoint(event.clientX, event.clientY).find((item): item is HTMLImageElement => item instanceof HTMLImageElement);
	if (fromPoint) return fromPoint;
	if (event.target instanceof Element) {
		const closest = event.target.closest("img");
		if (closest instanceof HTMLImageElement) return closest;
	}
	// Some Live Preview embeds use pointer-events:none on the image widget, so
	// the image is absent from elementsFromPoint even though it is under the
	// cursor. Check rendered image bounds as the final fallback.
	return Array.from(document.images).find((image) => {
		const rect = image.getBoundingClientRect();
		return event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
	}) ?? null;
}

function isInsideMarkdownView(element: HTMLElement): boolean {
	return Boolean(element.closest(".markdown-reading-view, .markdown-preview-view, .markdown-source-view, .cm-content, .cm-editor, .cm-embed"));
}

export function notifyMissingMarkdownNote(): void {
	new Notice("Please open a Markdown note first.");
}
