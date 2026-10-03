import DDBCharacterLocalSource from "../../src/lib/DDBCharacterLocalSource";

const FOLDER = "modules/ddb-importer/tests/audit/fixtures/lifecycles";

function response(id = 101, name = "Test Build") {
  return { success: true, ddb: { character: { id, name } } };
}

function capture(format = 2, source: unknown = response()) {
  return { format, capturedAt: "2026-10-03T00:00:00.000Z", characterId: 101, source, actor: {} };
}

describe("DDBCharacterLocalSource.normalize", () => {
  it("unwraps the pre-parse source of a format 2 import capture", () => {
    expect(DDBCharacterLocalSource.normalize(capture())).toEqual(response());
  });

  it("accepts a raw proxy response as is", () => {
    const raw = response();
    expect(DDBCharacterLocalSource.normalize(raw)).toBe(raw);
  });

  it("refuses format 1 captures, whose source was taken after parsing", () => {
    expect(() => DDBCharacterLocalSource.normalize(capture(1))).toThrow(/format 1/);
  });

  it("refuses failed responses and non-objects", () => {
    expect(() => DDBCharacterLocalSource.normalize({ success: false, message: "Forbidden" })).toThrow(/successful/);
    expect(() => DDBCharacterLocalSource.normalize(capture(2, null))).toThrow(/not a JSON object/);
    expect(() => DDBCharacterLocalSource.normalize([response()])).toThrow(/not a JSON object/);
    expect(() => DDBCharacterLocalSource.normalize("{}")).toThrow(/not a JSON object/);
  });
});

describe("DDBCharacterLocalSource.pickFile", () => {
  const files = [
    `${FOLDER}/1010-Other-import.json`,
    `${FOLDER}/101-Test%20Build-raw.json`,
    `${FOLDER}/101-Test%20Build-import%20(1).json`,
    `${FOLDER}/101-Test%20Build-import.json`,
    `${FOLDER}/101.json`,
  ];

  it("prefers the import capture over the raw response", () => {
    expect(DDBCharacterLocalSource.pickFile(files, 101)).toBe(`${FOLDER}/101-Test%20Build-import.json`);
  });

  it("falls back to the raw response and never matches a longer id or a re-download", () => {
    expect(DDBCharacterLocalSource.pickFile(files.filter((f) => !f.endsWith("Build-import.json")), "101"))
      .toBe(`${FOLDER}/101-Test%20Build-raw.json`);
    expect(DDBCharacterLocalSource.pickFile([`${FOLDER}/101-Test%20Build-import%20(1).json`, `${FOLDER}/101.json`], 101))
      .toBeNull();
  });
});

describe("DDBCharacterLocalSource.load", () => {
  const filePicker = foundry.applications.apps.FilePicker as any;
  const originalImplementation = filePicker.implementation;
  let browse: ReturnType<typeof vi.fn>;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    DDBCharacterLocalSource.clearCache();
    browse = vi.fn(async () => ({ files: [`${FOLDER}/101-Test%20Build-import.json`], dirs: [] }));
    filePicker.implementation = { browse };
    fetchMock = vi.fn(async () => ({ ok: true, json: async () => capture() }));
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    filePicker.implementation = originalImplementation;
    vi.unstubAllGlobals();
  });

  it("reads the character's capture from the folder and lists the folder once", async () => {
    const first = await DDBCharacterLocalSource.load(101, FOLDER);
    expect(first).toEqual({ response: response(), file: "101-Test Build-import.json" });
    expect(browse).toHaveBeenCalledWith("data", FOLDER, { bucket: undefined });
    expect(fetchMock.mock.calls[0][0]).toBe(`${FOLDER}/101-Test%20Build-import.json`);

    await DDBCharacterLocalSource.load(101, FOLDER);
    expect(browse).toHaveBeenCalledTimes(1);
  });

  it("returns null without fetching when the folder has no file for the character", async () => {
    expect(await DDBCharacterLocalSource.load(202, FOLDER)).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("throws when the file holds a different character", async () => {
    fetchMock.mockImplementation(async () => ({ ok: true, json: async () => capture(2, response(999)) }));
    await expect(DDBCharacterLocalSource.load(101, FOLDER)).rejects.toThrow(/holds character 999/);
  });
});
