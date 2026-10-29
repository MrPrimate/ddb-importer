import DDBEnricherData from "../../data/DDBEnricherData";
import { stripBlock } from "../../monster/Generic/_ZoneText";

/**
 * Species traits granting resistance or immunity to falling damage (Pneumatised and Feathered:
 * "As long as you are not Incapacitated"), read from the trait's own text as a passive dnd5e 6.1
 * `falling` damage trait; nothing before 6.1.
 */
export default class FallingResistance extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    const text = stripBlock(this.data.system?.description?.value ?? "");
    const changes = DDBEnricherData.ChangeHelper.fallingDamageChanges(text);
    if (changes.length === 0) return [];
    return [{ name: this.data.name, options: { transfer: true }, changes }];
  }

}
