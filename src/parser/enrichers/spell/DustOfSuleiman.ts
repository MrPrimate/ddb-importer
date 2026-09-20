import DDBEnricherData from "../data/DDBEnricherData";

/**
 * The dust deals a flat 20 Force damage, with no save, to creatures of one type chosen as the
 * spell is cast, then again to one that enters the sphere or ends its turn there. DDB carries no
 * dice for it. The later damage is a free copy of the cast with no slot and no template, rolled
 * by hand against creatures of the chosen type.
 */
export default class DustOfSuleiman extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      id: "ddbDustSuleimDmg",
      removeDamageParts: true,
      damageParts: [
        DDBEnricherData.basicDamagePart({ customFormula: "20", types: ["force"], scalingMode: "none" }),
      ],
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        duplicate: true,
        id: "ddbDustSuleimZn1",
        overrides: {
          name: "Ongoing Damage",
          activationType: "special",
          activationCondition: "A creature of the chosen type enters the dust or ends its turn there, or the dust moves into its space (once per turn)",
          removeSpellSlotConsume: true,
          noConsumeTargets: true,
          noTemplate: true,
          data: {
            duration: {
              units: "inst",
              concentration: false,
              override: true,
            },
            range: { override: true, units: "spec" },
            target: { override: true },
          },
        },
      },
    ];
  }

}
