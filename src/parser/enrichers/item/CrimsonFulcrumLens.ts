import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Crimson Fulcrum Lens: while attuned, +1 to attack rolls (all of them; damage is not boosted).
 * DDB carries it as a "magic" bonus on a wondrous item, which the parser has nowhere to put.
 */
export default class CrimsonFulcrumLens extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Crimson Fulcrum Lens",
        changes: ["mwak", "rwak", "msak", "rsak"].map((type) =>
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, `system.bonuses.${type}.attack`),
        ),
        options: {
          transfer: true,
          durationSeconds: null,
          expiry: null,
          description: "+1 bonus to attack rolls while you are attuned to the lens.",
        },
      },
    ];
  }

}
