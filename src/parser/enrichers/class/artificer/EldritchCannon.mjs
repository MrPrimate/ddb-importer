/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class EldritchCannon extends DDBEnricherData {
  get type() {
    return "summon";
  }

  get generateSummons() {
    return true;
  }

  get summonsFunction() {
    return this.is2014
      ? DDBImporter.lib.DDBSummonsInterface.getEldritchCannons2014
      : DDBImporter.lib.DDBSummonsInterface.getEldritchCannons2024;
  }

  get activity() {
    return {
      id: "summonEldriComp1",
      targetType: "creature",
      noTemplate: true,
      profileKeys: this.is2014
        ? [
          { count: 1, name: "EldritchCannonFlamethrower2014" },
          { count: 1, name: "EldritchCannonForceBallista2014" },
          { count: 1, name: "EldritchCannonProtector2014" },
        ]
        : [
          { count: 1, name: "EldritchCannon2024" },
        ],
      summons: {
        match: {
          proficiency: false,
          attacks: true,
          saves: true,
        },
        bonuses: {
          ac: "",
          hp: "@classes.artificer.levels*5",
          attackDamage: "@scale.artillerist.eldritch-cannon",
          saveDamage: "@scale.artillerist.eldritch-cannon",
          healing: this.is2014 ? "@abilities.int.mod" : "@scale.artillerist.healing-dice + @abilities.int.mod",
        },
      },
      data: {
        id: "summonEldriComp1",
        creatureSizes: ["sm", "tiny"],
      },
    };
  }


  get additionalActivities() {
    return [
      {
        action: {
          name: "Eldritch Cannon: Flamethrower",
          type: "class",
        },
      },
      {
        action: {
          name: "Eldritch Cannon: Force Ballista",
          type: "class",
        },
      },
      {
        action: {
          name: "Eldritch Cannon: Protector",
          type: "class",
        },
      },
      {
        constructor: {
          name: "Summon With Spell Slot",
          type: "forward",
        },
        build: {
        },
        overrides: {
          activationType: "action",
          data: {
            activity: {
              id: "summonEldriComp1",
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
}
