import DDBEnricherData from "../data/DDBEnricherData";

export default class TruePolymorph extends DDBEnricherData {

  /**
   * Turning an object into a creature makes a new actor, which a transform activity cannot do.
   * The dnd5e SRD pack offers it on the 2014 spell as an open challenge-rating summon; the text
   * caps the creature at challenge rating 9, and it is friendly to the caster. The 2024 SRD spell
   * offers it as a challenge rating 9 transform profile instead, which this follows.
   */
  static OBJECT_INTO_CREATURE: IDDBAdditionalActivity = {
    init: {
      name: "Object into Creature",
      type: DDBEnricherData.ACTIVITY_TYPES.SUMMON,
    },
    build: {
      generateSummon: true,
      noSpellslot: true,
      noConcentration: true,
    },
    overrides: {
      noTemplate: true,
      data: {
        summon: {
          mode: "cr",
          prompt: true,
        },
        match: {
          disposition: true,
        },
        profiles: [
          { name: "", count: "1", cr: "9" },
        ],
      },
    },
  };

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Transform",
          type: DDBEnricherData.ACTIVITY_TYPES.TRANSFORM,
        },
        // applied after the save fails, while the spell is already being concentrated on
        build: {
          noSpellslot: true,
          noConcentration: true,
        },
        overrides: {
          noConsumeTargets: true,
          removeSpellSlotConsume: true,
          name: "Transform",
          data: {
            transform: {
              "customize": !this.is2014,
              "mode": "cr",
              "preset": "polymorph",
            },
            settings: {
              "effects": [
                "origin",
                "otherOrigin",
                "spell",
              ],
              "keep": this.is2014 ? [] : ["hp"],
              "tempFormula": "@source.attributes.hp.max",
              "preset": "polymorph",
              "merge": [],
              "other": [],
              "spellLists": [],
              "transformTokens": true,
              "minimumAC": "",
            },
            // any kind of creature; 2024 folds the challenge rating 9 object form into the transform
            profiles: this.is2014
              ? [{ "types": [] }]
              : [
                { "name": "Creature into Creature", "types": [] },
                { "name": "Object into Creature", "cr": "9", "types": [] },
              ],
          },
        },
      },
      ...(this.is2014 ? [TruePolymorph.OBJECT_INTO_CREATURE] : []),
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      data: {
        flags: {
          midiProperties: {
            autoFailFriendly: true,
          },
        },
      },
    };
  }
}
