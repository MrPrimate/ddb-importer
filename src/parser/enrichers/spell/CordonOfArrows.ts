import DDBEnricherData from "../data/DDBEnricherData";
import { area } from "./_SpellRegions";

/**
 * The ammunition is planted in the ground and the area is everything within 30 feet of it. The
 * 2014 spell plants it at a point within range, a fixed sphere; the 2024 spell plants it in the
 * caster's space, an area centred on the caster that stays put when the caster moves on. The 2014
 * spell deals 1d6 piercing, the 2024 one 2d4.
 */
export default class CordonOfArrows extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Cast",
      data: {
        target: this.is2014 ? area("sphere", "30") : area("radius", "30", { stationary: true }),
        behaviors: [
          DDBEnricherData.BehaviorHelper.activity({
            events: ["tokenEnter", "tokenTurnEnd"],
            activityName: "Ongoing Save",
          }),
        ],
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Ongoing Save",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          generateActivation: true,
          generateConsumption: false,
          generateTarget: true,
          noSpellslot: true,
          generateSave: true,
          saveOverride: {
            ability: ["dex"],
            dc: {
              formula: "",
              calculation: "spellcasting",
            },
          },
          generateDamage: true,
          damageParts: [
            this.is2014
              ? DDBEnricherData.basicDamagePart({ number: 1, denomination: 6, type: "piercing" })
              : DDBEnricherData.basicDamagePart({ number: 2, denomination: 4, type: "piercing" }),
          ],
          activationOverride: {
            type: "special",
            condition: "Enters within 30 feet of the ammunition or ends its turn there (consumes one piece)",
          },
          targetOverride: {
            override: true,
            affects: {
              count: "1",
              type: "creature",
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
