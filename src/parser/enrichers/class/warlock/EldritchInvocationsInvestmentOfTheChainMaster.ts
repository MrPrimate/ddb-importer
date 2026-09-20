import Generic from "../Generic";

/**
 * Investment of the Chain Master changes the familiar Find Familiar calls: it gains a flying or a
 * swimming speed of 40 feet and uses the warlock's spell save DC. The dnd5e SRD pack offers that
 * as two open summons of a CR 0 beast, each carrying the speed as an effect on the summoned
 * creature. The Quick Attack and Resistance actions DDB lists are still built by the Generic
 * fallback this extends.
 */
export default class EldritchInvocationsInvestmentOfTheChainMaster extends Generic {

  static FAMILIARS = [
    { name: "Find Familiar with Flight", effect: "Investment of Flight", speed: "fly" },
    { name: "Find Familiar with Swimming", effect: "Investment of Swimming", speed: "swim" },
  ];

  /** The Generic fallback builds only the DDB-matched actions unless its own additions are asked for. */
  override get addToDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    // the same-named DDB actions run through this enricher too and must not repeat the summons
    if (this.isAction) return [];
    return EldritchInvocationsInvestmentOfTheChainMaster.FAMILIARS.map((familiar): IDDBAdditionalActivity => ({
      init: {
        name: familiar.name,
        type: Generic.ACTIVITY_TYPES.SUMMON,
      },
      build: {
        generateSummon: true,
        generateActivation: true,
        activationOverride: {
          type: "hour",
          value: 1,
          condition: "",
        },
      },
      overrides: {
        noTemplate: true,
        data: {
          summon: {
            mode: "cr",
            prompt: true,
          },
          match: {
            saves: true,
            disposition: true,
          },
          creatureTypes: ["celestial", "fey", "fiend"],
          profiles: [
            { name: "CR 0 Beast", count: "1", cr: "0", types: ["beast"] },
          ],
        },
      },
    }));
  }

  override get effects(): IDDBEffectHint[] {
    if (this.isAction) return [];
    return EldritchInvocationsInvestmentOfTheChainMaster.FAMILIARS.map((familiar) => ({
      name: familiar.effect,
      activityMatch: familiar.name,
      options: {
        durationSeconds: null,
        description: `The familiar has a ${familiar.speed === "fly" ? "Fly" : "Swim"} Speed of 40 feet.`,
      },
      changes: [
        Generic.ChangeHelper.upgradeChange("40", 20, `system.attributes.movement.${familiar.speed}`),
      ],
    }));
  }

}
