import DDBEnricherData from "../data/DDBEnricherData";

export default class LordsAllianceAgent extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      name: "Reassert Honor",
      activationType: "special",
      targetType: "enemy",
      data: {
        range: {
          units: "spec",
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Reassert Honor: Advantage Mark",
        options: {
          description: "Advantage on the next attack roll. Without DAE or AC5e the effect lasts for every attack until the start of the next turn.",
        },
        // DAE and AC5e each end the effect after the one attack; the duration is the ceiling
        daeSpecialDurations: ["1Attack"],
        data: {
          duration: {
            value: 6,
            expiry: "turnStart",
            expired: undefined,
          },
        },
        changes: [
          DDBEnricherData.ChangeHelper.ruleAdvantageChange("attack"),
        ],
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange("once; 1", 20, "flags.automated-conditions-5e.attack.advantage"),
        ],
      },
    ];
  }

}
