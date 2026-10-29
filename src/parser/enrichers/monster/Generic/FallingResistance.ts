import DDBEnricherData from "../../data/DDBEnricherData";
import { stripBlock } from "./_ZoneText";

interface IParsedAction {
  html?: string;
  strippedHtml?: string;
}

/**
 * Traits granting resistance or immunity to falling damage (the Palaeo Games pneumatised
 * dinosaurs), as a passive dnd5e 6.1 `falling` damage trait; nothing before 6.1.
 */
export default class FallingResistance extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    const parser = (this.ddbParser ?? {}) as IParsedAction;
    const changes = DDBEnricherData.ChangeHelper.fallingDamageChanges(stripBlock(parser.strippedHtml ?? parser.html ?? ""));
    if (changes.length === 0) return [];
    return [{ name: this.data.name, options: { transfer: true }, changes }];
  }

}
