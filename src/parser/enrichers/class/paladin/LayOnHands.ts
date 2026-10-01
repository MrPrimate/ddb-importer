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
    // the Pugilist's Street Saint ships its cure as "Cure Poisoned"
    const cureName = this.isPugilist ? "Lay On Hands: Cure Poisoned" : "Lay On Hands: Purify Poison";
    return [...macro, { action: { name: cureName, type: "class", rename: ["Purify Poison"] } }];
  }

  /** The Pugilist (Street Saint) borrows this feature with its own pool and action names. */
  get isPugilist(): boolean {
    return this.ddbParser?.klass === "Pugilist";
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
    const name = this.isPugilist
      ? "Lay On Hands: Heal"
      : this.is2014 ? "Lay on Hands Pool" : "Lay On Hands: Healing Pool";
    // Street Saint: "a total number of {{3*classlevel}} HP"
    const max = this.isPugilist ? "3 * @classes.pugilist.levels" : "5 * @classes.paladin.levels";
    const uses = this._getUsesWithSpent({ type: "class", name, max, period: "lr" });
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
