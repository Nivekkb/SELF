/**
 * Tests for SELF Regex Cache Module
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  getCachedRegex,
  getWordBoundaryRegex,
  escapeRegex,
  clearCache,
  getCacheStats,
  prewarmCache,
} from "./regex-cache.js";

describe("Regex Cache", () => {
  beforeEach(() => {
    clearCache();
  });

  describe("getCachedRegex", () => {
    it("creates and caches a regex pattern", () => {
      const pattern = "test";
      const regex = getCachedRegex(pattern);

      expect(regex).toBeInstanceOf(RegExp);
      expect(regex.test("test")).toBe(true);
      expect(regex.test("TEST")).toBe(true); // case-insensitive by default

      const stats = getCacheStats();
      expect(stats.size).toBe(1);
      expect(stats.totalHits).toBe(1);
    });

    it("returns cached regex on subsequent calls", () => {
      const regex1 = getCachedRegex("test");
      const regex2 = getCachedRegex("test");

      expect(regex1).toBe(regex2); // Same instance from cache

      const stats = getCacheStats();
      expect(stats.topEntries[0]?.hits).toBe(2);
    });

    it("respects different flags", () => {
      const regexCaseInsensitive = getCachedRegex("test", "i");
      const regexCaseSensitive = getCachedRegex("test", "");

      expect(regexCaseInsensitive.test("TEST")).toBe(true);
      expect(regexCaseSensitive.test("TEST")).toBe(false);

      const stats = getCacheStats();
      expect(stats.size).toBe(2);
    });
  });

  describe("getWordBoundaryRegex", () => {
    it("creates word-boundary regex for exact matching", () => {
      const regex = getWordBoundaryRegex("help");

      expect(regex.test("help")).toBe(true);
      expect(regex.test("help me")).toBe(true);
      expect(regex.test("please help")).toBe(true);
      expect(regex.test("helper")).toBe(false); // Not a whole word
      expect(regex.test("unhelpful")).toBe(false); // Not a whole word
    });

    it("handles special characters", () => {
      const regex = getWordBoundaryRegex("can't");

      expect(regex.test("can't do it")).toBe(true);
      expect(regex.test("I can't")).toBe(true);
    });
  });

  describe("escapeRegex", () => {
    it("escapes special regex characters", () => {
      expect(escapeRegex("test.")).toBe("test\\.");
      expect(escapeRegex("test*")).toBe("test\\*");
      expect(escapeRegex("test+")).toBe("test\\+");
      expect(escapeRegex("test?")).toBe("test\\?");
      expect(escapeRegex("test$")).toBe("test\\$");
      expect(escapeRegex("test^")).toBe("test\\^");
      expect(escapeRegex("(test)")).toBe("\\(test\\)");
      expect(escapeRegex("[test]")).toBe("\\[test\\]");
      expect(escapeRegex("{test}")).toBe("\\{test\\}");
      expect(escapeRegex("test|")).toBe("test\\|");
    });

    it("handles complex patterns", () => {
      expect(escapeRegex("a.b*c+d?e")).toBe("a\\.b\\*c\\+d\\?e");
    });
  });

  describe("cache management", () => {
    it("clears cache", () => {
      getCachedRegex("test1");
      getCachedRegex("test2");

      expect(getCacheStats().size).toBe(2);

      clearCache();

      expect(getCacheStats().size).toBe(0);
    });

    it("provides cache statistics", () => {
      getCachedRegex("test1");
      getCachedRegex("test1");
      getCachedRegex("test2");

      const stats = getCacheStats();

      expect(stats.size).toBe(2);
      expect(stats.totalHits).toBe(3);
      expect(stats.topEntries).toHaveLength(2);
      expect(stats.topEntries[0]?.hits).toBe(2); // test1 has 2 hits
    });
  });

  describe("prewarmCache", () => {
    it("pre-warms cache with patterns", () => {
      prewarmCache([
        { pattern: "test1" },
        { pattern: "test2", flags: "gi" },
      ]);

      const stats = getCacheStats();
      expect(stats.size).toBe(2);
    });
  });
});