import DDBEnricherData from "../data/DDBEnricherData";

export default class Sunbeam extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      name: "Cast",
    };
  }

  // "Until the spell ends, you can take a Magic action to create a new Line"
  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        duplicate: true,
        overrides: {
          name: "Create New Line",
          data: { duration: { override: true, units: "inst", concentration: false } },
          removeSpellSlotConsume: true,
          noConsumeTargets: true,
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        noCreate: true,
        options: { expiry: "sourceStart" },
      },
    ];
  }

}
