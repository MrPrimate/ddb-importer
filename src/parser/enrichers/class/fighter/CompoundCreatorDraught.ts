import DDBEnricherData from "../../data/DDBEnricherData";

export default class CompoundCreatorDraught extends DDBEnricherData {

  override get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  draughtEffect(name: string, ability: string): IDDBEffectHint {
    return {
      name,
      activityMatch: "Consume Compound",
      options: {
        durationSeconds: 600,
      },
      changes: [
        DDBEnricherData.ChangeHelper.advantageAbilityCheckChange(ability),
        DDBEnricherData.ChangeHelper.advantageAbilitySaveChange(ability),
      ],
    };
  }

}
