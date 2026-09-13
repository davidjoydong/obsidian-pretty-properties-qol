const allowedExtensions = new Set(["png", "jpg", "jpeg", "gif", "webp", "svg", "avif", "bmp", "ico"]);

export function isSupportedImageFile(file: Pick<File, "name" | "type">): boolean {
	if (file.type.toLowerCase().startsWith("image/")) return true;
	const extension = file.name.split(".").pop()?.toLowerCase();
	return extension !== undefined && allowedExtensions.has(extension);
}
