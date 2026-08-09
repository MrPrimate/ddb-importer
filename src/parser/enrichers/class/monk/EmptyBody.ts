import DDBEnricherData from "../../data/DDBEnricherData";
import type DDBClassFeatureEnricher from "../../DDBClassFeatureEnricher";

export default class EmptyBody extends DDBEnricherData<DDBClassFeatureEnricher> {
  override get activity(): IDDBActivityData {
    return {
      name: "Go Invisible",
      targetType: "self",
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        options: {
          durationSeconds: 60,
        },
        activityMatch: "Go Invisible",
        statuses: ["invisible"],
        changes: DDBEnricherData.allDamageTypes(["force"]).map((element) =>
          DDBEnricherData.ChangeHelper.damageResistanceChange(element),
        ),
      },
    ];
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Astral Projection",
          type: DDBEnricherData.ACTIVITY_TYPES.CAST,
        },
        build: {
          generateConsumption: false,
          generateSpell: true,
        },
        overrides: {
          addSpellUuid: "Astral Projection",
          addItemConsume: true,
          itemConsumeTargetName: this.ddbEnricher.isParentClass2014 ? "Ki" : "Monk's Focus",
          itemConsumeValue: 8,
          data: {
            spell: {
              properties: [DDBEnricherData.SPELL_PROPERTIES.MATERIAL],
              spellbook: true,
            },
          },
        },
      },
    ];
  }
}
