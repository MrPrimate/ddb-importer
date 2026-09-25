import DDBEnricherData from "../../data/DDBEnricherData";

export default class LayOnHands extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      type: DDBEnricherData.ACTIVITY_TYPES.HEAL,
      name: "Healing",
      addItemConsume: true,
      addScalingMode: "amount",
      addScalingFormula: "1",
      data: {
        consumption: {
          scaling: {
            allowed: true,
            max: "@item.uses.max - @item.uses.spent",
          },
        },
        healing: DDBEnricherData.basicDamagePart({ bonus: "1", types: ["healing"], scalingMode: "whole", scalingFormula: "1" }),
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    const macro: IDDBAdditionalActivity[] = [
      {
        init: {
          name: "Lay On Hands Macro",
          type: DDBEnricherData.ACTIVITY_TYPES.DDBMACRO,
        },
        build: {
          generateConsumption: false,
          generateTarget: false,
          generateRange: false,
          generateActivation: true,
          generateDDBMacro: true,
          ddbMacroOverride: {
            name: "Lay On Hands Macro",
            function: "ddb.feat.layOnHands",
            visible: false,
            parameters: "",
          },
        },
      },
    ];
    if (this.is2014) {
      // DDB folds the 2014 cure into the pool action's text and ships no action for it
      return [...macro, this._cureDiseaseActivity2014];
    }
    return [...macro, { action: { name: "Lay On Hands: Purify Poison", type: "class", rename: ["Purify Poison"] } }];
  }

  get _cureDiseaseActivity2014(): IDDBAdditionalActivity {
    return {
      init: {
        name: "Cure Disease / Neutralize Poison",
        type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
      },
      build: {
        generateActivation: true,
        generateConsumption: true,
        generateRange: true,
        generateTarget: true,
        consumptionOverride: {
          targets: [
            {
              type: "itemUses",
              target: "",
              value: "5",
              scaling: { mode: "", formula: "" },
            },
          ],
          scaling: { allowed: false, max: "" },
        },
        rangeOverride: {
          units: "touch",
          value: "",
        },
        targetOverride: {
          affects: {
            count: "1",
            type: "creature",
          },
        },
      },
    };
  }

  override get override(): IDDBOverrideData {
    const name = this.is2014 ? "Lay on Hands Pool" : "Lay On Hands: Healing Pool";
    const uses = this._getUsesWithSpent({ type: "class", name, max: "5 * @classes.paladin.levels", period: "lr" });
    return {
      data: {
        name: "Lay On Hands",
        system: {
          uses,
        },
      },
    };
  }


}
