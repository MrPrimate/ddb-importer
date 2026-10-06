import _MonsterFeatureSupport from "../Generic/_MonsterFeatureSupport";

/**
 * Three weapons in one action: a lightning flail whose hit arcs to other creatures, a cone of
 * burning acid, and a cannon blast. The parser made the flail's attack the primary but gave it the
 * cannon's bludgeoning and the cone's area, folded the acid's later burn into the cone's save, gave
 * the arc the flail's hit damage, and placed the cannon as a radius around the engine. The two
 * printings differ in the attack bonus and the cannon's thunder dice, so every number is read from
 * the option's own text.
 */
export default class HellfireWeapons extends _MonsterFeatureSupport {

  static LABELS = ["Bonemelt Sprayer", "Lightning Flail", "Thunder Cannon"];

  option(label: string): string {
    return this.optionText(label, HellfireWeapons.LABELS) ?? "";
  }

  saveSentence(text: string): string | undefined {
    return this.sentences(text).find((sentence) => (/saving throw/i).test(sentence));
  }

  static ACTION: I5eActivityActivation = { type: "action", value: 1, condition: "" } as I5eActivityActivation;

  override get activity(): IDDBActivityData {
    const hit = this.option("Lightning Flail").match(/Hit:[^.]*\./)?.[0] ?? "";
    // the weapon's base damage is the flail's bludgeoning; what follows it in the hit is added
    const added = this.damageTokens(hit).slice(1).map((token) => token.part);
    return {
      name: "Lightning Flail",
      primaryOnly: true,
      // no targetType: on a weapon attack it would replace the weapon's range with "self"
      noTemplate: true,
      removeDamageParts: true,
      damageParts: added,
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    const activities: (IDDBAdditionalActivity | null)[] = [];

    const sprayer = this.option("Bonemelt Sprayer");
    const spray = this.saveSentence(sprayer);
    if (spray) {
      const cone = sprayer.match(/(\d+)-foot cone/i)?.[1];
      activities.push(this.saveExtra("Bonemelt Sprayer", "ddbBonemeltSpray", spray, {
        activationOverride: HellfireWeapons.ACTION,
        targetOverride: _MonsterFeatureSupport.targetWith({ type: "creature" }, cone ? { type: "cone", size: cone } : null),
        rangeOverride: { value: "", units: "self", special: "" } as unknown as I5eActivityRange,
      }));
      // "Creatures that fail the saving throw are drenched in burning acid and take ... at the end of their turns"
      const burn = this.sentences(sprayer).find((sentence) => (/\bat the (?:start|end) of (?:their|its) turns?\b/i).test(sentence));
      if (burn) {
        activities.push(this.extra("Burning Acid", "ddbBonemeltBurn1", "damage", {
          generateDamage: true,
          damageParts: this.damageTokens(burn).map((token) => token.part),
          activationOverride: { type: "turnEnd", value: null, condition: burn.replace(/\.$/, "") },
        }));
      }
    }

    const arc = this.saveSentence(this.option("Lightning Flail"));
    if (arc) {
      const count = arc.match(/\bUp to (\w+) other creatures\b/i)?.[1]?.toLowerCase();
      const counts: Record<string, string> = { one: "1", two: "2", three: "3", four: "4", five: "5" };
      activities.push(this.saveExtra("Lightning Arc", "ddbLightningArc1", arc, {
        activationOverride: { type: "special", value: null, condition: "When the hellfire engine attacks with the Lightning Flail." },
        targetOverride: _MonsterFeatureSupport.targetWith({ type: "creature", count: counts[count ?? ""] ?? count ?? "", choice: true }),
      }));
    }

    const cannon = this.option("Thunder Cannon");
    const blast = this.saveSentence(cannon);
    if (blast) {
      const size = blast.match(/within (\d+) feet of that point/i)?.[1];
      const range = cannon.match(/a point within (\d+) feet of it/i)?.[1];
      activities.push(this.saveExtra("Thunder Cannon", "ddbThunderCannon", blast, {
        activationOverride: HellfireWeapons.ACTION,
        targetOverride: _MonsterFeatureSupport.targetWith({ type: "creature" }, size ? { type: "sphere", size } : null),
        ...(range ? { rangeOverride: { value: range, units: "ft", special: "" } as I5eActivityRange } : {}),
      }));
    }

    return activities.filter((activity): activity is IDDBAdditionalActivity => activity !== null);
  }

}
