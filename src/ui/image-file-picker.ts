export function pickImageFile(): Promise<File | null> {
	return new Promise((resolve) => {
		const input = document.body.createEl("input", { type: "file" });
		input.accept = "image/*";
		input.multiple = false;
		let settled = false;
		const finish = (file: File | null) => {
			if (settled) return;
			settled = true;
			input.remove();
			resolve(file);
		};
		input.addEventListener("change", () => finish(input.files?.[0] ?? null), { once: true });
		input.addEventListener("cancel", () => finish(null), { once: true });
		input.click();
	});
}
