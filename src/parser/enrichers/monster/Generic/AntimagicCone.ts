import DDBEnricherData from "../../data/DDBEnricherData";
import { regionPlacerData } from "../../data/RegionBuilders";
import { stripBlock } from "./_ZoneText";

interface IParsedAction {
  html?: string;
  strippedHtml?: string;
}

/**
 * Antimagic Cone (beholders, Astral Dreadnought, Mage Hunter Golem, Woe Strider): "an area of
 * antimagic, as in the antimagic field spell" in a cone from the creature, re-aimed at the start of
 * each of its turns. On dnd5e 6.1 a utility places the cone with the system's antimagic behavior;
 * the GM turns the region to face the new way. Earlier versions have no antimagic behavior and keep
 * the trait as text.
 */
export default class AntimagicCone extends DDBEnricherData {

  get text(): string {
    const parser = (this.ddbParser ?? {}) as IParsedAction;
    return stripBlock(parser.strippedHtml ?? parser.html ?? "");
  }

  get coneSize(): string {
    return (/(\d+)[- ]foot[- ]cone/i).exec(this.text)?.[1] ?? "150";
  }

  get antimagicBehavior(): I5eActivityBehavior | null {
    return DDBEnricherData.BehaviorHelper.antimagic({ name: "Antimagic Cone" });
  }

  override get type(): IDDBActivityType | null {
    return this.antimagicBehavior ? DDBEnricherData.ACTIVITY_TYPES.UTILITY : null;
  }

  override get activity(): IDDBActivityData | null {
    const behavior = this.antimagicBehavior;
    if (!behavior) return null;
    return regionPlacerData("Antimagic Cone", {
      template: { type: "cone", size: this.coneSize },
      activationType: (/bonus action/i).test(this.text) ? "bonus" : "special",
      activationCondition: (/bonus action/i).test(this.text)
        ? ""
        : "At the start of each of its turns, it decides which way the cone faces and whether it is active",
      behaviors: [behavior],
    });
  }

}
