import DDBEnricherData from "../data/DDBEnricherData";
import _DarkGiftFlaw from "./_DarkGiftFlaw";

export default class EchoingSoulIntrusiveEchoes extends _DarkGiftFlaw {

  flaw = {
    ability: "con",
    condition: "Immediately after you roll a 1 on the d20 for a D20 Test",
    effect: {
      name: "Intrusive Echoes",
      statuses: ["Incapacitated"],
      options: { expiry: "sourceEnd" as const },
      changes: [DDBEnricherData.ChangeHelper.movementMultiplierChange("0.5", 20)],
    },
  };

}
