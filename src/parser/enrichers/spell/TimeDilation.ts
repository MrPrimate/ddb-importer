import DDBEnricherData from "../data/DDBEnricherData";

/**
 * World of Warcraft (Evoker): the target reduces the damage it takes by 4d8, then loses 1d8 Hit
 * Points at the end of each of its turns until it has lost a separate 4d8 in total. DDB lists both
 * as damage of type "all", which dnd5e cannot apply, so both are rolls the table resolves.
 */
export default class TimeDilation extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Dilate Time",
      data: {
        roll: { prompt: false, visible: true, formula: "4d8", name: "Damage Reduced" },
        target: { override: true, affects: { count: "1", type: "creature" } },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: { name: "Delayed Hit Points", type: DDBEnricherData.ACTIVITY_TYPES.UTILITY },
        build: {
          generateActivation: true,
          generateConsumption: false,
          generateDuration: true,
          generateUtility: true,
          noSpellslot: true,
          activationOverride: { type: "special", value: null, condition: "Once, to set the total Hit Points the target will lose" },
          durationOverride: { units: "inst", concentration: false },
          rollOverride: { prompt: false, visible: true, formula: "4d8", name: "Total Hit Points to Lose" },
        },
      },
      {
        init: { name: "End of Turn Loss", type: DDBEnricherData.ACTIVITY_TYPES.UTILITY },
        build: {
          generateActivation: true,
          generateConsumption: false,
          generateDuration: true,
          generateUtility: true,
          noSpellslot: true,
          activationOverride: { type: "special", value: null, condition: "At the end of each of the target's turns, until the total is lost" },
          durationOverride: { units: "inst", concentration: false },
          rollOverride: { prompt: false, visible: true, formula: "1d8", name: "Hit Points Lost" },
        },
      },
    ];
  }

}
