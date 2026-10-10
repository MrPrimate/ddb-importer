import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Opteran: the larval form's String Shot restrains a creature within 15 feet (Dexterity save, DC 8 +
 * Constitution modifier + proficiency bonus), proficiency bonus times per short or long rest. The
 * adult form loses it at 5th or 6th level; the trait cannot tell which form the character is in.
 */
export default class Metamorphosis extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "String Shot (Larval Form)",
      targetType: "creature",
      targetCount: 1,
      activationType: "action",
      addItemConsume: true,
      data: {
        range: { override: true, value: "15", units: "ft" },
        save: {
          ability: ["dex"],
          dc: { calculation: "", formula: "8 + @abilities.con.mod + @prof" },
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "String Shot",
        statuses: ["restrained"],
        options: {
          durationSeconds: 60,
          description: "Restrained. A creature can take an action to make a Strength check against the save DC, freeing itself or a restrained creature within its reach on a success.",
        },
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      uses: { spent: null, max: "@prof", recovery: [{ period: "sr", type: "recoverAll" }] },
    };
  }

}
