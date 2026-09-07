import DDBEnricherData from "../data/DDBEnricherData";

export default class WandOfTeeth extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Spray of Teeth",
      targetType: "creature",
      activationType: "action",
      addItemConsume: true,
      data: {
        save: { ability: ["dex"], dc: { calculation: "", formula: "15" } },
        damage: {
          onSave: "half",
          parts: [
            DDBEnricherData.basicDamagePart({ number: 1, denomination: 8, type: "piercing", scalingMode: "whole", scalingNumber: 1 }),
          ],
        },
        consumption: {
          scaling: { allowed: true, max: "min(3, @item.uses.max - @item.uses.spent)" },
        },
        range: { units: "self" },
        target: {
          affects: { type: "creature" },
          template: { type: "cone", size: "30", units: "ft" },
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Poisoned by Teeth",
        statuses: ["Poisoned"],
        options: { expiry: "sourceStart" },
      },
    ];
  }

}
