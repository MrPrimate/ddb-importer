// @vitest-environment jsdom
import DDBPartySync from "../../src/apps/DDBPartySync";

/** A stand-in for the open app: the campaign select, its state and the party actor. */
function fakeApp(selected: string) {
  const element = document.createElement("div");
  element.innerHTML = `<select id="ddb-party-campaign-select"><option value="${selected}" selected>${selected}</option></select>`;
  return {
    element,
    campaignId: "",
    partyState: {} as Record<string, unknown>,
    actor: { update: vi.fn().mockResolvedValue(undefined) },
    render: vi.fn(),
    _loadCharacters: vi.fn().mockResolvedValue(undefined),
  };
}

describe("DDBPartySync._onSaveCampaignId", () => {
  it("stores the campaign id and deletes the stale campaign name with the v14 operator", async () => {
    const app = fakeApp("12345");
    await DDBPartySync._onSaveCampaignId.call(app as unknown as DDBPartySync, new Event("click"));
    expect(app.actor.update).toHaveBeenCalledWith({
      "flags.ddbimporter.partyCampaignId": "12345",
      "flags.ddbimporter.partyCampaignName": _del,
    });
    expect(JSON.stringify(app.actor.update.mock.calls)).not.toContain("-=");
    expect(app._loadCharacters).toHaveBeenCalled();
  });
});
