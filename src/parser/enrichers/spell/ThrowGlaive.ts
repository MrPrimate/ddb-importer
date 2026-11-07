import DDBEnricherData from "../data/DDBEnricherData";

/**
 * World of Warcraft (Demon Hunter): after a hit the glaive ricochets to a different creature within
 * 30 feet of the target for a new attack and damage roll, once per slot level, each creature only
 * once a casting. The ricochet is a free copy of the attack.
 */
export default class ThrowGlaive extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      id: "ddbThrowGlaiveAt",
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        duplicate: true,
        id: "ddbThrowGlaiveRc",
        overrides: {
          name: "Ricochet",
          noSpellslot: true,
          removeSpellSlotConsume: true,
          noConsumeTargets: true,
          activationType: "special",
          activationCondition: "After a hit, against a different creature within 30 feet of the last target; up to the slot level times",
          data: {
            duration: { override: true, units: "inst", concentration: false },
          },
        },
      },
    ];
  }

}
