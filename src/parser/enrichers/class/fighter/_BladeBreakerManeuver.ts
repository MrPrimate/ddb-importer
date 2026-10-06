import DDBDataUtils from "../../../lib/DDBDataUtils";
import DDBEnricherData from "../../data/DDBEnricherData";

interface IBladeBreakerManeuver {
  cost: number;
  type: IDDBActivityType;
  activity: IDDBActivityData;
  additionalActivities?: IDDBAdditionalActivity[];
  effects?: IDDBEffectHint[];
}

/**
 * Blade Breaker maneuvers ("Blade Breaker Maneuvers: <Maneuver>"). Every option document is handed
 * all of its parent's DDB actions, including the shared "Maneuver Points" action and its pool, so
 * each maneuver keeps only its own action and spends the pool on Martial Maneuvers
 * (`maneuver-points`). The maneuvers DDB gives no save, damage or healing are built here instead.
 */
export default class _BladeBreakerManeuver extends DDBEnricherData {

  // Martial Maneuvers: 8 + proficiency + Strength or Dexterity (the fighter's choice); the table
  // holds the higher of the two for the muncher, and saveDc swaps in a character's own choice
  static SAVE_DC = { calculation: "", formula: "8 + @prof + max(@abilities.str.mod, @abilities.dex.mod)" };

  static save(abilities: string[], cost: number, condition: string): IBladeBreakerManeuver {
    return {
      cost,
      type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
      activity: {
        targetType: "creature",
        targetCount: 1,
        activationType: "special",
        activationCondition: condition,
        data: {
          save: { ability: abilities, dc: _BladeBreakerManeuver.SAVE_DC },
        },
      },
    };
  }

  static extraDamage(name: string, cost: number): IDDBAdditionalActivity {
    return {
      init: {
        name,
        type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
      },
      build: {
        generateConsumption: cost > 0,
        generateTarget: true,
        generateDamage: true,
        damageParts: [DDBEnricherData.basicDamagePart({ number: 2, denomination: 6 })],
        activationOverride: { type: "special", value: 1, condition: "You hit with a weapon attack" },
      },
      overrides: cost > 0
        ? { addItemConsume: true, itemConsumeTargetName: "maneuver-points", itemConsumeValue: cost }
        : { noConsumeTargets: true },
    };
  }

  static MANEUVERS: Record<string, IBladeBreakerManeuver> = {
    "Armor-Crushing Blows": {
      ..._BladeBreakerManeuver.save(["dex", "con"], 4, "You hit a creature wearing nonmagical armor (the attack deals no damage)"),
      effects: [{
        name: "Damaged Armor",
        options: { description: "Armor damaged by Armor-Crushing Blows: AC reduced by 2. A second Armor-Crushing Blows destroys it." },
        changes: [DDBEnricherData.ChangeHelper.unsignedAddChange("-2", 20, "system.attributes.ac.bonus")],
      }],
    },
    "Blade Breaking Blow": _BladeBreakerManeuver.save(["str", "dex"], 4, "You hit a creature wielding a nonmagical weapon (the attack deals no damage)"),
    "Disarming Swipe": _BladeBreakerManeuver.save(["str", "dex"], 2, "You hit with a melee attack (the attack deals no damage)"),
    "Iron Tempest": {
      cost: 4,
      type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
      activity: { targetType: "self", activationType: "action" },
      additionalActivities: [_BladeBreakerManeuver.extraDamage("Iron Tempest Damage", 0)],
    },
    "Refusal to Bleed": {
      cost: 1,
      type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
      activity: {
        targetType: "self",
        activationType: "reaction",
        activationCondition: "You take damage",
        data: {
          roll: { prompt: false, visible: true, formula: "1d10 + @classes.fighter.levels", name: "Damage Reduction" },
        },
      },
      additionalActivities: [{
        init: {
          name: "Reduce the Attacker's Damage",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateConsumption: true,
          generateTarget: true,
          activationOverride: {
            type: "special",
            value: 1,
            condition: "The triggering damage was from an attack: reduce all its damage until the start of your next turn",
          },
        },
        overrides: { targetSelf: true, addItemConsume: true, itemConsumeTargetName: "maneuver-points", itemConsumeValue: 3 },
      }],
    },
    "Steely Determination": {
      cost: 1,
      type: DDBEnricherData.ACTIVITY_TYPES.HEAL,
      activity: {
        targetType: "self",
        activationType: "special",
        activationCondition: "You use your Second Wind",
        data: {
          healing: DDBEnricherData.basicDamagePart({ customFormula: "@classes.fighter.levels", types: ["healing"] }),
        },
      },
    },
    "Unstoppable Missile": {
      cost: 2,
      type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
      activity: {
        activationType: "action",
        data: {
          save: { ability: ["dex"], dc: _BladeBreakerManeuver.SAVE_DC },
          target: {
            override: true,
            affects: { type: "creature" },
            template: { type: "line", size: "30", width: "5", units: "ft" },
          },
          range: { override: true, units: "self" },
        },
      },
      additionalActivities: [_BladeBreakerManeuver.extraDamage("Unstoppable Missile: Extra Damage", 1)],
    },
  };

  get maneuverName(): string {
    return this.ddbParser.originalName.replace(/^Blade Breaker Maneuvers:\s*/i, "").trim();
  }

  get maneuver(): IBladeBreakerManeuver | null {
    return _BladeBreakerManeuver.MANEUVERS[this.maneuverName] ?? null;
  }

  /** This maneuver's own DDB actions, preferring the costed "(N points)" one when DDB lists both. */
  override get builtFeaturesFromActionFilters(): string[] {
    const actions = (foundry.utils.getProperty(this.ddbParser, "ddbData.character.actions.class") ?? []) as { name: string }[];
    const maneuver = this.maneuverName.toLowerCase();
    const own = actions.map((action) => action.name).filter((name) => {
      const lower = name.toLowerCase().replace(/^second wind:\s*/, "");
      return lower === maneuver || lower.startsWith(`${maneuver} `) || lower.startsWith(`${maneuver}:`);
    });
    const costed = own.filter((name) => (/\bpoints?\)/i).test(name));
    // a filter list that matches nothing still keeps the shared Maneuver Points action off
    return costed.length > 0 ? costed : own.length > 0 ? own : [this.maneuverName];
  }

  override get type(): IDDBActivityType | null {
    return this.maneuver?.type ?? DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  override get useDefaultAdditionalActivities(): boolean {
    return this.maneuver === null;
  }

  /** The maneuver save DC from the ability the fighter chose for Martial Maneuvers, when the character has chosen. */
  get saveDc(): { calculation: string; formula: string } {
    const ddbData = this.ddbParser?.ddbData;
    const chose = (ability: string) => ddbData !== undefined && ddbData !== null
      && DDBDataUtils.hasChosenCharacterOption(ddbData, `Martial Maneuvers: ${ability}`);
    if (chose("Strength")) return { calculation: "", formula: "8 + @prof + @abilities.str.mod" };
    if (chose("Dexterity")) return { calculation: "", formula: "8 + @prof + @abilities.dex.mod" };
    return { ..._BladeBreakerManeuver.SAVE_DC };
  }

  override get activity(): IDDBActivityData | null {
    const maneuver = this.maneuver;
    if (!maneuver) return null;
    // a copy, so the shared table's save is never written to
    const activity = foundry.utils.deepClone(maneuver.activity);
    const save = (activity.data as Partial<I5eSaveActivity> | undefined)?.save;
    if (save) save.dc = this.saveDc;
    return {
      name: this.maneuverName,
      ...activity,
      addItemConsume: true,
      itemConsumeTargetName: "maneuver-points",
      itemConsumeValue: maneuver.cost,
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return this.maneuver?.additionalActivities ?? [];
  }

  override get effects(): IDDBEffectHint[] {
    return this.maneuver?.effects ?? [];
  }

  // the shared Maneuver Points action brought DDB's whole pool onto every option
  override get override(): IDDBOverrideData {
    return {
      uses: { spent: null, max: "", recovery: [] },
    };
  }

}
