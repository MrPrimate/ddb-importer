import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * The importer-built Illusory Dragon summon. Used from the dragon token when it
 * appears: every enemy that can see it makes the Wisdom save and is Frightened on
 * a failure. The summon activity's "match saves" links the DC to the caster. The
 * line-of-sight repeat save and the 2024 dropped-items rider stay manual.
 */
export default class FrightfulAppearance extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get clearAutoEffects(): boolean {
    return true;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "enemy",
      activationType: "special",
      activationCondition: "When the dragon appears, any enemy that can see it",
      data: {
        range: {
          units: "spec",
        },
        save: {
          ability: ["wis"],
          dc: {
            calculation: "spellcasting",
            formula: "",
          },
        },
        damage: {
          parts: [],
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Frightened by Illusory Dragon",
        statuses: ["Frightened"],
        options: { durationSeconds: 60 },
      },
    ];
  }

}
