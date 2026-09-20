import DDBEnricherData from "../data/DDBEnricherData";
import { ongoingTrigger } from "./_SpellRegions";

/**
 * The chains roll a save as they burst out, with the piercing damage, then a second kind of save,
 * with no damage, for a creature that enters the area or starts its turn there. DDB's second
 * damage part is the bludgeoning a Restrained creature takes at the end of its turn, which a
 * region cannot single out, so it is a free roll made by hand, as is the check to break free.
 */
export default class ChainsOfBeleth extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      name: "Cast",
      removeDamageParts: true,
      damageParts: [
        DDBEnricherData.basicDamagePart({ number: 8, denomination: 6, types: ["piercing"], scalingMode: "whole", scalingNumber: 1 }),
      ],
      data: {
        damage: { onSave: "none" },
        behaviors: [
          DDBEnricherData.BehaviorHelper.activity({
            events: ["tokenEnter", "tokenTurnStart"],
            activityName: "Ongoing Save",
          }),
        ],
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      ongoingTrigger({
        condition: "Enters the chains for the first time on a turn or starts its turn there",
        noDamage: true,
      }),
      ongoingTrigger({
        name: "Crushing Chains",
        condition: "A creature Restrained by the chains ends its turn",
        noSave: true,
        damageParts: [1],
      }),
      {
        init: { name: "Break Free", type: DDBEnricherData.ACTIVITY_TYPES.CHECK },
        build: {
          generateCheck: true,
          generateTarget: false,
          generateRange: false,
          generateConsumption: false,
          noSpellslot: true,
          checkOverride: { ability: "", associated: ["ath"], dc: { calculation: "spellcasting", formula: "" } },
        },
        overrides: { noeffect: true, noTemplate: true, activationType: "action" },
      },
    ];
  }

  // the parsed Restrained effect would also ride on the crushing damage, which restrains no one
  override get clearAutoEffects(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Restrained",
        activitiesMatch: ["Cast", "Ongoing Save"],
        statuses: ["Restrained"],
        options: {
          transfer: false,
          description: "Restrained while in the area or until it breaks free with a Strength (Athletics) check against the spell save DC.",
        },
      },
    ];
  }

}
