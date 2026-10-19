import _DarkGiftFlaw from "./_DarkGiftFlaw";

export default class AberrantAnatomyWarpingFlesh extends _DarkGiftFlaw {

  flaw = {
    ability: "con",
    condition: "Immediately after you roll a 1 on the d20 for a D20 Test",
    effect: {
      name: "Warping Flesh",
      statuses: ["Stunned"],
      options: { expiry: "sourceEnd" as const },
    },
  };

}
