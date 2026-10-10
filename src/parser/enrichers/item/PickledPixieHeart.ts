import DDBEnricherData from "../data/DDBEnricherData";
import { itemProperty } from "./_ItemActivities";

/**
 * The Magus Class. A charge casts Misty Step; each chosen creature within 5 feet of the space
 * left makes a DC 14 Constitution save or is Poisoned for a minute, repeating the save at the end
 * of each of its turns.
 */
export default class PickledPixieHeart extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.CAST;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Misty Step",
      addSpellUuid: "Misty Step",
      noSpellslot: true,
      addItemConsume: true,
      noTemplate: true,
      data: {
        spell: {
          spellbook: true,
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      itemProperty("Poisonous Departure", DDBEnricherData.ACTIVITY_TYPES.SAVE, {
        save: { ability: ["con"], formula: "14" },
        condition: "Creatures of your choice within 5 feet of the space you teleported from",
        template: { type: "radius", size: "5" },
        range: { value: null, units: "self" },
      }),
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Poisoned",
        activityMatch: "Poisonous Departure",
        statuses: ["poisoned"],
        options: {
          transfer: false,
          durationSeconds: 60,
          description: "Repeat the DC 14 Constitution save at the end of each turn, ending the condition on a success.",
        },
      },
    ];
  }

}
