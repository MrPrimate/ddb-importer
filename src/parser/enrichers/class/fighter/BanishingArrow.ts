import ArcaneShotOption from "./ArcaneShotOption";

export default class BanishingArrow extends ArcaneShotOption {

  override get activity(): IDDBActivityData {
    return {
      data: {
        damage: {
          critical: { allow: true },
          onSave: "full",
          parts: [
            BanishingArrow.basicDamagePart({
              customFormula: `@scale.${this.subclassIdentifier("Arcane Archer")}.secondary-damage`,
              types: ["force"],
            }),
          ],
        },
        range: {
          value: null,
          units: "spec",
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    if (!this.isAction) return [];
    return [
      {
        name: "Banished",
        statuses: ["Incapacitated"],
        options: {
          expiry: "targetEnd",
        },
      },
    ];
  }

}
