import DDBEnricherData from "../data/DDBEnricherData";

export default class TruePolymorph extends DDBEnricherData {

  /**
   * Turning an object into a creature makes a new actor, which a transform activity cannot do.
   * The dnd5e SRD pack offers it on the 2014 spell as an open challenge-rating summon; the text
   * caps the creature at challenge rating 9, and it is friendly to the caster.
   */
  static OBJECT_INTO_CREATURE: IDDBAdditionalActivity = {
    init: {
      name: "Object into Creature",
      type: DDBEnricherData.ACTIVITY_TYPES.SUMMON,
    },
    build: {
      generateSummon: true,
      noSpellslot: true,
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
        overrides: {
          noConsumeTargets: true,
          removeSpellSlotConsume: true,
          name: "Transform",
          data: {
            transform: {
              "customize": false,
              "mode": "cr",
              "preset": "polymorph",
            },
            settings: {
              "effects": [
                "origin",
                "otherOrigin",
                "spell",
              ],
              "keep": [],
              "tempFormula": "@source.attributes.hp.max",
              "preset": "polymorph",
              "merge": [],
              "other": [],
              "spellLists": [],
              "transformTokens": true,
              "minimumAC": "",
            },
            profiles: [
              {
                "types": [
                  "beast",
                ],
              },
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
