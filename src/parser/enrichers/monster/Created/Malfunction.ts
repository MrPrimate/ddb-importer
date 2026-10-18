import _MonsterFeatureSupport from "../Generic/_MonsterFeatureSupport";

/**
 * A recharge action that rolls 1d4 for one of four effects. The parser split the three saves out
 * but only the first spent the recharge, read "each creature within 10 feet" as a 10 ft range with
 * no area, and lost Melting Plastic's slowing rider. The primary now spends the recharge and rolls
 * the table; each result is its own activity, used for free. Haywire marks the created berserk for
 * the minute it rolls Berserk regardless of Bloodied.
 */
export default class Malfunction extends _MonsterFeatureSupport {

  static LABELS = ["1: Insect Hive", "2: Melting Plastic", "3: Electrical Discharge", "4: Haywire"];

  option(label: string): string {
    return this.optionText(label, Malfunction.LABELS) ?? "";
  }

  area(text: string): { type: string; size: string } | null {
    const cone = text.match(/(\d+)-foot Cone/i)?.[1];
    if (cone) return { type: "cone", size: cone };
    const within = text.match(/each creature within (\d+) feet/i)?.[1];
    if (within) return { type: "radius", size: within };
    return null;
  }

  override get type(): IDDBActivityType {
    return "utility";
  }

  override get clearAutoEffects(): boolean {
    return true;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Malfunction",
      targetType: "self",
      rangeSelf: true,
      noTemplate: true,
      data: {
        roll: { formula: "1d4", name: "Malfunction Effect", visible: true, prompt: false },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    const activities: IDDBAdditionalActivity[] = [];
    Malfunction.LABELS.forEach((label, index) => {
      const text = this.option(label);
      if (!text) return;
      const [roll, name] = label.split(/:\s*/);
      const id = `ddbMalfunctionO${index + 1}`;
      const activationOverride: I5eActivityActivation = {
        type: "special",
        value: null,
        condition: `On a Malfunction roll of ${roll}.`,
      };
      const save = this.saveExtra(name, id, text, {
        activationOverride,
        targetOverride: _MonsterFeatureSupport.targetWith({ type: "creature" }, this.area(text)),
        rangeOverride: { units: "self" },
      });
      if (save) {
        // only the saves with a rider keep their effect link
        save.overrides = { noConsumeTargets: true, ...((/condition|Speed is halved/i).test(text) ? {} : { noeffect: true }) };
        activities.push(save);
      } else {
        const utility = this.extra(name, id, "utility", {
          activationOverride,
          targetOverride: _MonsterFeatureSupport.targetWith({ type: "self" }),
          rangeOverride: { units: "self" },
        });
        // Haywire applies its minute of berserk rolls to the created itself
        utility.overrides = { noConsumeTargets: true };
        activities.push(utility);
      }
    });
    return activities;
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Insect Hive: Poisoned",
        statuses: ["Poisoned"],
        activityMatch: "Insect Hive",
        options: { expiry: "targetStart" },
      },
      {
        name: "Melting Plastic: Slowed",
        activityMatch: "Melting Plastic",
        options: {
          expiry: "targetEnd",
          description: "Speed is halved, can't take Reactions, and can take either an action or a Bonus Action on its turn, not both.",
        },
        changes: [
          _MonsterFeatureSupport.ChangeHelper.movementMultiplierChange("0.5", 20),
        ],
        midiChanges: [
          _MonsterFeatureSupport.ChangeHelper.midiNoReactionsChange(),
        ],
        ac5eChanges: [
          _MonsterFeatureSupport.ChangeHelper.ac5eNoReactionsChange(),
        ],
      },
      {
        name: "Haywire: Berserk",
        activityMatch: "Haywire",
        options: {
          durationSeconds: 60,
          description: "Berserk for 1 minute: rolls for the Berserk trait each round, whether or not it is Bloodied.",
        },
      },
    ];
  }

}
