import DDBEnricherData from "../../data/DDBEnricherData";

export default class BlessingOfTheRavenQueen extends DDBEnricherData {

  get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      name: "Teleport",
      targetSelf: true,
      activationType: "bonus",
      overrideActivation: true,
      data: {
        range: {
          override: true,
          value: "30",
          units: "ft",
          special: "",
        },
        target: {
          override: true,
          prompt: false,
          affects: {
            count: "1",
            type: "self",
          },
          template: {},
        },
      },
    };
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Blessing of the Raven Queen: Resistance",
        changes: [
          DDBEnricherData.ChangeHelper.customChange("ALL", 20, "system.traits.dr.value"),
        ],
        options: {
          expiry: "sourceStart",
        },
        activityMatch: "Teleport",
      },
    ];
  }

}
