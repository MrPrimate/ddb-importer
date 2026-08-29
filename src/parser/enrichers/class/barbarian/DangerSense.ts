import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Advantage on Dexterity saving throws, gated on the barbarian's own conditions. 2024 only bars
 * the Incapacitated condition; 2014 also bars Blinded and Deafened, and limits the benefit to
 * effects you can see, which the roll data cannot express.
 */
export default class DangerSense extends DDBEnricherData {

  get _blockingStatuses(): string[] {
    return this.is2014
      ? ["blinded", "deafened", "incapacitated"]
      : ["incapacitated"];
  }

  override get effects(): IDDBEffectHint[] {
    const statuses = this._blockingStatuses;
    const description = this.is2014
      ? "Advantage on Dexterity saving throws against effects you can see, while you are not Blinded, Deafened or Incapacitated. Whether you can see the effect is not checked."
      : "Advantage on Dexterity saving throws unless you have the Incapacitated condition.";

    return [
      {
        name: "Danger Sense",
        options: {
          transfer: true,
          description,
        },
        changes: [
          DDBEnricherData.ChangeHelper.ruleAdvantageChange("save", {
            conditions: [
              { k: "roll.ability", v: "dex" },
              ...statuses.map((status) => DDBEnricherData.ChangeHelper.notStatusFilter(status)),
            ],
          }),
        ],
      },
    ];
  }

}
