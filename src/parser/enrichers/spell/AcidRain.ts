import DDBEnricherData from "../data/DDBEnricherData";

/**
 * The deluge rolls its save as it begins, then again for a creature that enters or ends its turn
 * there: the second is a free copy of the cast with no slot and no template, rolled by hand.
 */
export default class AcidRain extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      id: "ddbAcidRainSpSav",
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        duplicate: true,
        id: "ddbAcidRainZone1",
        overrides: {
          name: "Ongoing Save",
          activationType: "special",
          activationCondition: "Enters the rain for the first time on its turn or ends its turn there",
          removeSpellSlotConsume: true,
          noConsumeTargets: true,
          noTemplate: true,
          data: {
            range: { override: true, units: "spec" },
            target: { override: true },
          },
        },
      },
    ];
  }

}
