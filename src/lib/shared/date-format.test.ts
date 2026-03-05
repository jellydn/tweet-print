import { describe, expect, it } from "bun:test";
import { formatDate } from "./date-format.ts";

describe("date-format", () => {
	it("should format ISO date string", () => {
		const result = formatDate("2024-01-15T14:30:00.000Z");
		expect(result).toMatch(/\w+ \d{1,2}, \d{4}/);
		expect(result).toMatch(/at \d{1,2}:\d{2}/);
	});

	it("should handle date with timezone offset", () => {
		const result = formatDate("2024-06-01T08:00:00-05:00");
		expect(result).toBeDefined();
		expect(typeof result).toBe("string");
	});

	it("should handle different months", () => {
		const january = formatDate("2024-01-01T00:00:00.000Z");
		const december = formatDate("2024-12-31T23:59:59.000Z");
		expect(january).toContain("January");
		expect(december).toContain("December");
	});

	it("should handle different years", () => {
		const year2024 = formatDate("2024-06-15T12:00:00.000Z");
		const year2025 = formatDate("2025-06-15T12:00:00.000Z");
		expect(year2024).toContain("2024");
		expect(year2025).toContain("2025");
	});

	it("should format time in 12-hour format", () => {
		const morning = formatDate("2024-01-15T09:30:00.000Z");
		const afternoon = formatDate("2024-01-15T15:30:00.000Z");
		expect(morning).toMatch(/\d{1,2}:\d{2} [AP]M/);
		expect(afternoon).toMatch(/\d{1,2}:\d{2} [AP]M/);
	});
});
