import { describe, it, expect } from "vitest";
import { buildResult } from "../../skills/understand/extract-structure.mjs";

const file = (overrides = {}) => ({
  path: "src/foo.py",
  language: "python",
  fileCategory: "code",
  ...overrides,
});

const analysis = (overrides = {}) => ({
  functions: [],
  classes: [],
  imports: [],
  exports: [],
  ...overrides,
});

describe("extract-structure buildResult", () => {
  describe("language pass-through", () => {
    it("preserves the input language on the output", () => {
      const result = buildResult(file({ language: "python" }), 10, 8, analysis(), null, {});
      expect(result.language).toBe("python");
    });

    it("preserves null when caller did not set a language", () => {
      // Documents the failure mode the SKILL.md/file-analyzer.md fix prevents:
      // if the dispatch prompt loses `language`, it propagates to the output.
      const result = buildResult(file({ language: null }), 10, 8, analysis(), null, {});
      expect(result.language).toBeNull();
    });
  });

  describe("importCount fallback", () => {
    const analysisWithImports = analysis({
      imports: [
        { source: "os", specifiers: [] },
        { source: "sys", specifiers: [] },
        { source: "pathlib", specifiers: [] },
      ],
    });

    it("uses pre-resolved imports when batchImportData has entries", () => {
      const batchImportData = { "src/foo.py": ["src/bar.py", "src/baz.py"] };
      const result = buildResult(file(), 10, 8, analysisWithImports, null, batchImportData);
      expect(result.metrics.importCount).toBe(2);
    });

    it("falls back to parser imports when batchImportData entry is an empty array", () => {
      // Regression test: empty arrays are truthy in JS, so a naive `if (importPaths)`
      // would clobber the parser's count with 0. This is the bug Python projects
      // using absolute imports (which the project scanner doesn't resolve) hit.
      const batchImportData = { "src/foo.py": [] };
      const result = buildResult(file(), 10, 8, analysisWithImports, null, batchImportData);
      expect(result.metrics.importCount).toBe(3);
    });

    it("falls back to parser imports when batchImportData has no entry for the file", () => {
      const result = buildResult(file(), 10, 8, analysisWithImports, null, {});
      expect(result.metrics.importCount).toBe(3);
    });

    it("falls back to parser imports when batchImportData is undefined", () => {
      const result = buildResult(file(), 10, 8, analysisWithImports, null, undefined);
      expect(result.metrics.importCount).toBe(3);
    });

    it("reports 0 imports when neither source has any", () => {
      const result = buildResult(file(), 10, 8, analysis(), null, { "src/foo.py": [] });
      expect(result.metrics.importCount).toBe(0);
    });
  });
});
