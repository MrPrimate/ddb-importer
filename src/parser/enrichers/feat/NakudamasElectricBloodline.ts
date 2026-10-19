import DDBEnricherData from "../data/DDBEnricherData";
import Generic from "./Generic";

/**
 * Nakudama's Electric Bloodline: the tongue's damage die grows with character level (d6, then d8
 * at 5th, d10 at 11th, d12 at 17th). DDB's tongue actions carry the die for the character's
 * current level, so the feat holds a dice scale and both tongue attacks roll it. DDB sends no
 * modifier for the lightning resistance.
 */
export default class NakudamasElectricBloodline extends Generic {

  static SCALE_IDENTIFIER = "tongue";

  get tongueFormula(): string {
    return `@scale.${this.parentIdentifier}.${NakudamasElectricBloodline.SCALE_IDENTIFIER} + @mod`;
  }

  override get additionalAdvancements(): I5eAdvancement[] {
    return [
      DDBEnricherData.AdvancementBuilder.buildDiceScale({
        name: "Electric Tongue",
        identifier: NakudamasElectricBloodline.SCALE_IDENTIFIER,
        scale: {
          1: { number: 1, faces: 6 },
          5: { number: 1, faces: 8 },
          11: { number: 1, faces: 10 },
          17: { number: 1, faces: 12 },
        },
      }),
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Electric Bloodline: Lightning Resistance",
        options: {
          transfer: true,
        },
        changes: [
          DDBEnricherData.ChangeHelper.damageResistanceChange("lightning"),
        ],
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      func: ({ enricher }) => {
        const activities = enricher.data.system.activities as Record<string, I5eActivity>;
        for (const activity of Object.values(activities)) {
          if (activity.type !== "attack" || !(activity.name ?? "").startsWith("Electric Tongue")) continue;
          // fresh objects: action-built activities can share their parsed data
          activity.damage = {
            ...activity.damage,
            parts: [
              DDBEnricherData.basicDamagePart({
                customFormula: this.tongueFormula,
                type: "lightning",
              }),
            ],
          };
        }
      },
    };
  }

}
