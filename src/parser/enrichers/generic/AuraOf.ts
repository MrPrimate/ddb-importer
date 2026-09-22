import DDBEnricherData from "../data/DDBEnricherData";

const PROTECTION_AURA = { bestFormula: "max(1, @abilities.cha.mod)", overrideName: "Aura of Protection" };

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
    const isAuraOfProtection = this.ddbParser.originalName.toLowerCase() === "aura of protection";
    const protectionChanges = [
      DDBEnricherData.ChangeHelper.unsignedAddChange(
        `+${PROTECTION_AURA.bestFormula}`, 20, "system.rolls.ability.save.bonus",
      ),
    ];

    return [
      // Only one provider owns Protection. AC5e replaces the parsed flat bonus
      // when Aura Effects is unavailable; its emitter must never reach recipients.
      ...(isAuraOfProtection
        ? [{
          noCreate: true,
          ac5eOnly: true,
          auraeffectsNever: true,
          changesOverwrite: true,
          changes: [],
          options: { description: this.data.system.description?.value },
          ac5eChanges: [
            DDBEnricherData.ChangeHelper.ac5eChange(
              "bonus=max(1, auraActor.abilities.cha.mod); radius=(auraActor.details.level < 18 ? 10 : 30); allies; singleAura; includeSelf",
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
        ...(isAuraOfProtection ? {
          ac5eNever: true,
          changesOverwrite: true,
          changes: protectionChanges,
          data: { flags: { ddbimporter: { aura: { ...PROTECTION_AURA } } } },
        } : {}),
        name: this.data.name,
        options: { description: this.data.system.description?.value },
      },
      {
        noCreate: true,
        auraeffectsOnly: true,
        ...(isAuraOfProtection ? { changesOverwrite: true, changes: protectionChanges } : {}),
        options: { description: this.data.system.description?.value },
        daeStackable: "noneNameOnly",
        auraeffects: {
          applyToSelf: !this.ignoreSelf,
          bestFormula: isAuraOfProtection ? PROTECTION_AURA.bestFormula : "",
          canStack: false,
          collisionTypes: ["move"],
          combatOnly: false,
          disableOnHidden: true,
          distanceFormula: `@scale.paladin.aura-of-protection`,
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
