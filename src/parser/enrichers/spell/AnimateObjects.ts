import DDBEnricherData from "../data/DDBEnricherData";

/**
 * 2024 animates a number of objects equal to the spellcasting modifier from one stat block, built
 * by the companion parser. 2014 animates up to ten objects (two more per slot above 5th) from the
 * spell's statistics table, where a Medium object counts as two, a Large as four and a Huge as
 * eight; those actors come from `getAnimateObjects2014`.
 */
export default class AnimateObjects extends DDBEnricherData {

  static OBJECTS_2014 = "(10 + (@item.level - 5) * 2)";

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SUMMON;
  }

  override get summonsFunction(): ((data: ICompanionData) => Promise<ICompanionResult>) | null {
    return this.is2014 ? DDBImporter.lib.DDBSummonsInterface.getAnimateObjects2014 : null;
  }

  override get generateSummons(): boolean {
    return this.is2014;
  }

  override get activity(): IDDBActivityData | null {
    const summons = {
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
    };
    if (this.is2014) {
      const objects = AnimateObjects.OBJECTS_2014;
      return {
        noTemplate: true,
        profileKeys: [
          { count: objects, name: "AnimateObjectTiny2014" },
          { count: objects, name: "AnimateObjectSmall2014" },
          { count: `floor(${objects} / 2)`, name: "AnimateObjectMedium2014" },
          { count: `floor(${objects} / 4)`, name: "AnimateObjectLarge2014" },
          { count: `floor(${objects} / 8)`, name: "AnimateObjectHuge2014" },
        ],
        // the table's attack bonuses are fixed, so nothing is matched to the caster
        summons: { ...summons, match: { proficiency: false, attacks: false, saves: false, disposition: true } },
      };
    }
    const spellMod = `@attributes.spell.mod`;
    return {
      noTemplate: true,
      profileKeys: [
        { count: `${spellMod}`, name: "companion-animatedobjecttiny-2024" },
        { count: `${spellMod}`, name: "companion-animatedobjectsmall-2024" },
        { count: `${spellMod}`, name: "companion-animatedobjectmedium-2024" },
        { count: `floor(${spellMod} / 2)`, name: "companion-animatedobjectlarge-2024" },
        { count: `floor(${spellMod} / 3)`, name: "companion-animatedobjecthuge-2024" },
      ],
      summons,
    };
  }

  get override(): IDDBOverrideData {
    if (this.is2014) return null;
    return {
      data: {
        system: {
          target: {
            affects: {
              "type": "object",
              "count": "@attributes.spell.mod",
            },
          },
        },
      },
    };
  }

}
