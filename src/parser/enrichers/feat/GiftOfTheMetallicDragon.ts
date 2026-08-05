import DDBEnricherData from "../data/DDBEnricherData";

export default class GiftOfTheMetallicDragon extends DDBEnricherData {

  get useDefaultAdditionalActivities() {
    return true;
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        // Protective Wings: reaction grants +PB to AC against one attack
        name: "Protective Wings",
        activityMatch: "Gift of the Metallic Dragon: Protective Wings",
        options: {
          durationRounds: 1,
          description: "Add a bonus to AC equal to your proficiency bonus against one attack that would hit.",
        },
        daeSpecialDurations: ["isAttacked"],
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("@prof", 20, "system.attributes.ac.bonus"),
        ],
      },
    ];
  }

}
