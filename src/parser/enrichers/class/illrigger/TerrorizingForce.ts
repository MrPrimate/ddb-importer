import { utils } from "../../../../lib/_module";
import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Every weapon hit deals an extra 1d8 of the chosen type, so this is a passive weapon damage
 * bonus rather than an activity. One effect per damage type; the chosen one is enabled and the
 * rest can be swapped to after a long rest. Infernal Majesty adds the second 1d8.
 */
export default class TerrorizingForce extends DDBEnricherData {

  static DAMAGE_TYPES = ["cold", "fire", "necrotic", "poison"];

  get chosenDamageType(): string | null {
    const label = this.ddbParser._chosen?.find((c) =>
      TerrorizingForce.DAMAGE_TYPES.includes((c.label ?? "").toLowerCase()),
    )?.label;
    return label ? label.toLowerCase() : null;
  }

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  override get clearAutoEffects(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    const chosen = this.chosenDamageType;
    return TerrorizingForce.DAMAGE_TYPES.map((type) => ({
      name: `Terrorizing Force: ${utils.capitalize(type)}`,
      options: {
        transfer: true,
        disabled: chosen !== type,
      },
      changes: [
        DDBEnricherData.ChangeHelper.unsignedAddChange(`1d8[${type}]`, 20, "system.rolls.damage.mwak.bonus"),
        DDBEnricherData.ChangeHelper.unsignedAddChange(`1d8[${type}]`, 20, "system.rolls.damage.rwak.bonus"),
      ],
    }));
  }

}
