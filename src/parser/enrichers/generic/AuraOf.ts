import DDBEnricherData from "../data/DDBEnricherData";

const PROTECTION_AURA = { bestFormula: "max(1, @abilities.cha.mod)", overrideName: "Aura of Protection" };

export default class AuraOf extends DDBEnricherData {

  /**
   * The aura's radius in feet, as a formula. Paladin auras share the Aura of Protection's reach,
   * which DDB ships as a scale; a subclass aura with its own reach overrides this.
   */
  get auraSize(): string {
    return "@scale.paladin.aura-of-protection";
  }

  get ignoreSelf(): boolean {
    return ["aura of alacrity"].includes(this.ddbParser.originalName.toLowerCase());
  }

  override get effects(): IDDBEffectHint[] {
    if (!this.isClass("Paladin")) return [];
    const isAuraOfProtection = this.ddbParser.originalName.toLowerCase() === "aura of protection";
    const protectionChanges = [
      DDBEnricherData.ChangeHelper.unsignedAddChange(
        `+${PROTECTION_AURA.bestFormula}`, 20, "system.bonuses.abilities.save",
      ),
    ];

    return [
      {
        noCreate: true,
        ...(isAuraOfProtection ? { changesOverwrite: true, changes: protectionChanges } : {}),
        options: { description: this.data.system.description?.value },
        daeStackable: "noneNameOnly",
        // AC5e has native aura support, independent of ActiveAuras/auraeffects
        ac5eChanges: isAuraOfProtection
          ? [
            DDBEnricherData.ChangeHelper.ac5eChange(
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
              radius: this.is2014 ? this.auraSize : `@scale.paladin.aura`,
              isAura: true,
              inactive: false,
              hidden: false,
              displayTemp: true,
            },
          },
        },
        auraeffects: {
          applyToSelf: !this.ignoreSelf,
          bestFormula: isAuraOfProtection ? PROTECTION_AURA.bestFormula : "",
          canStack: false,
          collisionTypes: ["move"],
          combatOnly: false,
          disableOnHidden: true,
          distanceFormula: this.auraSize,
          disposition: 1,
          evaluatePreApply: true,
          overrideName: isAuraOfProtection ? PROTECTION_AURA.overrideName : "",
          script: isAuraOfProtection
            ? `!sourceToken.actor.statuses.has("${this.is2014 ? "unconscious" : "incapacitated"}")`
            : "",
        },
      },
    ];
  }

}
