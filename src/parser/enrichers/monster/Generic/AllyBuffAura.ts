import DDBEnricherData from "../../data/DDBEnricherData";
import SRDEffects from "../../effects/SRDEffects";

/**
 * Ally-buff emanations: "the hobgoblin and its allies have Advantage on attack
 * rolls and saving throws" (Aura of Authority, Marshal Undead 2024) and
 * "creatures of the knight's choice ... have Immunity to the Charmed and
 * Frightened conditions" (Aura of Bravery). "Aura" places the emanation from
 * the monster's token and a native applyActiveEffect behavior carries the buff
 * to allies inside it. Wordings the rules layer cannot express - "advantage on
 * saving throws against effects that turn Undead" (Marshal Undead 2014, Turning
 * Defiance) - emit nothing, as does "while not Incapacitated": nothing native
 * gates a region on its owner's condition.
 */
export default class AllyBuffAura extends DDBEnricherData {

  /** The monster feature parser's raw trait text; the document description is not built yet. */
  get traitText(): string {
    const parser = this.ddbParser as { strippedHtml?: string; html?: string } | undefined;
    return parser?.strippedHtml
      ?? parser?.html
      ?? ((this.document?.system?.description?.value ?? "") as string);
  }

  get isAdvantageAura(): boolean {
    return (/advantage on attack rolls and saving throws/i).test(this.traitText);
  }

  get isConditionImmunityAura(): boolean {
    return (/immunity to the charmed and frightened conditions/i).test(this.traitText);
  }

  /** Only the monster's undead allies benefit ("Undead creatures of Lord Soth's choice"). */
  get undeadOnly(): boolean {
    return (/undead creatures of/i).test(this.traitText);
  }

  get radius(): string {
    const match = this.traitText.match(/(\d+)-foot Emanation|within (\d+) feet/i);
    return match?.[1] ?? match?.[2] ?? "10";
  }

  override get type(): IDDBActivityType | null {
    if (!this.isAdvantageAura && !this.isConditionImmunityAura) return null;
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    if (!this.isAdvantageAura && !this.isConditionImmunityAura) return {};
    const types = this.undeadOnly ? ["undead" as TCreatureTypes] : [];
    return {
      name: "Aura",
      activationType: "special",
      targetType: "ally",
      data: {
        target: {
          override: true,
          affects: {
            type: "ally",
          },
          template: {
            count: "1",
            contiguous: false,
            type: "radius",
            size: this.radius,
            units: "ft",
          },
        },
        behaviors: [
          this.isAdvantageAura
            ? DDBEnricherData.BehaviorHelper.applyEffect({
              effects: this.data.name,
              types,
            })
            : DDBEnricherData.BehaviorHelper.applyEffect({
              effects: [SRDEffects.conditionImmunity("charmed"), SRDEffects.conditionImmunity("frightened")],
              types,
            }),
        ],
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    if (!this.isAdvantageAura) return [];
    return [
      {
        name: this.data.name,
        standalone: true,
        changes: [
          DDBEnricherData.ChangeHelper.ruleAdvantageChange("attack"),
          DDBEnricherData.ChangeHelper.ruleAdvantageChange("save"),
        ],
        options: {
          description: `Advantage on attack rolls and saving throws while inside the ${this.data.name} emanation; it does not apply while the source is Incapacitated.`,
        },
      },
    ];
  }

}
