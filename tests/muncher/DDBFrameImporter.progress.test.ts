vi.mock("../../src/lib/_module", () => ({
  logger: { debug: vi.fn() },
  FileHelper: { getImagePath: vi.fn() },
  utils: { munchNote: vi.fn() },
}));
vi.mock("../../src/config/_module", () => ({ SETTINGS: { MODULE_ID: "ddb-importer" } }));

import DDBFrameImporter from "../../src/muncher/DDBFrameImporter";
import { FileHelper } from "../../src/lib/_module";

describe("frame import progress", () => {
  beforeEach(() => {
    vi.spyOn(game.settings, "get").mockImplementation(((_module, key) =>
      key === "frame-image-upload-directory" ? "frames" : false) as any);
    vi.spyOn(DDBFrameImporter, "getFrameData").mockResolvedValue([
      { name: "Gold", frameAvatarUrl: "gold.png" },
      { name: "Silver", frameAvatarUrl: "silver.png" },
    ]);
  });

  afterEach(() => vi.restoreAllMocks());

  it("advances after each download and only completes once all files have finished", async () => {
    let finishFirst!: () => void;
    let finishSecond!: () => void;
    vi.mocked(FileHelper.getImagePath)
      .mockImplementationOnce(() => new Promise((resolve) => { finishFirst = () => resolve("gold.png"); }))
      .mockImplementationOnce(() => new Promise((resolve) => { finishSecond = () => resolve("silver.png"); }));
    const notifier = vi.fn();
    const finished = vi.fn();
    const run = DDBFrameImporter.parseFrames(notifier).then(finished);
    await vi.waitFor(() => expect(finishFirst).toBeTypeOf("function"));
    expect(notifier).not.toHaveBeenCalled();
    expect(finished).not.toHaveBeenCalled();

    finishFirst();
    await vi.waitFor(() => expect(finishSecond).toBeTypeOf("function"));
    expect(notifier).toHaveBeenLastCalledWith(expect.objectContaining({ progress: { current: 1, total: 2 } }));
    expect(finished).not.toHaveBeenCalled();

    finishSecond();
    await run;
    expect(notifier).toHaveBeenLastCalledWith(expect.objectContaining({ progress: { current: 2, total: 2 } }));
    expect(finished).toHaveBeenCalledWith(2);
  });

  it("propagates a failed download to the muncher's completion handler", async () => {
    vi.mocked(FileHelper.getImagePath).mockRejectedValueOnce(new Error("Download failed"));
    await expect(DDBFrameImporter.parseFrames()).rejects.toThrow("Download failed");
  });
});
