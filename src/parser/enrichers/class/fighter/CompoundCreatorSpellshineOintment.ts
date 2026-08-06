import DDBEnricherData from "../../data/DDBEnricherData";

export default class CompoundCreatorSpellshineOintment extends DDBEnricherData {

  get useDefaultAdditionalActivities() {
    return true;
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Spellshine Ointment",
        activityMatch: "Consume Compound",
        options: {
          durationSeconds: 60,
        },
        changes: [
          DDBEnricherData.ChangeHelper.damageResistanceChange("force"),
          DDBEnricherData.ChangeHelper.damageResistanceChange("necrotic"),
          DDBEnricherData.ChangeHelper.damageResistanceChange("psychic"),
          DDBEnricherData.ChangeHelper.damageResistanceChange("radiant"),
        ],
      },
    ];
  }

}
