/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class DrakeCompanion extends DDBEnricherData {

  get type() {
    return "summon";
  }

  get activity() {
    return {
      id: "summonDrakeComp1",
      name: "Summon After Long Rest",
      type: "summon",
      activationType: "action",
      addActivityConsume: true,
      data: {
        uses: {
          spent: null,
          max: "1",
          override: true,
          recovery: [
            { period: "lr", type: 'recoverAll', formula: undefined },
          ],
        },
        bonuses: {
          attackDamage: "@scale.drakewarden.drake-companion",
        },
        creatureSizes: ["sm", "med", "tiny"],
      },
    };
  }

  get override() {
    return {
      data: {
        "system.uses.max": "",
        "system.uses.recovery": [],
      },
    };
  }

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Restore Drake With Spell Slot",
          type: "forward",
        },
        build: {
        },
        overrides: {
          activationType: "action",
          data: {
            activity: {
              id: "summonDrakeComp1",
            },
            consumption: {
              targets: [
                {
                  type: "spellSlots",
                  value: "1",
                  target: "1",
                  scaling: {},
                },
              ],
              scaling: {
                allowed: true,
                max: "",
              },
              spellSlot: true,
            },
            uses: { spent: null, max: "" },
            midiProperties: {
              confirmTargets: "default",
            },
          },
        },
      },
    ];
  }

  get parseAllChoiceFeatures() {
    return true;
  }

}
