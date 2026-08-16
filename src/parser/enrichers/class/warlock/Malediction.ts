import DDBEnricherData from "../../data/DDBEnricherData";

interface IMaledictionCurse {
  label: string;
  description: string;
  changes: IActiveEffectChangeData[];
  midiChanges: IActiveEffectChangeData[];
  ac5eChanges: IAC5eActiveEffectChangeData[];
  daeSpecialDurations: TDAESpecialDuration[];
}

type TMaledictionForm = "Action" | "Reaction";

/**
 * The Horned King's Malediction: curse a creature within 60 feet as an action, or as a
 * Reaction when one targets you with an attack roll or a spell, spending a use from a
 * Charisma modifier pool.
 *
 * DDB carries the three curses as description text only, and ships the action, the reaction
 * and the Rot damage roll as three separate actions that the default action match folds on
 * as activities named after those actions. This hub replaces them with one activity per
 * curse in each form, and gathers the free Bestow Curse that Spiteful Curse grants at 6th
 * level so every Malediction option lives on one document.
 */
export default class Malediction extends DDBEnricherData {

  static SPITEFUL_CURSE = "Spiteful Curse";

  static REACTION_CONDITION = "A creature within 60 feet targets you with an attack roll or a spell";

  static RANGE: I5eActivityRange = { value: 60, units: "ft" };

  static activityName(label: string, form: TMaledictionForm): string {
    return `${label} (${form})`;
  }

  get curses(): IMaledictionCurse[] {
    return [
      {
        label: "Agony (Attack)",
        description: "Disadvantage on the next attack roll. Needs midi-qol or automated-conditions-5e; without one of those this effect carries no mechanical change.",
        changes: [],
        midiChanges: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.disadvantage.attack.all"),
        ],
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange("1", 20, "flags.automated-conditions-5e.attack.disadvantage"),
        ],
        daeSpecialDurations: ["turnEnd", "1Attack"],
      },
      {
        label: "Agony (Concentration)",
        description: "Disadvantage on the next Constitution saving throw made to maintain Concentration. Applied to every Constitution save, since the roll mode cannot distinguish a Concentration save from any other.",
        changes: [
          DDBEnricherData.ChangeHelper.disadvantageAbilitySaveChange("con"),
        ],
        midiChanges: [],
        ac5eChanges: [],
        daeSpecialDurations: ["turnEnd", "isSave"],
      },
      {
        label: "Hate (Int)",
        description: "Disadvantage on the next Intelligence saving throw.",
        changes: [
          DDBEnricherData.ChangeHelper.disadvantageAbilitySaveChange("int"),
        ],
        midiChanges: [],
        ac5eChanges: [],
        daeSpecialDurations: ["turnEnd", "isSave"],
      },
      {
        label: "Hate (Wis)",
        description: "Disadvantage on the next Wisdom saving throw.",
        changes: [
          DDBEnricherData.ChangeHelper.disadvantageAbilitySaveChange("wis"),
        ],
        midiChanges: [],
        ac5eChanges: [],
        daeSpecialDurations: ["turnEnd", "isSave"],
      },
      {
        label: "Hate (Cha)",
        description: "Disadvantage on the next Charisma saving throw.",
        changes: [
          DDBEnricherData.ChangeHelper.disadvantageAbilitySaveChange("cha"),
        ],
        midiChanges: [],
        ac5eChanges: [],
        daeSpecialDurations: ["turnEnd", "isSave"],
      },
      {
        label: "Rot",
        description: "The next time this creature takes damage it takes an extra 1d10 Necrotic damage, and it can't regain Hit Points until the end of its next turn. Roll the extra damage with the Rot Damage activity; the block on regaining Hit Points is not automated.",
        changes: [],
        midiChanges: [],
        ac5eChanges: [],
        daeSpecialDurations: ["turnEnd"],
      },
    ];
  }

  curseActivity(curse: IMaledictionCurse, form: TMaledictionForm): IDDBAdditionalActivity {
    return {
      init: {
        name: Malediction.activityName(curse.label, form),
        type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
      },
      build: {
        generateActivation: true,
        generateTarget: true,
        generateRange: true,
        generateUtility: true,
        generateConsumption: false,
        activationOverride: {
          type: form === "Reaction" ? "reaction" : "action",
          value: 1,
          condition: form === "Reaction" ? Malediction.REACTION_CONDITION : "",
        },
      },
      overrides: {
        targetType: "creature",
        addItemConsume: true,
        data: {
          range: Malediction.RANGE,
        },
      },
    };
  }

  get rotDamageActivity(): IDDBAdditionalActivity {
    return {
      init: {
        name: "Rot Damage",
        type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
      },
      build: {
        generateDamage: true,
        generateTarget: true,
        generateRange: true,
        generateActivation: true,
        generateConsumption: false,
        activationOverride: {
          type: "special",
          value: null,
          condition: "The cursed creature takes damage",
        },
        damageParts: [
          DDBEnricherData.basicDamagePart({
            number: 1,
            denomination: 10,
            types: ["necrotic"],
          }),
        ],
      },
      overrides: {
        targetType: "creature",
        noConsumeTargets: true,
        data: {
          range: Malediction.RANGE,
        },
      },
    };
  }

  /**
   * Spiteful Curse grants a free Bestow Curse cast as the Malediction action or Reaction, at
   * 60 feet, for 1 minute, without Concentration. The spell itself is suppressed in
   * FEATURE_SPELLS_IGNORE, so this cast activity is the only route to it.
   */
  get bestowCurseActivity(): IDDBAdditionalActivity {
    return {
      init: {
        name: "Cast Bestow Curse",
        type: DDBEnricherData.ACTIVITY_TYPES.CAST,
      },
      build: {
        generateSpell: true,
        generateConsumption: false,
      },
      overrides: {
        addSpellUuid: "Bestow Curse",
        addItemConsume: true,
        itemConsumeTargetName: Malediction.SPITEFUL_CURSE,
        activationType: "action",
        activationCondition: "Used as the Malediction action or Reaction",
        data: {
          range: Malediction.RANGE,
          duration: {
            value: "1",
            units: "minute",
            concentration: false,
            override: true,
          },
          spell: {
            spellbook: false,
          },
          visibility: {
            identifier: "warlock",
            level: { min: 6, max: null },
          },
        },
      },
    };
  }

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    const [first] = this.curses;
    return {
      name: Malediction.activityName(first.label, "Action"),
      targetType: "creature",
      activationType: "action",
      addItemConsume: true,
      data: {
        range: Malediction.RANGE,
      },
    };
  }

  // the DDB actions (Malediction, Malediction: Reaction, Malediction: Rot Damage) all fold
  // onto this feature by default; the curse activities below replace them
  override get useDefaultAdditionalActivities(): boolean {
    return false;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    const curses = this.curses;
    const [, ...remainingActions] = curses;

    const results: IDDBAdditionalActivity[] = [
      ...remainingActions.map((curse) => this.curseActivity(curse, "Action")),
      ...curses.map((curse) => this.curseActivity(curse, "Reaction")),
      this.rotDamageActivity,
    ];

    if (this.hasClassFeature({ featureName: Malediction.SPITEFUL_CURSE, className: "Warlock" })) {
      results.push(this.bestowCurseActivity);
    }

    return results;
  }

  override get effects(): IDDBEffectHint[] {
    return this.curses.map((curse) => {
      return {
        name: `Malediction: ${curse.label}`,
        activitiesMatch: [
          Malediction.activityName(curse.label, "Action"),
          Malediction.activityName(curse.label, "Reaction"),
        ],
        options: {
          durationSeconds: 6,
          durationRounds: 1,
          description: curse.description,
        },
        daeSpecialDurations: curse.daeSpecialDurations,
        changes: curse.changes,
        midiChanges: curse.midiChanges,
        ac5eChanges: curse.ac5eChanges,
      };
    });
  }

  override get override(): IDDBOverrideData {
    return {
      uses: this._getUsesWithSpent({
        type: "class",
        name: "Malediction",
        max: "max(1, @abilities.cha.mod)",
        period: "lr",
      }),
      descriptionSuffix: `
<section class="secret ddbSecret" id="secret-ddbMalediction">
<p><strong>Implementation Details</strong></p>
<p>Each curse is a separate activity in both its action and Reaction form; use the one you are spending.</p>
<p>Agony and Hate are split by the roll they hamper, so pick the activity for the choice you are making: Agony by attack roll or Concentration save, Hate by mental save.</p>
<p>Agony (Attack) needs midi-qol or automated-conditions-5e; core dnd5e has no attack roll mode to set. Agony (Concentration) applies to every Constitution save, not only Concentration ones.</p>
<p>Rot's extra 1d10 Necrotic damage is the Rot Damage activity. The block on regaining Hit Points is not automated.</p>
<p>At 6th level Spiteful Curse adds the Cast Bestow Curse activity here, which spends that feature's use rather than a Malediction use.</p>
</section>`,
    };
  }

}
