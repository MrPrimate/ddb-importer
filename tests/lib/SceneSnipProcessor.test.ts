import SceneSnipProcessor from "../../src/lib/SceneSnipProcessor";

describe("SceneSnipProcessor.setSnips", () => {
  const snip = { id: "a", targetLevelIds: [] } as any;

  it("writes the snipsnipsnip namespace and deletes the legacy flag with the v14 operator", async () => {
    const update = vi.fn().mockResolvedValue(undefined);
    const scene = { flags: { ddbimporter: { snips: [snip] } }, update };
    await SceneSnipProcessor.setSnips(scene, [snip]);
    expect(update).toHaveBeenNthCalledWith(1, { flags: { snipsnipsnip: { snips: [snip] } } });
    expect(update).toHaveBeenNthCalledWith(2, { "flags.ddbimporter.snips": _del });
    // no legacy "-=key" deletion anywhere in the payload
    expect(JSON.stringify(update.mock.calls)).not.toContain("-=");
  });

  it("leaves the scene alone when there is no legacy flag", async () => {
    const update = vi.fn().mockResolvedValue(undefined);
    await SceneSnipProcessor.setSnips({ flags: {}, update }, [snip]);
    expect(update).toHaveBeenCalledTimes(1);
  });
});
