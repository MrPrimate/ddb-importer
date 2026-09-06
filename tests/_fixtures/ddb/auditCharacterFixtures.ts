/**
 * Loads real captured DDB character payloads from the private audit fixture
 * submodule (tests/audit/fixtures) for character sub-parser tests.
 *
 * The STREAM captures are full character payloads (character, classOptions,
 * unfilteredModifiers, ...) saved by the mule capture runs, so they carry real
 * modifier tuples, race data, class structures and choices. Fixture file names
 * embed capture ids/timestamps that change on re-capture, so tests locate
 * fixtures by directory + name fragment, never by exact file name.
 *
 * Fixture content must never be copied into this repository - tests may assert
 * small derived facts (a speed, a sense range) but not embed payload chunks.
 * When the submodule is not populated (CI), guard suites with
 * `describe.skipIf(!auditFixturesPresent())` so they skip rather than fail.
 */
import fs from "node:fs";
import path from "node:path";
import { makeMockCharacter } from "../mockCharacter";

const FIXTURE_ROOT = path.resolve(__dirname, "../../audit/fixtures");

export function auditFixturesPresent(): boolean {
  try {
    return fs.readdirSync(path.join(FIXTURE_ROOT, "species")).length > 0;
  } catch {
    return false;
  }
}

/**
 * Find the first (sorted) STREAM capture in a fixture domain directory whose
 * file name contains the given fragment, e.g. ("species", "-Grung-") or
 * ("classes/rogue", "Arachnoid-Stalker").
 */
export function findCharacterFixture(domainDir: string, nameFragment: string): string | null {
  const dir = path.join(FIXTURE_ROOT, domainDir);
  let entries: string[];
  try {
    entries = fs.readdirSync(dir);
  } catch {
    return null;
  }
  const match = entries
    .filter((f) => f.startsWith("STREAM") && f.endsWith(".json") && f.includes(nameFragment))
    .sort();
  return match.length > 0 ? path.join(dir, match[0]) : null;
}

interface ICharacterFixtureMockOptions {
  /** run the real abilities parser so downstream parsers see real scores/flags */
  generateAbilities?: boolean;
}

/**
 * Build a DDBCharacter-shaped mock (same skeleton as makeMockCharacter) whose
 * source.ddb is a real captured payload. Prototype methods are invoked against
 * it with `.call(mock)` after importing the sub-parser module under test.
 */
export async function loadCharacterFixtureMock(
  fixturePath: string,
  { generateAbilities = true }: ICharacterFixtureMockOptions = {},
): Promise<any> {
  const payload = JSON.parse(fs.readFileSync(fixturePath, "utf-8"));

  const mock = makeMockCharacter();
  // the capture root is the ddb source object; keep the skeleton's empty
  // defaults for anything a capture predates
  mock.source.ddb = {
    ...mock.source.ddb,
    ...payload,
    character: {
      ...mock.source.ddb.character,
      ...payload.character,
    },
  };
  mock.source.ddb.character.choices ??= {};
  mock.source.ddb.character.choices.choiceDefinitions ??= [];

  // pieces of the real parse pipeline that downstream sub-parsers read
  const totalLevels = (mock.source.ddb.character.classes ?? [])
    .reduce((sum: number, klass: any) => sum + (klass.level ?? 0), 0);
  mock.totalLevels = totalLevels;
  mock.raw.character.flags.ddbimporter.dndbeyond.totalLevels = totalLevels;
  mock.raw.character.system.attributes.prof = Math.ceil(1 + ((totalLevels ?? 1) / 4));

  // size/token parsers write into the prototype token skeleton
  mock.raw.character.prototypeToken = {
    texture: {},
    sight: {},
  };

  const { default: ProficiencyFinder } = await import("../../../src/parser/lib/ProficiencyFinder");
  mock.proficiencyFinder = new ProficiencyFinder({ ddb: mock.source.ddb });

  // adopt the real prototype (without running the constructor) so every
  // registered prototype-extension parser is callable as mock._generateX();
  // callers still need to import the sub-parser module under test first
  const { default: DDBCharacter } = await import("../../../src/parser/DDBCharacter");
  Object.setPrototypeOf(mock, DDBCharacter.prototype);

  if (generateAbilities) {
    await import("../../../src/parser/character/abilities");
    mock._generateAbilities();
  }

  return mock;
}

/** Convenience: find + load in one call, throwing if the fixture is missing. */
export async function loadFixtureCharacter(domainDir: string, nameFragment: string, options: ICharacterFixtureMockOptions = {}): Promise<any> {
  const fixture = findCharacterFixture(domainDir, nameFragment);
  if (!fixture) throw new Error(`No audit fixture matching "${nameFragment}" in ${domainDir}`);
  return loadCharacterFixtureMock(fixture, options);
}
