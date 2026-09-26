import DDBEnricherData from "../data/DDBEnricherData";
import { area } from "./_SpellRegions";

/**
 * A 5-foot cube of air that damages a creature ending its turn within 5 feet of it, so the area is
 * the cube plus 5 feet on every side: a fixed 15-foot cube. Moving the dust devil with a Bonus
 * Action means dragging the area by hand; its 10-foot debris cloud is not modelled.
 * Only a turn ending in the area fires the save, since entering does nothing in the rules, and
 * nothing branches on the printing. It fires for any creature; skipping the caster and the
 * 10-foot push on a failed save are left to the table.
 */
export default class DustDevil extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Cast",
      data: {
        target: area("cube", "15"),
        behaviors: [
          DDBEnricherData.BehaviorHelper.activity({
            events: ["tokenTurnEnd"],
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
          generateDuration: true,
          durationOverride: { units: "inst", concentration: false },
          generateActivation: true,
          generateConsumption: false,
          generateTarget: true,
          noSpellslot: true,
          generateSave: true,
          saveOverride: {
            ability: ["str"],
            dc: {
              formula: "",
              calculation: "spellcasting",
            },
          },
          generateDamage: true,
          damageParts: [
            DDBEnricherData.basicDamagePart({ number: 1, denomination: 8, type: "bludgeoning", scalingMode: "whole", scalingNumber: 1 }),
          ],
          onSave: "half",
          activationOverride: {
            type: "special",
            condition: "Ends its turn within 5 feet of the dust devil",
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
