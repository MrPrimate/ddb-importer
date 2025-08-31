/* eslint-disable class-methods-use-this */
import ArcaneShotOption from "./ArcaneShotOption.mjs";

export default class BanishingArrow extends ArcaneShotOption {

  get type() {
    return this.isAction ? null : "none";
  }

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
      },
    };
  }

  get effects() {
    if (!this.isAction) return [];
    return [
      {
        name: "Banished",
        statuses: ["Incapacitated"],
        options: {
          durationSeconds: 12,
        },
        daeSpecialDurations: ["turnEnd"],
      },
    ];
  }

  // get overrides() {
  //   return {
  //     data: {
  //       name: this.name,
  //     },
  //   };
  // }

}
