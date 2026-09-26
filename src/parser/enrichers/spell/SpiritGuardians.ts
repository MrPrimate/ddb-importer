import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Nothing is rolled by the cast itself. The area is forced to a "radius" template, an emanation
 * that follows the caster, and the region fires the save on entering and on the turn event each
 * printing names. 2014: when a creature passes into the area for the first time on a turn or
 * starts its turn there; the emanation appearing on a creature or moving onto one is not entering
 * (enterOn "movement"). 2024: whenever the emanation enters a creature's space, including as it
 * appears around creatures on the cast, and whenever a creature enters it or ends its turn there
 * (enterOn "any"). The default once-per-turn gate holds a creature to one save a turn. The save
 * targets enemies, so only hostile tokens are affected and the caster is skipped; difficult
 * terrain for the same hostile tokens stands in for the halved Speed. Sparing chosen hostile
 * creatures and catching neutral ones are left to the table, and the damage roll offers radiant or
 * necrotic.
 */
export default class SpiritGuardians extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Cast",
      data: {
        behaviors: [
          DDBEnricherData.BehaviorHelper.difficultTerrain(),
          DDBEnricherData.BehaviorHelper.activity({
            events: ["tokenEnter", this.is2014 ? "tokenTurnStart" : "tokenTurnEnd"],
            activityName: "Save vs Damage",
            excludeSelf: true,
            // 2014: only a creature passing into the area counts; 2024: "whenever the Emanation
            // enters a creature's space" includes it appearing around creatures as it is cast
            enterOn: this.is2014 ? "movement" : "any",
          }),
        ],
      },
    };
  }

  override get override(): IDDBOverrideData {
    return {
      data: {
        system: {
          target: {
            affects: {
              type: "enemy",
            },
            template: {
              type: "radius",
            },
          },
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Save vs Damage",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          generateDuration: true,
          durationOverride: { units: "inst", concentration: false },
          generateActivation: true,
          generateConsumption: false,
          generateTarget: true,
          noSpellslot: true,
          generateSave: true,
          saveOverride: {
            ability: ["wis"],
            dc: {
              formula: "",
              calculation: "spellcasting",
            },
          },
          generateDamage: true,
          damageParts: [
            DDBEnricherData.basicDamagePart({
              number: 3,
              denomination: 8,
              types: ["necrotic", "radiant"],
              scalingMode: "whole",
              scalingNumber: 1,
            }),
          ],
          onSave: "half",
          activationOverride: {
            type: "special",
            condition: this.is2014
              ? "Enters the area for the first time on a turn or starts its turn there"
              : "Enters the Emanation for the first time on a turn or ends its turn there",
          },
          // the region takes its dispositions from this save rather than from Cast, so this is
          // what keeps the caster's designated allies out of it
          targetOverride: {
            override: true,
            affects: {
              count: "1",
              type: "enemy",
            },
            template: {},
          },
        },
        overrides: {
          data: {
            range: {
              override: true,
              units: "spec",
            },
          },
        },
      },
    ];
  }

}
