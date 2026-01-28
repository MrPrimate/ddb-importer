/* eslint-disable class-methods-use-this */
import { DICTIONARY } from "../../../../config/_module.mjs";
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class ZealousPresence extends DDBEnricherData {

  get type() {
    return "utility";
  }

  get activity() {
    return {
      targetType: "ally",
      targetCount: 10,
    };
  }

  get useDefaultAdditionalActivities() {
    return true;
  }

  get addToDefaultAdditionalActivities() {
    return true;
  }

  get additionalActivities() {
    if (this.isAction || this.is2014) return [];
    return [
      {
        constructor: {
          name: "Spend Rage to Restore Use",
          type: "utility",
        },
        build: {
          generateConsumption: true,
          generateTarget: true,
          generateActivation: true,
          generateUtility: true,
          noEffects: true,
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
                type: "itemUses",
                value: "1",
                target: "Rage",
                scaling: { allowed: false, max: "" },
              },
            ],
          },
        },
      },
    ];
  }

  get effects() {
    return [
      {
        name: "Zealous Presence",
        changes: DICTIONARY.actor.abilities.map((ability) => DDBEnricherData.ChangeHelper.addChange(`${CONFIG.Dice.D20Roll.ADV_MODE.DISADVANTAGE}`, 20, `system.abilities.${ability.value}.save.roll.mode`)),
        options: {
          durationTurns: 1,
        },
        daeSpecialDurations: ["turnStartSource"],
        midiChanges: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.advantage.attack.all"),
        ],
      },
    ];
  }

  get override() {
    return {
      replaceActivityUses: true,
    };
  }
}
