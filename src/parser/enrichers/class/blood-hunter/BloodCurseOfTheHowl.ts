import DDBEnricherData from "../../data/DDBEnricherData";
import _BloodCurse from "./_BloodCurse";

/**
 * Order of the Lycan, 18th level. The document is built from the DDB action
 * ("Hybrid Transformation Mastery: Blood Curse of the Howl" keeps
 * "Hybrid Transformation Mastery" as its originalName), so this enricher
 * resolves by the action name rather than through a NAME_HINTS alias.
 */
export default class BloodCurseOfTheHowl extends _BloodCurse {

  get curseName(): string {
    return "Blood Curse of the Howl";
  }

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  get clearAutoEffects(): boolean {
    return true;
  }

  get activity(): IDDBActivityData {
    return {
      name: this.curseName,
      targetType: "creature",
      activationType: "action",
      rangeSelf: true,
      data: {
        target: {
          template: {
            contiguous: false,
            type: "radius",
            size: "30",
            units: "ft",
          },
          affects: {
            special: "Each creature within range that can hear you. You can choose any number of creatures you can see to be unaffected.",
          },
        },
        save: {
          ability: ["wis"],
          dc: this.hemocraftSaveDC,
        },
      },
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        duplicate: true,
        overrides: {
          name: this.amplifiedName,
          activationCondition: _BloodCurse.AMPLIFY_CONDITION,
          data: {
            target: {
              template: {
                size: "60",
              },
            },
          },
        },
      },
      this.amplifyCostActivity,
    ];
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Howl",
        activitiesMatch: [this.curseName, this.amplifiedName],
        options: {
          durationSeconds: 6,
          durationRounds: 1,
          description: "You are frightened of the blood hunter. If you failed the saving throw by 5 or more, you are also stunned while frightened in this way. On a success you are immune to this blood curse for the next 24 hours.",
        },
        daeSpecialDurations: ["turnEndSource"],
        statuses: ["Frightened"],
      },
    ];
  }

}
