import DDBEnricherData from "../../data/DDBEnricherData";

export default class CompoundCreatorAdrenalInjection extends DDBEnricherData {

  override get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Adrenal Injection",
        activityMatch: "Consume Compound",
        options: {
          durationSeconds: 60,
          description: "Your Speed increases by 10 feet, and once on each of your turns you can jump up to 30 feet by spending 10 feet of movement.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.movementBonusChange("10", 20),
        ],
      },
    ];
  }

}
