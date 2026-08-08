import DDBEnricherData from "../../data/DDBEnricherData";

export default class ExaltedChampion extends DDBEnricherData {

  get activity(): IDDBActivityData {
    return {
      name: "Activate Exalted Champion",
      type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
      addItemConsume: true,
      activationType: "action",
    };
  }


  get effects(): IDDBEffectHint[] {
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
        daeStackable: "noneNameOnly",
        changes: [
          DDBEnricherData.ChangeHelper.advantageDeathSaveChange(),
          DDBEnricherData.ChangeHelper.advantageAbilityCheckChange("wis"),
        ],
        data: {
          flags: {
            ActiveAuras: {
              aura: "Allies",
              radius: `30`,
              isAura: true,
              ignoreSelf: true,
              inactive: false,
              hidden: false,
              displayTemp: true,
            },
          },
        },
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
