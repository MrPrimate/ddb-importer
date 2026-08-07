import DDBEnricherData from "../../data/DDBEnricherData";
import _BloodCurse from "./_BloodCurse";

/**
 * Order of the Profane Soul, 18th level. The document's own 1/long rest use
 * belongs to the amplified version only, so the base activity drops it and the
 * amplified one keeps it alongside the Blood Maledict use that
 * CONSUMPTION_LINKS adds post-import.
 */
export default class BloodCurseOfTheSouleater extends _BloodCurse {

  get curseName(): string {
    return "Blood Curse of the Souleater";
  }

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      name: this.curseName,
      targetType: "self",
      activationType: "reaction",
      activationCondition: "A creature that isn't a construct or undead is reduced to 0 hit points within 30 feet of you",
      noConsumeTargets: true,
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        duplicate: true,
        overrides: {
          name: this.amplifiedName,
          activationCondition: `A creature that isn't a construct or undead is reduced to 0 hit points within 30 feet of you. ${_BloodCurse.AMPLIFY_CONDITION}. You also regain an expended warlock spell slot.`,
          addItemConsume: true,
        },
      },
      this.amplifyCostActivity,
    ];
  }

  get override(): IDDBOverrideData {
    return {
      ignoredConsumptionActivities: this.ignoredConsumptionActivities,
      // the 1/long rest amplify limit lives on this document, so keep it and
      // let the Blood Maledict link be added alongside it
      retainChildUses: true,
      retainOriginalConsumption: true,
    };
  }

  get effects(): IDDBEffectHint[] {
    const changes = DDBEnricherData.allDamageTypes().map((damage) =>
      DDBEnricherData.ChangeHelper.damageResistanceChange(damage),
    );
    const midiChanges = [
      DDBEnricherData.ChangeHelper.customChange("1", 20, "flags.midi-qol.advantage.attack.all"),
    ];

    return [
      {
        name: "Souleater",
        activityMatch: this.curseName,
        options: {
          durationSeconds: 6,
          durationRounds: 1,
          description: "You make attacks with advantage and you have resistance to all damage.",
        },
        daeSpecialDurations: ["turnEndSource"],
        changes,
        midiChanges,
      },
      {
        name: "Souleater (Amplified)",
        activityMatch: this.amplifiedName,
        options: {
          durationSeconds: 6,
          durationRounds: 1,
          description: "You make attacks with advantage and you have resistance to all damage. You also regain an expended warlock spell slot.",
        },
        daeSpecialDurations: ["turnEndSource"],
        changes,
        midiChanges,
      },
    ];
  }

}
