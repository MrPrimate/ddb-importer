/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class AuraOf extends DDBEnricherData {

  get ignoreSelf() {
    return ["aura of alacrity"].includes(this.ddbParser.originalName.toLowerCase());
  }

  get effects() {
    if (!this.isClass("Paladin")) return [];
    // const className = !this.ddbParser.subKlass
    //   ? "paladin"
    //   : this.hasClassFeature({
    //     featureName: this.ddbParser.originalName,
    //     className: "Paladin",
    //     subClassName: this.ddbParser.subKlass,
    //   })
    //     ? this.getClassIdentifier(this.ddbParser.subKlass)
    //     : "paladin";

    // console.warn(`Aura of: ${this.ddbParser.originalName} - ${className}`, {
    //   this: this,
    //   className: this.hasClassFeature({
    //     featureName: this.ddbParser.originalName,
    //     className: "Paladin",
    //     subClassName: this.ddbParser.subKlass,
    //   }),
    // });

    return [
      {
        noCreate: true,
        data: {
          flags: {
            "dae.stackable": "noneNameOnly",
            ActiveAuras: {
              ignoreSelf: this.ignoreSelf,
              aura: "Allies",
              radius: `@scale.paladin.aura-of-protection`,
              isAura: true,
              inactive: false,
              hidden: false,
              displayTemp: true,
            },
          },
        },
        auraeffects: {
          applyToSelf: !this.ignoreSelf,
          bestFormula: "",
          canStack: false,
          collisionTypes: ["move"],
          combatOnly: false,
          disableOnHidden: true,
          distanceFormula: `@scale.paladin.aura-of-protection`,
          disposition: 1,
          evaluatePreApply: true,
          overrideName: "",
          script: "",
        },
      },
    ];
  }

}
