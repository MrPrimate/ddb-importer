import { DICTIONARY } from "../../../config/_module";
import { utils } from "../../../lib/_module";
import DDBEnricherData from "../data/DDBEnricherData";

export default class RitualCaster extends DDBEnricherData {

  get type() {
    return this.is2014 ? null : DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
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

  get additionalActivities(): IDDBAdditionalActivity[] {
    const results: IDDBAdditionalActivity[] = [];

    if (this.ddbParser.isMuncher) return results;

    const chosenAbilities = DICTIONARY.actor.abilities.map((a) => a.long.toLowerCase());
    const ability = this.ddbEnricher.ddbParser._chosen.find((c) => chosenAbilities.includes(c.label));
    const spells = this.ddbEnricher.ddbParser._chosen.filter((c) => !chosenAbilities.includes(c.label.toLowerCase()));


    for (const spell of spells) {

      const name = utils.nameString(spell.label);

      const activity = {
        init: {
          name,
          type: DDBEnricherData.ACTIVITY_TYPES.CAST,
        },
        build: {
          generateConsumption: false,
          generateUses: false,
          generateSpell: true,
          generateActivation: true,
          spellOverride: {
            ability: ability ? ability.value : null,
            uuid: null,
            properties: [],
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

      results.push(activity);
    }

    return results;
  }

  get override(): IDDBOverrideData {
    return this.is2014
      ? null
      : {
        uses: {
          spent: null,
          max: "1",
        },
        retainUseSpent: true,
      };
  }

}
