import FileHelper from "../../src/lib/FileHelper";

describe("FileHelper.parseDirectory", () => {
  it("parses a [source] path form", () => {
    expect(FileHelper.parseDirectory("[data] worlds/foo/bar")).toEqual({
      activeSource: "data",
      bucket: null,
      current: "worlds/foo/bar",
      fullPath: "[data] worlds/foo/bar",
    });
  });

  it("parses a [source:bucket] path form", () => {
    expect(FileHelper.parseDirectory("[s3:my-bucket] assets/img")).toEqual({
      activeSource: "s3",
      bucket: "my-bucket",
      current: "assets/img",
      fullPath: "[s3:my-bucket] assets/img",
    });
  });

  it("parses other sources such as forgevtt", () => {
    const result = FileHelper.parseDirectory("[forgevtt] some/path");
    expect(result.activeSource).toBe("forgevtt");
    expect(result.bucket).toBeNull();
    expect(result.current).toBe("some/path");
  });

  it("falls back to a data source for unparseable input", () => {
    expect(FileHelper.parseDirectory("worlds/foo")).toEqual({
      activeSource: "data",
      bucket: null,
      current: "worlds/foo",
      fullPath: "worlds/foo",
    });
  });

  it("trims the current path but keeps the raw fullPath", () => {
    const result = FileHelper.parseDirectory("[data]  worlds/x ");
    expect(result.current).toBe("worlds/x");
    expect(result.fullPath).toBe("[data]  worlds/x ");
  });
});

describe("FileHelper.formatDirectoryPath", () => {
  it("formats without a bucket when bucket is null or empty", () => {
    const base = { activeSource: "data", current: "worlds/art", fullPath: "" };
    expect(FileHelper.formatDirectoryPath({ ...base, bucket: null })).toBe("[data] worlds/art");
    expect(FileHelper.formatDirectoryPath({ ...base, bucket: "" })).toBe("[data] worlds/art");
  });

  it("formats with a bucket when set", () => {
    const parsed = { activeSource: "s3", bucket: "b", current: "a/c", fullPath: "" };
    expect(FileHelper.formatDirectoryPath(parsed)).toBe("[s3:b] a/c");
  });

  it("round-trips bracketed forms exactly", () => {
    for (const input of ["[data] worlds/art", "[s3:b] a/c", "[forgevtt] x/y/z"]) {
      expect(FileHelper.formatDirectoryPath(FileHelper.parseDirectory(input))).toBe(input);
    }
  });

  it("canonicalises failsafe input into a stable [data] form", () => {
    const once = FileHelper.formatDirectoryPath(FileHelper.parseDirectory("foo/bar"));
    expect(once).toBe("[data] foo/bar");
    const twice = FileHelper.formatDirectoryPath(FileHelper.parseDirectory(once));
    expect(twice).toBe(once);
  });
});

describe("FileHelper.removeFileExtension", () => {
  it("removes the final extension", () => {
    expect(FileHelper.removeFileExtension("image.png")).toBe("image");
    expect(FileHelper.removeFileExtension("a.b.c")).toBe("a.b");
  });

  it("returns an empty string when there is no extension", () => {
    // characterization: pop always removes the last split segment, so an
    // extensionless name loses everything
    expect(FileHelper.removeFileExtension("noext")).toBe("");
  });
});

describe("FileHelper.getExtensionFromMime", () => {
  it("maps common image mime types", () => {
    expect(FileHelper.getExtensionFromMime("image/jpeg")).toBe("jpg");
    expect(FileHelper.getExtensionFromMime("image/png")).toBe("png");
    expect(FileHelper.getExtensionFromMime("image/webp")).toBe("webp");
  });

  it("strips structured suffixes and lowercases", () => {
    expect(FileHelper.getExtensionFromMime("image/svg+xml")).toBe("svg");
    expect(FileHelper.getExtensionFromMime("IMAGE/JPEG")).toBe("jpg");
  });

  it("returns an empty string for missing or subtype-less mimes", () => {
    expect(FileHelper.getExtensionFromMime("")).toBe("");
    expect(FileHelper.getExtensionFromMime("image")).toBe("");
  });
});

describe("FileHelper.isUploadSuccess", () => {
  const check = (value: unknown) => FileHelper.isUploadSuccess(value as FilePicker.UploadReturn);

  it("accepts an object with a string path", () => {
    expect(check({ path: "worlds/art/img.webp" })).toBe(true);
  });

  it("rejects false, null, undefined and pathless objects", () => {
    expect(check(false)).toBe(false);
    expect(check(null)).toBe(false);
    expect(check(undefined)).toBe(false);
    expect(check({})).toBe(false);
  });

  it("rejects a non-string path", () => {
    expect(check({ path: 42 })).toBe(false);
  });
});

describe("FileHelper known-file tracking", () => {
  beforeEach(() => {
    CONFIG.DDBI.KNOWN = {
      CHECKED_DIRS: new Set<string>(),
      FILES: new Set<string>(),
      DIRS: new Set<string>(),
      LOOKUPS: new Map<string, any>(),
      TOKEN_LOOKUPS: new Map<string, any>(),
      AVATAR_LOOKUPS: new Map<string, any>(),
      FORGE: { TARGET_URL_PREFIX: {}, TARGETS: {} },
    };
  });

  it("addFileToKnown records the raw file and a fullPath lookup", () => {
    const parsedDir = FileHelper.parseDirectory("[data] worlds/art");
    FileHelper.addFileToKnown(parsedDir, "worlds/art/img.png");

    expect(CONFIG.DDBI.KNOWN.FILES.has("worlds/art/img.png")).toBe(true);
    expect(CONFIG.DDBI.KNOWN.FILES.has("[data] worlds/art/img.png")).toBe(true);
    expect(CONFIG.DDBI.KNOWN.LOOKUPS.get("[data] worlds/art/img.png")).toBe("worlds/art/img.png");
  });

  it("addFileToKnown ignores empty file names", () => {
    const parsedDir = FileHelper.parseDirectory("[data] worlds/art");
    FileHelper.addFileToKnown(parsedDir, "");
    expect(CONFIG.DDBI.KNOWN.FILES.size).toBe(0);
  });

  it("addFileToKnown only records the raw path when the file is outside the dir", () => {
    const parsedDir = FileHelper.parseDirectory("[data] worlds/art");
    FileHelper.addFileToKnown(parsedDir, "other/place/img.png");
    expect(CONFIG.DDBI.KNOWN.FILES.has("other/place/img.png")).toBe(true);
    expect(CONFIG.DDBI.KNOWN.FILES.size).toBe(1);
    expect(CONFIG.DDBI.KNOWN.LOOKUPS.size).toBe(0);
  });

  it("fileExistsUpdate adds only files that are not already known", () => {
    const parsedDir = FileHelper.parseDirectory("[data] worlds/art");
    CONFIG.DDBI.KNOWN.FILES.add("worlds/art/known.png");

    FileHelper.fileExistsUpdate(parsedDir, ["worlds/art/known.png", "worlds/art/new.png"]);

    expect(CONFIG.DDBI.KNOWN.FILES.has("worlds/art/new.png")).toBe(true);
    expect(CONFIG.DDBI.KNOWN.FILES.has("[data] worlds/art/new.png")).toBe(true);
    // the already-known file was skipped, so no lookup was created for it
    expect(CONFIG.DDBI.KNOWN.LOOKUPS.has("[data] worlds/art/known.png")).toBe(false);
  });
});
