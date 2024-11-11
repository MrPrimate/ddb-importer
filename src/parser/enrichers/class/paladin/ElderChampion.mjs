/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../../mixins/DDBEnricherMixin.mjs";

export default class ElderChampion extends DDBEnricherMixin {

  get activity() {
    return {
      name: "Activate Elder Champion",
      type: "utility",
      addItemConsume: true,
      activationType: "bonus",
    };
  }

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Regain HP",
          type: "heal",
        },
        build: {
          generateActivation: true,
          generateTarget: true,
          generateHealing: true,
          healingPart: DDBEnricherMixin.basicDamagePart({ bonus: "10", type: "healing" }),
        },
        overrides: {
          data: {
            targetType: "self",
            activationType: "special",
            condition: "Start of your turn",
          },
        },
      },
      {
        constructor: {
          name: "Spend Spell Slot to Restore Use",
          type: "utility",
        },
        build: {
          generateConsumption: true,
          generateTarget: true,
          generateActivation: true,
          generateUtility: true,
          activationOverride: {
            type: "none",
            value: null,
            condition: "",
          },
          consumptionOverride: {
            targets: [
              {
                type: "itemUses",
                target: "",
                value: -1,
                scaling: { mode: "", formula: "" },
              },
              {
                type: "spellSlots",
                value: "1",
                target: "5",
                scaling: { allowed: false, max: "" },
              },
            ],
          },
        },
      },
    ];
  }

  get override() {
    const uses = this._getUsesWithSpent({ type: "class", name: "Imbue Aura of Protection", max: "1", period: "lr" });
    return {
      data: {
        "system.uses": uses,
      },
    };
  }

  get effects() {
    return [{
      name: "Diminish Defiance",
      options: {
        description: "Enemies in the aura have Disadvantage on saving throws against your spells and Channel Divinity options.",
      },
      data: {
        "flags.ddbimporter.activitiesMatch": ["Activate Elder Champion"],
      },
    }];
  }

}
