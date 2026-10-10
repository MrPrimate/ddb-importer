/**
 * The die a College of the Road trick rolls. The original printing spends and rolls the Bard's
 * Bardic Inspiration die; the reprint on the 2024 Bard has its own Traveler's Tricks scale. Both
 * printings carry the same 2014 source, so the Bard's ruleset decides.
 */
export function travelersTrickDie(isBard2014: boolean): string {
  return isBard2014 ? "@scale.bard.inspiration" : "@scale.road.travelers-tricks";
}
