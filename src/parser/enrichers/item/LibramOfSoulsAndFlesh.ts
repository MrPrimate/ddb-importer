import DDBEnricherData from "../data/DDBEnricherData";
import { itemUses } from "./_ItemActivities";
import { spellbookStudy } from "./_SpellbookStudy";

export default class LibramOfSoulsAndFlesh extends DDBEnricherData {

  override get type(): IDDBActivityType {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get addAutoAdditionalActivities(): boolean {
    return false;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Deathly Appearance",
      activationType: "action",
      addItemConsume: true,
      noTemplate: true,
      rangeSelf: true,
      targetType: "self",
      activationCondition: "Undead appearance for 10 minutes; ends when you deal damage or force a save",
      data: { duration: { value: "10", units: "minute", concentration: false } },
    };
  }

  override get override(): IDDBOverrideData {
    return itemUses(this, "3", [{ period: "dawn", type: "formula", formula: "1d3" }]);
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [spellbookStudy("necromancy")];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Deathly Appearance",
        activityMatch: "Deathly Appearance",
        options: {
          durationSeconds: 600,
          transfer: false,
          description:
            "Appears undead without changing creature type. End manually after dealing damage or forcing a save.",
        },
      },
    ];
  }

}
