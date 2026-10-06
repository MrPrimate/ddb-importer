import _MonsterFeatureSupport from "../Generic/_MonsterFeatureSupport";

interface ILanternBlast {
  name: string;
  ability: string;
  sentence: string;
}

/**
 * The 2014 printing states the DC once ("The DC for all saving throws is 18") and then names each
 * blast's save without one, so no save was parsed and the feature imported as a single damage
 * roll of two of the six blasts. Each blast becomes its own save here, as the 2024 printing (which
 * the parser already splits, one labelled save per blast) imports.
 */
export default class LanternBlast extends _MonsterFeatureSupport {

  static ABILITY = /(Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma) saving throw/i;

  get sharedDc(): string | null {
    return this.text.match(/\bDC for all saving throws is (\d+)/i)?.[1] ?? null;
  }

  get blasts(): ILanternBlast[] {
    if (!this.is2014 || !this.sharedDc) return [];
    const blasts: ILanternBlast[] = [];
    for (const match of this.text.matchAll(/\b([A-Z][a-z]+ Blast)\.\s+([^.]*?saving throw[^.]*\.)/g)) {
      const ability = match[2].match(LanternBlast.ABILITY)?.[1];
      if (ability) blasts.push({ name: match[1], ability: ability.slice(0, 3).toLowerCase(), sentence: match[2] });
    }
    return blasts;
  }

  // the monster parser skips its primary on a "none" type; each blast is built below instead
  override get type(): IDDBActivityType | null {
    return this.blasts.length > 0 ? "none" : null;
  }

  get halfOnSave(): boolean {
    return (/On a successful save, the target takes half as much damage/i).test(this.text);
  }

  static blastId(index: number): string {
    return `ddbLanternBlast${index}`;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    const dc = this.sharedDc;
    if (!dc) return [];
    const activities: IDDBAdditionalActivity[] = [];
    this.blasts.forEach((blast, index) => {
      // "... or take 35 (10d6) fire damage, and catches fire; until someone takes an action to douse
      // the fire, the target takes 35 (10d6) fire damage at the start of each of its turns"
      const [now, later] = blast.sentence.split(/;\s*(?=[^;]*\bat the (?:start|end) of each\b)/i);
      const extra = this.saveExtra(blast.name, LanternBlast.blastId(index), now, {
        activationOverride: { type: "action", value: 1, condition: "" },
        onSave: this.halfOnSave ? "half" : "none",
        rangeOverride: { value: "120", units: "ft", special: "" } as I5eActivityRange,
      }, { ability: [blast.ability], dc: { calculation: "", formula: dc } });
      if (!extra) return;
      // the blasts that impose a condition link it by name
      if (["Forceful Blast", "Blinding Blast"].includes(blast.name)) extra.overrides = { noConsumeTargets: true };
      activities.push(extra);
      if (later) {
        activities.push(this.extra(`${blast.name}: Burning`, "ddbLanternBurn01", "damage", {
          generateDamage: true,
          damageParts: this.damageTokens(later).map((token) => token.part),
          activationOverride: { type: "turnStart", value: null, condition: later.replace(/\.$/, "") },
        }));
      }
    });
    return activities;
  }

  override get effects(): IDDBEffectHint[] {
    if (this.blasts.length === 0) return [];
    return [
      {
        name: "Prone",
        statuses: ["Prone"],
        activityMatch: "Forceful Blast",
        options: { expiry: null, durationSeconds: null },
      },
      {
        name: "Blinded",
        statuses: ["Blinded"],
        activityMatch: "Blinding Blast",
        options: { durationSeconds: 60 },
      },
    ];
  }

}
