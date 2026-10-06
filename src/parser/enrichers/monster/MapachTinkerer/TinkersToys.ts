import _MonsterFeatureSupport from "../Generic/_MonsterFeatureSupport";

/**
 * Four gadgets in one action, each usable once per day. The Nettle Gun's weapon attack became the
 * primary, but the parser gave the gun's save the attack's 1d4 + 2 instead of the 1d10 the spray
 * deals, dropped the Cogwork Bird and read the Flash-bangs' "10 ft." as a radius around the
 * tinkerer. Every gadget is built here, its numbers read from its own text.
 */
export default class TinkersToys extends _MonsterFeatureSupport {

  static LABELS = ["Cogwork Bird", "Flash-bangs", "Nettle Gun", "Grease Balloon"];

  option(label: string): string {
    return this.optionText(label, TinkersToys.LABELS) ?? "";
  }

  /** "the tinkerer can use each one no more than once per day" */
  get oncePerDay(): boolean {
    return (/\beach one no more than once per day\b/i).test(this.text);
  }

  get dailyUses(): Partial<I5eActivity> {
    return this.oncePerDay
      ? { uses: { spent: 0, max: "1", recovery: [{ period: "day", type: "recoverAll", formula: "" }] } } as Partial<I5eActivity>
      : {};
  }

  /** A gadget the tinkerer uses as its action, spending that gadget's daily use. */
  gadget(extra: IDDBAdditionalActivity | null, { effect = false } = {}): IDDBAdditionalActivity | null {
    if (!extra) return null;
    extra.build = {
      ...extra.build,
      activationOverride: { type: "action", value: 1, condition: "" },
      ...(this.oncePerDay ? { generateUses: true, usesOverride: this.dailyUses.uses } : {}),
    };
    extra.overrides = {
      noConsumeTargets: true,
      ...(this.oncePerDay ? { addActivityConsume: true } : {}),
      ...(effect ? {} : { noeffect: true }),
    };
    return extra;
  }

  override get clearAutoEffects(): boolean {
    return true;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Nettle Gun",
      primaryOnly: true,
      // no targetType: on a weapon attack it would replace the weapon's range with "self"
      noTemplate: true,
      ...(this.oncePerDay ? { addActivityConsume: true, data: this.dailyUses } : {}),
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    const activities: (IDDBAdditionalActivity | null)[] = [];

    const bird = this.option("Cogwork Bird");
    if (bird) {
      const range = bird.match(/within (\d+) feet/i)?.[1];
      activities.push(this.gadget(this.extra("Cogwork Bird", "ddbCogworkBird01", "utility", {
        targetOverride: _MonsterFeatureSupport.targetWith({ type: "creature", count: "1" }),
        ...(range ? { rangeOverride: { value: range, units: "ft", special: "" } as I5eActivityRange } : {}),
      })));
    }

    const flash = this.option("Flash-bangs");
    const flashSave = this.sentences(flash).find((sentence) => (/saving throw/i).test(sentence));
    if (flashSave) {
      const size = flash.match(/within (\d+) (?:ft\.?|feet) of the target space/i)?.[1];
      const range = flash.match(/up to (\d+) (?:ft\.?|feet) away/i)?.[1];
      activities.push(this.gadget(this.saveExtra("Flash-bangs", "ddbFlashBangs001", flashSave, {
        targetOverride: _MonsterFeatureSupport.targetWith({ type: "creature" }, size ? { type: "sphere", size } : null),
        ...(range ? { rangeOverride: { value: range, units: "ft", special: "" } as I5eActivityRange } : {}),
      }), { effect: true }));
    }

    // the spray hits everyone around the gun's target whether the shot hits or not
    const nettle = this.option("Nettle Gun");
    const spray = this.sentences(nettle).find((sentence) => (/saving throw/i).test(sentence));
    if (spray) {
      const size = spray.match(/within (\d+) (?:ft\.?|feet) of the target/i)?.[1];
      activities.push(this.saveExtra("Nettle Spray", "ddbNettleSpray01", spray, {
        activationOverride: { type: "special", value: null, condition: "When the tinkerer fires the Nettle Gun." },
        targetOverride: _MonsterFeatureSupport.targetWith({ type: "creature" }, size ? { type: "radius", size } : null),
      }));
    }

    const grease = this.option("Grease Balloon");
    const greaseSave = this.sentences(grease).find((sentence) => (/saving throw/i).test(sentence));
    if (greaseSave) {
      const size = grease.match(/(\d+)-foot by \d+-foot area/i)?.[1];
      const range = grease.match(/up to (\d+) feet away/i)?.[1];
      activities.push(this.gadget(this.saveExtra("Grease Balloon", "ddbGreaseBalloon", greaseSave, {
        targetOverride: _MonsterFeatureSupport.targetWith({ type: "creature" }, size ? { type: "square", size } : null),
        ...(range ? { rangeOverride: { value: range, units: "ft", special: "" } as I5eActivityRange } : {}),
      }), { effect: true }));
    }

    return activities.filter((activity): activity is IDDBAdditionalActivity => activity !== null);
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Blinded",
        statuses: ["Blinded"],
        activityMatch: "Flash-bangs",
        options: { expiry: "sourceStart" },
      },
      {
        name: "Prone",
        statuses: ["Prone"],
        activityMatch: "Grease Balloon",
        options: { expiry: null, durationSeconds: null },
      },
    ];
  }

}
