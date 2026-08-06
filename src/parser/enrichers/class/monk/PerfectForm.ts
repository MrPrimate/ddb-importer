import DDBEnricherData from "../../data/DDBEnricherData";
import type DDBClassFeatureEnricher from "../../DDBClassFeatureEnricher";

export default class PerfectForm extends DDBEnricherData<DDBClassFeatureEnricher> {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      targetType: "self",
      activationType: "special",
      activationCondition: "You assume your Martial Form",
      addItemConsume: true,
      itemConsumeValue: "3",
      itemConsumeTargetName: this.ddbEnricher.isParentClass2014 ? "Ki" : "Monk's Focus",
      data: {
        duration: {
          value: "10",
          units: "minute",
        },
      },
    };
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Perfect Form",
        ignoreTransfer: true,
        options: {
          transfer: true,
          disabled: true,
          durationSeconds: 600,
          description: "Mercurial Strikes: Advantage on Unarmed Strikes granted by Flurry of Blows. Regeneration: at the start of your turn, roll one Martial Arts die and regain that many Hit Points. Unbreakable Body: +2 bonus to Armor Class.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("2", 20, "system.attributes.ac.bonus"),
        ],
      },
    ];
  }

}
