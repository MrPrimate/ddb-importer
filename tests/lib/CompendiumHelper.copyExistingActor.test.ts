import { describe, it, expect, vi, afterEach } from "vitest";
import CompendiumHelper from "../../src/lib/CompendiumHelper";
import { setMockSettings } from "../_setup/foundryMocks";

/**
 * A request can carry its own update and biography policy (the extension's Send biography forces
 * an update and asks for the page text), which must win over the bulk muncher settings.
 */
describe("CompendiumHelper.copyExistingActorProperties overrides", () => {
  const existingBiography = { value: "<p>Old compendium lore</p>", public: "" };
  const pageBiography = { value: "<p>Page lore</p>", public: "" };

  const stubCompendium = () => {
    const existingNPC = {
      img: "monsters/old.webp",
      prototypeToken: {},
      system: { details: { biography: existingBiography } },
      flags: {},
      toObject() {
        return { flags: {} };
      },
    };
    vi.spyOn(CompendiumHelper, "getCompendiumType").mockReturnValue({
      getDocument: async () => existingNPC,
    } as unknown as ReturnType<typeof CompendiumHelper.getCompendiumType>);
  };

  const parsedActor = () => ({
    _id: "abc",
    name: "Goblin",
    img: "monsters/new.webp",
    prototypeToken: {},
    flags: {},
    system: { details: { biography: { ...pageBiography } } },
  }) as unknown as I5eActorData;

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("keeps the existing biography under the retain setting", async () => {
    setMockSettings({
      "munching-policy-update-existing": true,
      "munching-policy-update-images": true,
      "munching-policy-monster-retain-biography": true,
    });
    stubCompendium();
    const actor = await CompendiumHelper.copyExistingActorProperties("monster", parsedActor());
    expect(actor.system.details?.biography).toEqual(existingBiography);
  });

  it("uses the parsed biography when the request turns retention off", async () => {
    setMockSettings({
      "munching-policy-update-existing": true,
      "munching-policy-update-images": true,
      "munching-policy-monster-retain-biography": true,
    });
    stubCompendium();
    const actor = await CompendiumHelper.copyExistingActorProperties("monster", parsedActor(), { retainBiography: false });
    expect(actor.system.details?.biography).toEqual(pageBiography);
  });

  it("carries existing properties over for a forced update with bulk updates off", async () => {
    setMockSettings({
      "munching-policy-update-existing": false,
      "munching-policy-update-images": true,
      "munching-policy-monster-retain-biography": true,
    });
    stubCompendium();
    const skipped = await CompendiumHelper.copyExistingActorProperties("monster", parsedActor());
    expect(skipped.system.details?.biography).toEqual(pageBiography);
    const forced = await CompendiumHelper.copyExistingActorProperties("monster", parsedActor(), { updateExisting: true });
    expect(forced.system.details?.biography).toEqual(existingBiography);
  });
});
