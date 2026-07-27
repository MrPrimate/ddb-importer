/**
 * Canonical barrel mocks for parser tests.
 *
 * Importing any parser file pulls in the barrel re-exports, which creates the
 * circular chain config/_module -> settings -> lib/_module -> DDBSources ->
 * config/_module and drags in the effects tree. Nearly every parser test
 * breaks the cycle with the same three vi.mock calls; these factories are that
 * triple, shared.
 *
 * Usage (in a test file). IMPORTANT: the factories must be wrapped in lazy
 * arrows - passing them directly (vi.mock(path, configModuleMock)) fails with
 * "Cannot access '__vi_import_0__' before initialization" because vi.mock is
 * hoisted above the import, leaving the binding in TDZ. The arrow defers the
 * reference until the mocked module actually loads:
 *
 *   import { configModuleMock, effectsModuleMock, ddbEffectHelperMock } from "../../_setup/mockBarrels";
 *
 *   vi.mock("../../../src/config/_module", () => configModuleMock());
 *   vi.mock("../../../src/effects/_module", () => effectsModuleMock());
 *   vi.mock("../../../src/effects/DDBEffectHelper", () => ddbEffectHelperMock());
 *
 * The vi.mock() paths are resolved relative to the CALLING test file, so they
 * stay in the test file; only the factory bodies live here.
 */
import { vi } from "vitest";

/** config/_module with the real DICTIONARY (via importActual) and a stub SETTINGS. */
export async function configModuleMock(): Promise<Record<string, any>> {
  const dict = await vi.importActual<any>("../../src/config/dictionary/dictionary");
  return { SETTINGS: { MODULE_ID: "ddb-importer" }, DICTIONARY: dict.default };
}

/** Empty effects barrel. */
export function effectsModuleMock(): Record<string, any> {
  return {};
}

/** DDBEffectHelper stub (never mock the real one when testing DDBEffectHelper itself). */
export function ddbEffectHelperMock(): Record<string, any> {
  return { default: {} };
}
