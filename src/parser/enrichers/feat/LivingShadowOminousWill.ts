import _DarkGiftFlaw from "./_DarkGiftFlaw";

export default class LivingShadowOminousWill extends _DarkGiftFlaw {

  flaw = {
    ability: "wis",
    condition: "Immediately after you roll a 1 on the d20 for a D20 Test",
    effect: {
      name: "Ominous Will",
      statuses: ["Incapacitated"],
      options: {
        expiry: "sourceStart" as const,
        description: "At the start of your next turn, roll on the Shadow's Will table to determine what you do during that turn.",
      },
    },
  };

}
