import ArcaneShotOption from "./ArcaneShotOption";

export default class BanishingArrow extends ArcaneShotOption {

  get activity() {
    return {
      data: {
        damage: {
          critical: { allow: true },
          onSave: "full",
          parts: [
            BanishingArrow.basicDamagePart({
              customFormula: "@scale.arcane-archer.secondary-damage",
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

  get effects(): IDDBEffectHint[] {
    if (!this.isAction) return [];
    return [
      {
        name: "Banished",
        statuses: ["Incapacitated"],
        options: {
          durationSeconds: 12,
        },
        daeSpecialDurations: ["turnEnd" as const],
      },
    ];
  }

}
