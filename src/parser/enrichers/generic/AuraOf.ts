import DDBEnricherData from "../data/DDBEnricherData";

export default class AuraOf extends DDBEnricherData {

  get ignoreSelf(): boolean {
    return ["aura of alacrity"].includes(this.ddbParser.originalName.toLowerCase());
  }

  override get type(): IDDBActivityType | null {
    if (!this.isClass("Paladin")) return null;
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData | null {
    if (!this.isClass("Paladin")) return null;
    const isAuraOfProtection = this.ddbParser.originalName.toLowerCase() === "aura of protection";
    return {
      name: "Place Aura",
      targetType: "ally",
      activationType: "special",
      data: {
        target: {
          template: {
            contiguous: false,
            type: "radius",
            size: "@scale.paladin.aura-of-protection",
            units: "ft",
          },
        },
        behaviors: [
          DDBEnricherData.BehaviorHelper.applyEffect({
            effects: this.data.name,
            auraeffectsNever: true,
            ...(isAuraOfProtection ? { ac5eNever: true } : {}),
          }),
        ],
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
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
      // AC5e has native aura support: with it installed the bonus stays on the
      // embedded effect and radiates from the paladin, so the region arm below
      // (which would double the bonus) only emits without AC5e
      ...(isAuraOfProtection
        ? [{
          noCreate: true,
          ac5eOnly: true,
          ac5eChanges: [
            DDBEnricherData.ChangeHelper.ac5eChange(
              "bonus=auraActor.abilities.cha.mod; radius=(auraActor.details.level < 18 ? 10 : 30); allies; singleAura; includeSelf",
              20,
              "flags.automated-conditions-5e.aura.save.bonus",
            ),
          ],
        } satisfies IDDBEffectHint]
        : []),
      {
        noCreate: true,
        standalone: true,
        originReplacement: true,
        auraeffectsNever: true,
        ...(isAuraOfProtection ? { ac5eNever: true } : {}),
        name: this.data.name,
      },
      {
        noCreate: true,
        auraeffectsOnly: true,
        daeStackable: "noneNameOnly",
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
