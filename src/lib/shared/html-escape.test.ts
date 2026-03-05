import { describe, expect, it } from "bun:test";
import { escapeHtml } from "./html-escape.ts";

describe("html-escape", () => {
	it("should escape ampersand", () => {
		expect(escapeHtml("Fish & Chips")).toBe("Fish &amp; Chips");
		expect(escapeHtml("A & B & C")).toBe("A &amp; B &amp; C");
	});

	it("should escape less than sign", () => {
		expect(escapeHtml("5 < 10")).toBe("5 &lt; 10");
		expect(escapeHtml("<div>")).toBe("&lt;div&gt;");
	});

	it("should escape greater than sign", () => {
		expect(escapeHtml("10 > 5")).toBe("10 &gt; 5");
		expect(escapeHtml("</div>")).toBe("&lt;/div&gt;");
	});

	it("should escape double quotes", () => {
		expect(escapeHtml('He said "Hello"')).toBe("He said &quot;Hello&quot;");
	});

	it("should escape single quotes", () => {
		expect(escapeHtml("It's a test")).toBe("It&#039;s a test");
	});

	it("should escape all HTML entities in one string", () => {
		const input = "<script>alert(\"X&Y 'test'\")</script>";
		const expected =
			"&lt;script&gt;alert(&quot;X&amp;Y &#039;test&#039;&quot;)&lt;/script&gt;";
		expect(escapeHtml(input)).toBe(expected);
	});

	it("should handle empty string", () => {
		expect(escapeHtml("")).toBe("");
	});

	it("should handle string without special characters", () => {
		expect(escapeHtml("Hello World")).toBe("Hello World");
	});

	it("should handle multiple consecutive special characters", () => {
		expect(escapeHtml("<<<>>>&&&\"\"\"'''")).toBe(
			"&lt;&lt;&lt;&gt;&gt;&gt;&amp;&amp;&amp;&quot;&quot;&quot;&#039;&#039;&#039;",
		);
	});

	it("should escape newlines and tabs", () => {
		expect(escapeHtml("line1\nline2")).toBe("line1\nline2");
		expect(escapeHtml("col1\tcol2")).toBe("col1\tcol2");
	});

	it("should prevent XSS attacks", () => {
		const xss =
			'<img src="x" onerror="alert(1)"><script>alert(document.cookie)</script>';
		const escaped = escapeHtml(xss);
		expect(escaped).toContain("&lt;script&gt;");
		expect(escaped).toContain("&lt;/script&gt;");
		expect(escaped).not.toContain("<script>");
		expect(escaped).toContain("onerror=&quot;alert(1)&quot;");
	});

	it("should handle unicode characters", () => {
		expect(escapeHtml("Hello 🌍")).toBe("Hello 🌍");
		expect(escapeHtml("日本語 < test")).toBe("日本語 &lt; test");
	});
});
