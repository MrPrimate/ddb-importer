import DDBEnricherData from "../../data/DDBEnricherData";
import type DDBMonsterFeature from "../../../monster/features/DDBMonsterFeature";

type TVestigeForm = "Celestial" | "Fiend" | "Undead";

/**
 * Shared base for the Vestige Patron companion actors' features. The companion parse builds one
 * actor per form ("Vestige Companion (Celestial)") from a stat block that covers all three, so the
 * form-specific parts are picked here from the actor name.
 */
export default abstract class _VestigeCompanionForm extends DDBEnricherData {

  /** Vestige's Strike damage type for each form. */
  static DAMAGE_TYPES: Record<TVestigeForm, string> = {
    Celestial: "radiant",
    Fiend: "fire",
    Undead: "necrotic",
  };

  /** The companion's form, read from the actor name the companion parse gives each type. */
  get form(): TVestigeForm | null {
    const name = (this.ddbParser as DDBMonsterFeature).ddbMonster?.npc?.name ?? "";
    const match = name.match(/\((Celestial|Fiend|Undead)\)/);
    return match ? match[1] as TVestigeForm : null;
  }

}
