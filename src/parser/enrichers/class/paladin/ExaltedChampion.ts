import DDBEnricherData from "../../data/DDBEnricherData";

export default class ExaltedChampion extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      name: "Activate Exalted Champion",
      type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
      addItemConsume: true,
      activationType: "action",
      targetType: "ally",
      data: {
        target: {
          template: {
            contiguous: false,
            type: "radius",
            size: "30",
            units: "ft",
          },
        },
        behaviors: [
          DDBEnricherData.BehaviorHelper.applyEffect({
            effects: "Exalted Champion: Aura",
            auraeffectsNever: true,
          }),
        ],
      },
    };
  }


  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Exalted Champion",
        changes: [
          DDBEnricherData.ChangeHelper.damageResistanceChange("bludgeoning"),
          DDBEnricherData.ChangeHelper.damageResistanceChange("piercing"),
          DDBEnricherData.ChangeHelper.damageResistanceChange("slashing"),
          DDBEnricherData.ChangeHelper.advantageAbilityCheckChange("wis"),
        ],
        activitiesMatch: ["Activate Exalted Champion"],
      },
      {
        name: "Exalted Champion: Aura",
        standalone: true,
        auraeffectsNever: true,
        changes: [
          DDBEnricherData.ChangeHelper.advantageDeathSaveChange(),
          DDBEnricherData.ChangeHelper.advantageAbilityCheckChange("wis"),
        ],
        options: {
          durationSeconds: 3600,
        },
      },
      {
        name: "Exalted Champion: Aura",
        auraeffectsOnly: true,
        daeStackable: "noneNameOnly",
        changes: [
          DDBEnricherData.ChangeHelper.advantageDeathSaveChange(),
          DDBEnricherData.ChangeHelper.advantageAbilityCheckChange("wis"),
        ],
        auraeffects: {
          applyToSelf: false,
          bestFormula: "",
          canStack: false,
          collisionTypes: ["move"],
          combatOnly: false,
          disableOnHidden: true,
          distanceFormula: `30`,
          disposition: 1,
          evaluatePreApply: true,
          overrideName: "",
          script: "",
        },
      },
    ];
  }

}
