import _MonsterFeatureSupport from "./_MonsterFeatureSupport";

/** Owner-turn auras are rolled by the GM; touching the owner is a separate damage trigger. */
export default class DamageAura extends _MonsterFeatureSupport {
  get aura(): { radius: string; edge: string; parts: I5eDamagePart[] } | null {
    const sentence = this.text.split(/[.!]/).find((s) => (/At the (start|end) of each of .+?'s turns/i).test(s));
    if (!sentence) return null;
    const radius = sentence.match(/(\d+)-foot Emanation/i) ?? sentence.match(/within (\d+) feet of/i);
    const edge = sentence.match(/At the (start|end) of each of .+?'s turns/i);
    // Contact damage is a separate trigger, even when it uses the same dice as the aura.
    const parts = this.damageTokens(sentence).map((p) => p.part);
    return radius && edge && parts.length ? { radius: radius[1], edge: edge[1].toLowerCase(), parts } : null;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    if (!this.aura) return [];
    const contact = this.text.split(/[.!]/).find((s) => (/touches|touching/i).test(s));
    const parts = contact ? this.damageTokens(contact).map((p) => p.part) : [];
    return contact && parts.length
      ? [
        this.extra("Contact Damage", "ddbAuraContact01", "damage", {
          generateDamage: true,
          damageParts: parts,
          activationOverride: { type: "special", value: null, condition: contact.trim() },
          rangeOverride: { units: "ft", value: contact.match(/within (\d+) feet/i)?.[1] ?? "5" },
        }),
      ]
      : [];
  }

  override get type(): IDDBActivityType | null {
    return this.aura ? "damage" : null;
  }

  override get activity(): IDDBActivityData | null {
    const aura = this.aura;
    if (!aura) return null;
    const choice = (/of (?:the \w+|'?its)[^.!]*choice/i).test(this.text);
    return {
      name: "Aura Damage",
      removeDamageParts: true,
      damageParts: aura.parts,
      activationType: aura.edge === "end" ? "turnEnd" : "turnStart",
      noConsumeTargets: true,
      activationCondition: `At the ${aura.edge} of the source monster's turn. Select eligible creatures in the emanation; apply manually.`,
      targetType: "creature",
      targetChoice: choice,
      data: {
        damage: { includeBase: false },
        target: {
          override: true,
          affects: { type: "creature", count: "", choice },
          template: { type: "radius", size: aura.radius, units: "ft" },
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return this.aura && (/start burning/i).test(this.text)
      ? [
        {
          name: "Burning",
          statuses: ["Burning"],
          activityMatch: "Aura Damage",
          options: {
            description: "Apply to creatures and flammable objects in the emanation as described by this aura.",
          },
        },
      ]
      : [];
  }
}
