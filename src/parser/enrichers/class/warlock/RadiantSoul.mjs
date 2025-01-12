/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class RadiantSoul extends DDBEnricherData {

  get type() {
    return "damage";
  }

  get activity() {
    return {
      name: "Damage bonus",
      noeffect: true,
      activationType: "special",
      activationCondition: "1/turn. Damage someone with a radiant or fire",
      damageParts: [
        DDBEnricherData.basicDamagePart({
          bonus: "@abilities.cha.mod",
          types: ["radiant", "fire"],
        }),
      ],
    };
  }

  get effects() {
    return [
      {
        name: "Radiant Soul (Automation)",
        options: {
          transfer: true,
          durationSeconds: null,
          durationRounds: null,
        },
        midiOnly: true,
        damageBonusMacroChanges: [
          { macroType: "feat", macroName: "radiantSoul.js", document: this.data },
        ],
        data: {
          duration: {
            seconds: null,
            rounds: null,
          },
        },
      },
    ];
  }

  get itemMacro() {
    return {
      type: "feat",
      name: "radiantSoul.js",
    };
  }

}
