import TurnStartAuraSave from "./TurnStartAuraSave";

/**
 * Juiblex's Foul trait: the parser extracts the save but no template ("within 10 feet" prose), so
 * the emanation's size is supplied here when the text reading finds none; the ooze exemption is the
 * region's excluded creature type.
 */
export default class Foul extends TurnStartAuraSave {

  override get behaviorFilters(): { sizes?: string[]; types?: string[]; excludeTypes?: string[] } {
    return { excludeTypes: ["ooze"] };
  }

  override get radius(): string | null {
    return super.radius ?? "10";
  }

}
