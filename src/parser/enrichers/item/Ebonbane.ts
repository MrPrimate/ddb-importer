import DDBEnricherData from "../data/DDBEnricherData";
import { itemActivity } from "./_ItemActivities";

export default class Ebonbane extends DDBEnricherData {

  override get addAutoAdditionalActivities(): boolean {
    return false;
  }

  override get activity(): IDDBActivityData {
    return { noConsumeTargets: true, allowCritical: true, removeDamageParts: true };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        duplicate: true,
        id: "ddbEbonbaneAtk01",
        overrides: {
          name: "Attack Celestial or Humanoid",
          activationCondition: "Against a Celestial or Humanoid",
          removeDamageParts: true,
          damageParts: [DDBEnricherData.basicDamagePart({ number: 3, denomination: 6, type: "necrotic" })],
        },
      },
      itemActivity("Insatiable Rage", DDBEnricherData.ACTIVITY_TYPES.SAVE, {
        noeffect: false,
        targetType: "self",
        activationCondition:
          "At dawn after three days without slaying a Celestial or Humanoid; on success use Resisted Rage Damage",
        data: { save: { ability: ["cha"], dc: { calculation: "", formula: "17" } } },
      }),
      itemActivity("Resisted Rage Damage", DDBEnricherData.ACTIVITY_TYPES.DAMAGE, {
        targetType: "self",
        activationCondition: "Only after a successful Insatiable Rage save",
        data: {
          damage: {
            includeBase: false,
            parts: [DDBEnricherData.basicDamagePart({ number: 8, denomination: 8, type: "force" })],
          },
        },
      }),
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Dominated by Ebonbane",
        activityMatch: "Insatiable Rage",
        options: {
          transfer: false,
          description: "The sword controls you until its demand is met. Resolve its commands manually.",
          durationSeconds: null,
        },
      },
    ];
  }

}
