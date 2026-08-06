import DDBEnricherData from "../../data/DDBEnricherData";
import type DDBClassFeatureEnricher from "../../DDBClassFeatureEnricher";

export default class EverPrideful extends DDBEnricherData<DDBClassFeatureEnricher> {

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        action: { name: "Enter Trance", type: "class" },
        overrides: {
          addItemConsume: true,
          itemConsumeTargetName: this.ddbEnricher.isParentClass2014 ? "Ki" : "Monk's Focus",
        },
      },
    ];
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Ever Prideful: Trance",
        options: {
          description: "While in the trance you are immune to the Unconscious condition, can't speak, can't cast or concentrate on spells, and suffer 1 Death Saving Throw failure from damage from a Critical Hit instead of 2. Expend 1 Focus Point at the start of each turn with 0 Hit Points to maintain the trance.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("unconscious", 20, "system.traits.ci.value"),
        ],
        activitiesMatch: ["Enter Trance"],
      },
    ];
  }

}
