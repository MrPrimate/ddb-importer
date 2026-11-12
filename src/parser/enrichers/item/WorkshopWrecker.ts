import DDBEnricherData from "../data/DDBEnricherData";
import { riders, toggleOffChanges } from "../data/SelfEnchant";

/**
 * AU 2024 (with a DMAU reprint). As the official item, activating the bouncing ball is a
 * self-enchantment that spends the daily use and lasts a minute. The save DC and damage depend on
 * the size of the confined area, so each row of the item's table is its own save, and those saves
 * are the enchantment's riders: they only appear while the ball is active. Using Activate Wrecker
 * again stops the ball for free.
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
    return DDBEnricherData.ACTIVITY_TYPES.ENCHANT;
  }

  override get addAutoAdditionalActivities(): boolean {
    return false;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Activate Wrecker",
      activationType: "action",
      addItemConsume: true,
      noTemplate: true,
      targetType: "self",
      allowMagical: true,
      data: {
        enchant: { self: true },
        duration: { value: "1", units: "minute" },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return WorkshopWrecker.AREAS.map((area) => ({
      init: { name: `Save: ${area.size}-foot Cube`, type: DDBEnricherData.ACTIVITY_TYPES.SAVE, id: area.id },
      build: {
        generateActivation: true,
        generateConsumption: false,
        generateSave: true,
        generateDamage: true,
        generateTarget: true,
        activationOverride: { type: "special", value: null, condition: "When activated or at the start of your turn while active" },
        saveOverride: { ability: ["dex"], dc: { calculation: "", formula: area.dc } },
        damageParts: [WorkshopWrecker.damagePart(area)],
        onSave: "half",
        targetOverride: {
          override: true,
          affects: { type: "creature", count: "", choice: false, special: "" },
          template: { count: "", contiguous: false, type: "cube", size: area.size, width: "", height: "", units: "ft" },
          prompt: true,
        },
      },
      overrides: { noConsumeTargets: true },
    }));
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Activate Wrecker",
        type: "enchant",
        activityMatch: "Activate Wrecker",
        changes: toggleOffChanges("Stop Wrecker"),
        data: {
          flags: {
            ddbimporter: riders({ activities: WorkshopWrecker.AREAS.map((area) => area.id) }),
          },
        },
      },
    ];
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
