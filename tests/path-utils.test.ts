import { describe, expect, it } from "vitest";
import { joinVaultPath, normalizeVaultRelativeDirectory, validateVaultRelativeDirectory } from "../src/domain/path-utils";

describe("vault paths", () => {
	it("accepts an empty directory as the vault root", () => {
		expect(validateVaultRelativeDirectory("")).toBeNull();
		expect(normalizeVaultRelativeDirectory("")).toBe("");
	});

	it("rejects absolute paths and traversal", () => {
		expect(validateVaultRelativeDirectory("/tmp/images")).toBeTruthy();
		expect(validateVaultRelativeDirectory("images/../outside")).toBeTruthy();
	});

	it("joins a relative directory and file name", () => {
		expect(joinVaultPath("images\\covers", "hero.png")).toBe("images/covers/hero.png");
	});
});
