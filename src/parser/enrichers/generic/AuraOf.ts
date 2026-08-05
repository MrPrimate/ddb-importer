import DDBEnricherData from "../data/DDBEnricherData";

export default class AuraOf extends DDBEnricherData {

  get ignoreSelf() {
    return ["aura of alacrity"].includes(this.ddbParser.originalName.toLowerCase());
  }

  get effects(): IDDBEffectHint[] {
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

    const isAuraOfProtection = this.ddbParser.originalName.toLowerCase() === "aura of protection";

    return [
      {
        noCreate: true,
        daeStackable: "noneNameOnly",
        // AC5e has native aura support, independent of ActiveAuras/auraeffects
        ac5eChanges: isAuraOfProtection
          ? [
            DDBEnricherData.ChangeHelper.customChange(
              "bonus=auraActor.abilities.cha.mod; radius=(auraActor.details.level < 18 ? 10 : 30); allies; singleAura; includeSelf",
              20,
              "flags.automated-conditions-5e.aura.save.bonus",
            ),
          ]
          : [],
        data: {
          flags: {
            ActiveAuras: {
              ignoreSelf: this.ignoreSelf,
              aura: "Allies",
              radius: this.is2014 ? `@scale.paladin.aura-of-protection` : `@scale.paladin.aura`,
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
