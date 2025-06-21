/* eslint-disable class-methods-use-this */
import { DICTIONARY } from "../../../config/_module.mjs";
import { utils } from "../../../lib/_module.mjs";
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class RitualCaster extends DDBEnricherData {

  get type() {
    return this.is2014 ? null : "utility";
  }

  get activity() {
    if (!this.is2014) {
      return {
        name: "Quick Ritual",
        data: {
          img: "systems/dnd5e/icons/svg/activity/summon.svg",
        },
        addItemConsume: true,

      };
    }
    return null;
  }

  get additionalActivities() {
    const results = [];

    const chosenAbilities = DICTIONARY.actor.abilities.map((a) => a.long.toLowerCase());
    const ability = this.ddbEnricher.ddbParser._chosen.find((c) => chosenAbilities.includes(c.label));
    const spells = this.ddbEnricher.ddbParser._chosen.filter((c) => !chosenAbilities.includes(c.label.toLowerCase()));


    for (const spell of spells) {

      const name = utils.nameString(spell.label);

      const activity = {
        constructor: {
          name,
          type: "cast",
        },
        build: {
          generateConsumption: false,
          generateUses: false,
          generateSpell: true,
          generateActivation: true,
          spellOverride: {
            uuid: null,
            properties: ["ritual"],
            challenge: {
              attack: null,
              save: null,
              override: false,
            },
            spellbook: this.is2024,
          },
        },
        overrides: {
          addSpellUuid: name,
        },
      };

      if (ability) activity.build.spellOverride.ability = ability.value;

      results.push(activity);
    }

    return results;
  }

  get override() {
    return this.is2014
      ? null
      : {
        data: {
          "system.uses": {
            spent: null,
            max: "1",
          },
          "flags.ddbimporter": {
            retainUseSpent: true,
          },
        },
      };
  }

}
