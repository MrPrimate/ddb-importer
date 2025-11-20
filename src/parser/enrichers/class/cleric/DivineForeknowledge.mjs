/* eslint-disable class-methods-use-this */
import { DICTIONARY } from "../../../../config/_module.mjs";
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class DivineForeknowledge extends DDBEnricherData {

  get activity() {
    return {
      name: "Divine Foreknowledge",
    };
  }

  get additionalActivities() {
    return [
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
            scaling: { allowed: true, max: "4" },
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
                target: "6",
                scaling: { mode: "level", formula: "" },
              },
            ],
          },
        },
      },
    ];
  }

  get effects() {
    const changes = [
      DDBEnricherData.ChangeHelper.addChange(`${CONFIG.Dice.D20Roll.ADV_MODE.ADVANTAGE}`, 20, "system.attributes.death.roll.mode"),
    ];

    DICTIONARY.actor.abilities.forEach((ability) => {
      changes.push(
        DDBEnricherData.ChangeHelper.addChange(`${CONFIG.Dice.D20Roll.ADV_MODE.DISADVANTAGE}`, 20, `system.abilities.${ability.value}.check.roll.mode`),
        DDBEnricherData.ChangeHelper.addChange(`${CONFIG.Dice.D20Roll.ADV_MODE.DISADVANTAGE}`, 20, `system.abilities.${ability.value}.save.roll.mode`),
      );
    });
    return [
      {
        changes,
        options: {
          durationSeconds: 3600,
        },
      },
    ];
  }

}
