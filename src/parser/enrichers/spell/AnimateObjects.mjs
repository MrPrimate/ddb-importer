/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class AnimateObjects extends DDBEnricherData {

  get type() {
    if (this.is2014) return null;
    return "summon";
  }

  get activity() {
    if (this.is2014) return null;
    return {
      noTemplate: true,
      profileKeys: [
        { count: "@attributes.spellmod", name: "companion-animatedobjecttiny-2024" },
        { count: "@attributes.spellmod", name: "companion-animatedobjectsmall-2024" },
        { count: "@attributes.spellmod", name: "companion-animatedobjectmedium-2024" },
        { count: "floor(@attributes.spellmod / 2)", name: "companion-animatedobjectlarge-2024" },
        { count: "floor(@attributes.spellmod / 3)", name: "companion-animatedobjecthuge-2024" },
      ],
      summons: {
        "match": {
          "proficiency": false,
          "attacks": true,
          "saves": false,
        },
        "bonuses": {
          "ac": "",
          "hp": "",
          "attackDamage": "",
          "saveDamage": "",
          "healing": "",
        },
      },
    };
  }

  get override() {
    if (this.is2014) return null;
    return {
      data: {
        system: {
          target: {
            affects: {
              "type": "object",
              "count": "@attributes.spellmod",
            },
          },
        },
      },
    };
  }

}
