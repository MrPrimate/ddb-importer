import { hasDDBCampaign, isDynamicSyncActor } from "../../src/updater/characterSyncData";

describe("dynamic sync campaign gate", () => {
  const actorWith = (flags: Record<string, any>): any => ({ flags: { ddbimporter: flags } });
  const campaign = { id: 8176796, name: "Test Campaign" };

  it("needs a DDB campaign id from the imported character data", () => {
    expect(hasDDBCampaign(actorWith({ dndbeyond: { campaign } }))).toBe(true);
    expect(hasDDBCampaign(actorWith({ dndbeyond: { campaign: null } }))).toBe(false);
    expect(hasDDBCampaign(actorWith({ dndbeyond: {} }))).toBe(false);
    expect(hasDDBCampaign(actorWith({}))).toBe(false);
  });

  it("syncs only actors with dynamic updates on that are in a campaign", () => {
    expect(isDynamicSyncActor(actorWith({ activeUpdate: true, dndbeyond: { campaign } }))).toBe(true);
    expect(isDynamicSyncActor(actorWith({ activeUpdate: true, dndbeyond: { campaign: null } }))).toBe(false);
    expect(isDynamicSyncActor(actorWith({ activeUpdate: false, dndbeyond: { campaign } }))).toBe(false);
    expect(isDynamicSyncActor(actorWith({ dndbeyond: { campaign } }))).toBe(false);
    expect(isDynamicSyncActor(null)).toBe(false);
  });
});
