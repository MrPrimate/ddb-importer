import DDBEnricherData from "../data/DDBEnricherData";

/**
 * The very rare flaymefrower breathes one gout per use: a DC 16 Dexterity save for 4d6 in a
 * 10-foot cone or a 5-foot-wide, 20-foot-long line, the choice made by the command word.
 * "Coldfire Flame" is a bonus-action toggle that makes the flame cold instead of fire, so DDB's
 * fire and cold modifiers are one damage roll of either type, not two rolls. The extra charges
 * that widen the cone or lengthen the line are left to the table.
 */
export default class KobboldFlaymefrowerColdfire extends DDBEnricherData {

  static get breathDamage(): I5eDamagePart {
    return DDBEnricherData.basicDamagePart({ number: 4, denomination: 6, types: ["fire", "cold"] });
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Dragon's Breath (Cone)",
      data: {
        damage: { onSave: "half", parts: [KobboldFlaymefrowerColdfire.breathDamage] },
        target: {
          override: true,
          affects: { type: "creature" },
          template: { count: "1", contiguous: false, type: "cone", size: "10", width: "", height: "", units: "ft" },
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        duplicate: true,
        overrides: {
          id: "kobbFlayLine0001",
          name: "Dragon's Breath (Line)",
          data: {
            damage: { onSave: "half", parts: [KobboldFlaymefrowerColdfire.breathDamage] },
            target: {
              override: true,
              affects: { type: "creature" },
              template: { count: "1", contiguous: false, type: "line", size: "20", width: "5", height: "", units: "ft" },
            },
          },
        },
      },
    ];
  }

}
