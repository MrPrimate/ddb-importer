import DDBEnricherData from "../../data/DDBEnricherData";

export default class BloodCurseOfBinding extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  get activity(): IDDBActivityData {
    return {
      name: "Blood Curse of Binding",
      targetType: "creature",
      targetCount: 1,
      data: {
        save: {
          ability: ["str"],
          dc: {
            calculation: "int",
            formula: "",
          },
        },
        damage: {
          onSave: "none",
        },
      },
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Amplify Curse",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        build: {
          noeffect: true,
          generateActivation: true,
          generateTarget: true,
          generateDamage: true,
          activationOverride: {
            type: "special",
            value: null,
            condition: "Amplify the curse by taking hemocraft die damage",
          },
          damageParts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "@scale.blood-hunter.blood-curses.die",
              types: ["necrotic"],
            }),
          ],
          allowCritical: false,
        },
        overrides: {
          targetType: "self",
        },
      },
    ];
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        // until the end of the caster's next turn
        name: "Bound",
        activityMatch: "Blood Curse of Binding",
        options: {
          durationSeconds: 6,
          durationRounds: 1,
        },
        daeSpecialDurations: ["turnEndSource"],
        changes: [
          DDBEnricherData.ChangeHelper.customChange("*0", 20, "system.attributes.movement.all"),
        ],
      },
      {
        // amplified: lasts 1 minute
        name: "Bound (Amplified)",
        activityMatch: "Blood Curse of Binding",
        options: {
          durationSeconds: 60,
        },
        changes: [
          DDBEnricherData.ChangeHelper.customChange("*0", 20, "system.attributes.movement.all"),
        ],
      },
    ];
  }

}
