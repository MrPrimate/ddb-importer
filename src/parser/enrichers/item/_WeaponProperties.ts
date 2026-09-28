import DDBEnricherData from "../data/DDBEnricherData";
import type DDBItem from "../../item/DDBItem";
import { itemText, itemUses } from "./_ItemActivities";

/**
 * Base for a weapon whose properties are built by hand. The parser's generic save rider, its
 * "Restricted Attack" modes and its auto status effect (linked to every activity) describe these
 * weapons badly, so they are all replaced by the subclass's own activities and effects; the weapon
 * attack itself stays.
 */
export default abstract class WeaponProperties extends DDBEnricherData {

  /** The item's rules text, markup stripped. */
  get text(): string {
    return itemText(this);
  }

  /** The record name DDB gives this variant, e.g. "Will of the Talon (Awakened)". */
  get recordName(): string {
    return this.ddbParser?.originalName ?? this.name;
  }

  /**
   * The stage of a staged artifact: 0 dormant, 1 awakened, 2 exalted. DDB's unsuffixed record
   * carries the exalted text, so it reads as exalted.
   */
  get stage(): number {
    const match = (/\((Dormant|Awakened|Exalted)\)\s*$/i).exec(this.recordName);
    return match ? ["dormant", "awakened", "exalted"].indexOf(match[1].toLowerCase()) : 2;
  }

  /** Clears the item uses the parser reads from a property's own "until the next dawn" limit. */
  get noItemUses(): IDDBOverrideData {
    return { uses: { spent: 0, max: "", recovery: [] } };
  }

  /**
   * Item uses for charges the text states but DDB's record leaves out ("The teeth have 4 charges
   * ... regain all expended charges at dawn"); an empty override when DDB already carries them.
   */
  get textCharges(): IDDBOverrideData {
    const parser = this.ddbParser as { data?: { system?: { uses?: { max?: string | number | null } } } } | undefined;
    if (parser?.data?.system?.uses?.max) return {};
    const count = (/\bha(?:s|ve) (\d+) charges\b/i).exec(this.text)?.[1];
    if (!count) return {};
    return itemUses(this, count, [{ period: "dawn", type: "recoverAll" }]);
  }

  // a "Varies" parent DDB types as a wondrous item or ammunition parses a stray save or utility
  // as its primary; only a weapon record has an attack to keep
  override get stopDefaultActivity(): boolean {
    return !["weapon", "staff"].includes((this.ddbParser as DDBItem | undefined)?.parsingType ?? "");
  }

  override get clearAutoEffects(): boolean {
    return true;
  }

  override get addAutoAdditionalActivities(): boolean {
    return false;
  }

  override get activity(): IDDBActivityData {
    return { noeffect: true };
  }

}
