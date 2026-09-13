import { describe, expect, it } from "vitest";
import { addConflictSuffix, createImageFileName, validateManualFileName } from "../src/domain/file-naming";

describe("file naming", () => {
	it("keeps the original name", () => {
		expect(createImageFileName("original", "/tmp/hero.png", "Note", "cover")).toBe("hero.png");
	});

	it("creates a note-role name", () => {
		expect(createImageFileName("note-role", "hero.png", "My Note", "cover")).toBe("My Note-cover.png");
	});

	it("uses the source extension for manual names", () => {
		expect(createImageFileName("manual", "hero.jpeg", "Note", "icon", "avatar")).toBe("avatar.jpeg");
	});

	it("rejects path separators in manual names", () => {
		expect(validateManualFileName("nested/avatar")).toBeTruthy();
		expect(validateManualFileName("avatar")).toBeNull();
	});

	it("adds a conflict suffix before the extension", () => {
		expect(addConflictSuffix("hero.png", 2)).toBe("hero 2.png");
	});
});
