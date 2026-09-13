import { Modal, Notice, TextComponent, type App } from "obsidian";
import { validateManualFileName } from "../domain/file-naming";

export class FileNameModal extends Modal {
	private readonly onSubmit: (value: string) => void;
	private input?: TextComponent;

	constructor(app: App, onSubmit: (value: string) => void) {
		super(app);
		this.onSubmit = onSubmit;
	}

	onOpen(): void {
		this.titleEl.setText("输入图片文件名");
		this.contentEl.createEl("p", { text: "不需要填写扩展名。" });
		this.input = new TextComponent(this.contentEl);
		this.input.inputEl.focus();
		this.input.inputEl.addEventListener("keydown", (event) => {
			if (event.key === "Enter") this.submit();
			if (event.key === "Escape") this.close();
		});
		this.input.inputEl.addClass("ppqol-file-name-input");
		const button = this.contentEl.createEl("button", { text: "确定" });
		button.addEventListener("click", () => this.submit());
	}

	onClose(): void {
		this.contentEl.empty();
	}

	private submit(): void {
		const value = this.input?.getValue() ?? "";
		const error = validateManualFileName(value);
		if (error) {
			new Notice(error);
			return;
		}
		this.onSubmit(value.trim());
		this.close();
	}
}
