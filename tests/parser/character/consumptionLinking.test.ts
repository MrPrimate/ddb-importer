import DDBCharacter from "../../../src/parser/DDBCharacter";
import "../../../src/parser/character/consumptionLinking";

function makeParent() {
  return {
    _id: "parentIdIIIIIIII",
    name: "Channel Divinity",
    type: "feat",
    flags: { ddbimporter: { originalName: "Channel Divinity" } },
    system: { identifier: "channel-divinity", uses: { max: "2", spent: 0 }, activities: {} },
  };
}

function makeChild({ flags = {}, spent = 1 }: { flags?: Record<string, any>; spent?: number | null } = {}) {
  return {
    _id: "childIdIIIIIIIII",
    name: "Harness Divine Power",
    type: "feat",
    flags: { ddbimporter: { originalName: "Harness Divine Power", ...flags } },
    system: {
      identifier: "harness-divine-power",
      uses: { max: "1", spent },
      activities: {
        ddbHarnessDivine: {
          _id: "ddbHarnessDivine",
          name: "Harness Divine Power",
          consumption: { targets: [] },
        },
      },
    },
  };
}

/** call the prototype method with a minimal actor stub rather than building a character */
async function runLinking(items: any[]) {
  const stub = {
    currentActor: { items: { toObject: () => items } },
  };
  return DDBCharacter.prototype._getAutoLinkActivityDictionaryUpdates.call(stub as unknown as DDBCharacter);
}

describe("consumption linking child uses", () => {

  it("blanks the child's own uses pool by default", async () => {
    const updates = await runLinking([makeParent(), makeChild()]);
    const update = updates.find((u) => u._id === "childIdIIIIIIIII") as any;
    expect(update.system.uses).toEqual({ spent: null, max: "" });
  });

  it("writes no uses update when retainChildUses is set", async () => {
    const updates = await runLinking([makeParent(), makeChild({ flags: { retainChildUses: true } })]);
    const update = updates.find((u) => u._id === "childIdIIIIIIIII") as any;
    expect(update.system.uses).toBeUndefined();
  });

  it("keeps the spent value when retainUseSpent is set, independently of retainChildUses", async () => {
    const updates = await runLinking([makeParent(), makeChild({ flags: { retainUseSpent: true }, spent: 2 })]);
    const update = updates.find((u) => u._id === "childIdIIIIIIIII") as any;
    expect(update.system.uses).toEqual({ spent: 2, max: "" });
  });

  it("still links the child activity to the parent resource", async () => {
    const updates = await runLinking([makeParent(), makeChild()]);
    const update = updates.find((u) => u._id === "childIdIIIIIIIII") as any;
    expect(update.system.activities.ddbHarnessDivine.consumption.targets).toEqual([
      { type: "itemUses", value: "1", target: "feat:channel-divinity" },
    ]);
  });

});
