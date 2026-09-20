import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Ear Horn of Hearing: suppresses the Deafened condition while held to the ear.
 */
export default class EarHornOfHearing extends DDBEnricherData {
  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Suppressed Condition: Deafened",
        changes: [
          DDBEnricherData.ChangeHelper.conditionImmunityChange("deafened"),
        ],
        options: {
          transfer: true,
        },
      },
    ];
  }

}
