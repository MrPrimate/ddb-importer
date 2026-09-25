import _MonsterFeatureSupport from "./_MonsterFeatureSupport";

/** Splits a recognised turn-bound damage sentence from the initial attack or saving throw. */
export default class OngoingDamage extends _MonsterFeatureSupport {
  get split(): { initial: I5eDamagePart[]; ongoing: I5eDamagePart[]; condition: string } | null {
    const tokens = this.damageTokens(this.text);
    const ongoing = tokens.filter((token) => {
      const start = this.text.lastIndexOf(".", token.index) + 1;
      const end = this.text.indexOf(".", token.end);
      const sentence = this.text.slice(start, end < 0 ? undefined : end);
      return (/at the (?:start|end) of .{0,100}turn/i).test(sentence);
    });
    if (!ongoing.length) return null;
    const token = ongoing[0];
    const start = this.text.lastIndexOf(".", token.index) + 1;
    const end = this.text.indexOf(".", token.end);
    const condition = this.text.slice(start, end < 0 ? undefined : end).trim();
    return {
      initial: tokens.filter((t) => !ongoing.includes(t)).map((t) => t.part),
      ongoing: ongoing.map((t) => t.part),
      condition,
    };
  }

  override get type(): IDDBActivityType | null {
    return this.split && !this.parser.isAttack && !this.parser.isSave ? "utility" : null;
  }

  override get activity(): IDDBActivityData | null {
    if (!this.split) return null;
    if (this.key === "Create Whirlwind") {
      const cylinder = this.text.match(/(\d+)-foot-radius, (\d+)-foot-high Cylinder/i);
      if (cylinder) return { data: { target: { template: { type: "cylinder", size: cylinder[1], height: cylinder[2], units: "ft" } } } };
    }
    return this.type === "utility" ? { targetType: "creature", targetCount: "1", noTemplate: true } : null;
  }

  get grappleInstead(): boolean {
    return this.key === "Smother" && (/instead of dealing damage/i).test(this.text);
  }

  override get clearAutoEffects(): boolean {
    return this.split !== null;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    const split = this.split;
    if (!split) return [];
    const activities = [
      this.extra("Ongoing Damage", "ddbOngoingDmg001", "damage", {
        generateDamage: true,
        damageParts: split.ongoing,
        activationOverride: {
          type: (/at the end of/i).test(split.condition) ? "turnEnd" : "turnStart",
          value: null,
          condition: `${split.condition} Resolve only for affected creatures; end the conditions manually when released.`,
        },
      }),
    ];
    if (this.grappleInstead) {
      const grapple = this.extra("Grapple Instead", "ddbGrappleAlt001", "utility", {
        activationOverride: {
          type: "special",
          value: null,
          condition:
            "On a hit, apply the grapple instead of dealing the attack's damage. The ongoing damage begins on the turn specified in the description.",
        },
      });
      grapple.overrides = { noConsumeTargets: true };
      activities.push(grapple);
    }
    if (this.key === "Swallow" && (/regurgitat/i).test(this.text)) {
      const clauseStart = this.text.indexOf("If ");
      const clause = clauseStart < 0 ? "" : this.text.slice(clauseStart);
      const save = clauseStart < 0 ? null : this.save(clause);
      if (save && save.ability?.[0] === "con")
        activities.push(
          this.extra("Regurgitate Save", "ddbRegurgitate01", "save", {
            generateSave: true,
            saveOverride: save,
            targetOverride: { affects: { type: "self", count: "1" } },
            rangeOverride: { units: "self" },
            activationOverride: { type: "turnEnd", value: null, condition: clause },
          }),
        );
    }
    if (this.key === "Whelm") {
      const check = this.check();
      if (check)
        activities.push(
          this.extra("Pull Free", "ddbPullFree00001", "check", {
            generateCheck: true,
            checkOverride: check,
            activationOverride: {
              type: "action",
              value: 1,
              condition:
                "A creature within 5 feet uses its action to pull a trapped creature free. On success remove the engulfing conditions.",
            },
          }),
        );
    }
    return activities;
  }

  override get effects(): IDDBEffectHint[] {
    if (!this.split) return [];
    const statuses: string[] = [];
    if (this.key !== "Swallow" && (/grappled|grapple ends/i).test(this.text)) statuses.push("Grappled");
    if ((/restrained/i).test(this.text)) statuses.push("Restrained");
    if ((/blinded/i).test(this.text)) statuses.push("Blinded");
    if ((/total cover/i).test(this.text)) statuses.push("coverTotal");
    if (this.key === "Spores" && (/poisoned/i).test(this.text)) statuses.push("Poisoned");
    // Water breathing exempts some Whelm targets; that condition must be applied individually.
    if ((/suffocat/i).test(this.text) && !(/unless|breathe water/i).test(this.text)) statuses.push("suffocation");
    return statuses.length
      ? [
        {
          name: "Held Conditions",
          statuses,
          activityMatch: "Initial Effect",
          options: { expiry: null, durationSeconds: null, description: this.text },
        },
      ]
      : [];
  }

  override async cleanup(): Promise<void> {
    const split = this.split;
    if (!split) return;
    const primary = this.activities.find(
      (a) => a.type === "attack" || a.type === "save" || (a.type === "utility" && a._id !== "ddbGrappleAlt001"),
    );
    if (!primary) return;
    // Use complete source clauses, so identical initial and tick formulas remain separate occurrences.
    if (primary.type !== "utility") primary.damage = { ...primary.damage, includeBase: false, parts: split.initial };
    const held = (this.document.effects as { _id: string; name: string }[]).filter((e) => e.name === "Held Conditions");
    for (const activity of this.activities) {
      const applies = this.grappleInstead ? activity._id === "ddbGrappleAlt001" : activity === primary;
      activity.effects = applies ? held.map((e) => ({ _id: e._id })) : [];
    }
    // An ongoing token mistaken for weapon base damage must not survive as an alternate attack.
    if (split.initial.length === 0 && this.document.system.damage?.base) {
      this.document.system.damage.base = _MonsterFeatureSupport.basicDamagePart();
    }
  }
}
