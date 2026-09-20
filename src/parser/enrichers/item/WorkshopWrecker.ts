import DDBEnricherData from "../data/DDBEnricherData";

/**
 * AU 2024 (with a DMAU reprint). The bouncing ball's save DC and damage depend on the size of the
 * confined area, so each row of the item's table is its own save activity; the first is the
 * activation and spends the daily use, the rest are the per-turn repeats.
 */
export default class WorkshopWrecker extends DDBEnricherData {

  static AREAS: { size: string; dc: string; number: number; bonus: string; id: string }[] = [
    { size: "15", dc: "18", number: 6, bonus: "5", id: "ddbWreckerCube15" },
    { size: "30", dc: "17", number: 4, bonus: "4", id: "ddbWreckerCube30" },
    { size: "50", dc: "15", number: 2, bonus: "2", id: "ddbWreckerCube50" },
    { size: "100", dc: "14", number: 1, bonus: "1", id: "ddbWreckerCub100" },
  ];

  static damagePart(area: { number: number; bonus: string }): I5eDamagePart {
    return DDBEnricherData.basicDamagePart({ number: area.number, denomination: 6, bonus: area.bonus, type: "bludgeoning", scalingMode: "none" });
  }

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    const [area] = WorkshopWrecker.AREAS;
    return {
      name: `Activate (${area.size}-foot Cube)`,
      targetType: "creature",
      activationType: "action",
      activationCondition: "Repeat at the start of each of your turns while the ball is active",
      addItemConsume: true,
      removeDamageParts: true,
      damageParts: [WorkshopWrecker.damagePart(area)],
      data: {
        save: { ability: ["dex"], dc: { calculation: "", formula: area.dc } },
        damage: { onSave: "half" },
        duration: { value: "1", units: "minute" },
        target: {
          affects: { type: "creature" },
          template: { type: "cube", size: area.size, units: "ft" },
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return WorkshopWrecker.AREAS.slice(1).map((area) => ({
      duplicate: true,
      id: area.id,
      overrides: {
        name: `Activate (${area.size}-foot Cube)`,
        // the daily use is spent by the first activity; the duplicates are the other table rows
        noConsumeTargets: true,
        removeDamageParts: true,
        damageParts: [WorkshopWrecker.damagePart(area)],
        data: {
          save: { dc: { formula: area.dc } },
          target: { template: { size: area.size } },
        },
      },
    }));
  }

  override get override(): IDDBOverrideData {
    return {
      uses: {
        spent: 0,
        max: "1",
        recovery: [{ period: "dawn", type: "recoverAll" }],
      },
    };
  }

}
