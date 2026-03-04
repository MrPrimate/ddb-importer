import DDBEnricherData from "../../data/DDBEnricherData";

export default class EmptyBody extends DDBEnricherData {
  get activity() {
    return {
      name: "Go Invisible",
      targetType: "self",
    };
  }

  get effects(): IDDBEffectHint[] {
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

  get additionalActivities(): IDDBAdditionalActivity[] {
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
          itemConsumeTargetName: "Ki",
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
