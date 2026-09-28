import _MonsterFeatureSupport from "../Generic/_MonsterFeatureSupport";

interface ISpellfireBenefit {
  label: string;
  description: string;
  changes: IActiveEffectChangeData[];
}

const RIDER_ACTIVITIES = {
  cure: "ddbSpellfireCure",
  revivify: "ddbSpellfireRevi",
  line: "ddbSpellfireLine",
  cone: "ddbSpellfireCone",
  fade: "ddbSpellfireFade",
};

/**
 * Laeral Silverhand's Spellfire: silver fire that lasts until she is incapacitated or quenches it,
 * granting one benefit of her choice and a set of extra actions while it burns.
 *
 * The action is a self enchantment with one profile per benefit, so dnd5e asks which benefit on
 * use. Each profile brings in its benefit as a rider effect (only the cold resistance changes her
 * data; the other three are descriptive) and the extra actions as rider activities, which are
 * only offered while the fire burns. While active the action becomes "Quench Spellfire", as using
 * a self enchantment again removes it. The extra actions each end with a d6 roll to see if the
 * fire goes out, which the "Silver Fire Fades" roll covers.
 */
export default class Spellfire extends _MonsterFeatureSupport {

  get benefits(): ISpellfireBenefit[] {
    const C = _MonsterFeatureSupport.ChangeHelper;
    return [
      { label: "Water Breathing", description: "She can breathe underwater.", changes: [] },
      { label: "Sustenance", description: "She can survive without food and water.", changes: [] },
      {
        label: "Mind Shield",
        description: "She is immune to magic that would ascertain her thoughts, truthfulness, alignment, or creature type.",
        changes: [],
      },
      {
        label: "Cold Resistance",
        description: "She gains resistance to cold damage, and she is unharmed by temperatures as low as -50 degrees Fahrenheit.",
        changes: [C.damageResistanceChange("cold")],
      },
    ];
  }

  get fireSave(): I5eActivitySave {
    return this.save() ?? { ability: ["dex"], dc: { calculation: "", formula: "21" } };
  }

  get fireDamage(): I5eDamagePart {
    return this.damageTokens(this.text).find((token) => (/fire/i).test(JSON.stringify(token.part.types)))?.part
      ?? _MonsterFeatureSupport.basicDamagePart({ number: 4, denomination: 12, type: "fire" });
  }

  override get type(): IDDBActivityType | null {
    return _MonsterFeatureSupport.ACTIVITY_TYPES.ENCHANT;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Spellfire",
      targetSelf: true,
      rangeSelf: true,
      noTemplate: true,
      removeDamageParts: true,
      data: {
        enchant: { self: true },
        duration: { override: true, value: "", units: "spec", concentration: false } as I5eActivityDuration,
      },
    };
  }

  // the parser's save and heal are rebuilt here as actions offered only while the fire burns
  override get addAutoAdditionalActivities(): boolean {
    return false;
  }

  /** An extra action taken while the silver fire burns. */
  riderAction(name: string, id: string, type: IDDBActivityType, fades: string, build: IDDBActivityBuild): IDDBAdditionalActivity {
    return this.extra(name, id, type, {
      activationOverride: {
        type: "action",
        value: 1,
        condition: `While the silver fire is present. Afterwards roll a d6: on ${fades} the silver fire disappears.`,
      },
      ...build,
    });
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    const save = this.fireSave;
    const damage = this.fireDamage;
    const area = (template: Record<string, string>) => ({
      affects: { type: "creature" as const, count: "", choice: false, special: "" },
      template: { count: "1", contiguous: false, units: "ft", size: "", width: "", height: "", type: "", ...template },
    }) as I5eActivityTarget;

    return [
      this.riderAction("Cure Wounds", RIDER_ACTIVITIES.cure, "heal", "a 1", {
        generateHealing: true,
        healingPart: _MonsterFeatureSupport.basicDamagePart({ number: 1, denomination: 8, bonus: "5", types: ["healing"] }),
        targetOverride: { affects: { type: "creature", count: "1", choice: false }, template: { type: "" } } as I5eActivityTarget,
        rangeOverride: { units: "touch" },
      }),
      this.riderAction("Revivify", RIDER_ACTIVITIES.revivify, "utility", "a 1-2", {
        targetOverride: { affects: { type: "creature", count: "1", choice: false }, template: { type: "" } } as I5eActivityTarget,
        rangeOverride: { units: "touch" },
      }),
      this.riderAction("Silver Fire Line", RIDER_ACTIVITIES.line, "save", "a 1-3", {
        generateSave: true,
        saveOverride: save,
        generateDamage: true,
        damageParts: [damage],
        onSave: "half",
        targetOverride: area({ type: "line", size: "60", width: "5" }),
        rangeOverride: { units: "self" },
      }),
      this.riderAction("Silver Fire Cone", RIDER_ACTIVITIES.cone, "save", "a 1-3", {
        generateSave: true,
        saveOverride: save,
        generateDamage: true,
        damageParts: [damage],
        onSave: "half",
        targetOverride: area({ type: "cone", size: "30" }),
        rangeOverride: { units: "self" },
      }),
      this.riderAction("Silver Fire Fades", RIDER_ACTIVITIES.fade, "utility", "the listed roll", {
        generateRoll: true,
        rollOverride: { formula: "1d6", name: "Silver Fire Fades", visible: true, prompt: false },
        targetOverride: { affects: { type: "self", count: "1", choice: false }, template: { type: "" } } as I5eActivityTarget,
        rangeOverride: { units: "self" },
        activationOverride: {
          type: "special",
          value: null,
          condition: "After a silver fire action: the fire disappears on a 1 (Cure Wounds), 1-2 (Revivify) or 1-3 (Silver Fire). Quench Spellfire when it does.",
        },
      }),
    ];
  }

  override get effects(): IDDBEffectHint[] {
    const C = _MonsterFeatureSupport.ChangeHelper;
    return this.benefits.flatMap((benefit, index) => {
      const riderId = `ddbSpellfireRdr${index + 1}`;
      const name = `Spellfire: ${benefit.label}`;
      return [
        {
          name,
          changes: benefit.changes,
          // a rider on the feature stays inert until the enchantment copies it onto the item
          options: { transfer: true, durationSeconds: null, expiry: null, description: benefit.description },
          data: { _id: riderId },
        },
        {
          name,
          type: "enchant",
          activityTypesMatch: ["enchant"],
          changes: [
            C.overrideChange("{} (Active)", 10, "name"),
            C.overrideChange("Quench Spellfire", 10, "activities[enchant].name"),
            C.overrideChange("When she is incapacitated, or as an action", 10, "activities[enchant].activation.condition"),
            C.overrideChange("[]", 10, "activities[enchant].consumption.targets"),
          ],
          options: {
            durationSeconds: null,
            description: `${benefit.description} Lasts until Laeral is incapacitated or quenches the silver fire.`,
          },
          data: {
            _id: `ddbSpellfireEnc${index + 1}`,
            flags: {
              ddbimporter: {
                effectRiders: [riderId],
                activityRiders: Object.values(RIDER_ACTIVITIES),
              },
            },
          },
        },
      ];
    });
  }

  // the parser's condition effects would link to the enchantment
  override get clearAutoEffects(): boolean {
    return true;
  }

}
