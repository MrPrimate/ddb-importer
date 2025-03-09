/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class MetamagicAdept extends DDBEnricherData {


  get override() {
    return {
      data: {
        "flags.ddbimporter.dndbeyond": {
          retainResourceConsumption: true,
        },
        "system.uses": this.hasClassFeature({ featureName: "Font of Magic", className: "Sorcerer" })
          ? {
            spent: null,
            max: null,
            recovery: [],
          }
          : this._getUsesWithSpent({
            type: "feat",
            name: "Sorcery Points (Metamagic Adept)",
            max: "2",
            period: "lr",
          }),
      },
    };
  }

  get effects() {
    return [
      {
        name: "Metamagic Adept",
        options: {
          transfer: true,
        },
        changes: [
          DDBEnricherData.ChangeHelper.addChange("2", 20, "system.scale.sorcerer.points"),
        ],
      },
    ];
  }

}
