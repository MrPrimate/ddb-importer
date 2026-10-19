import DDBEnricherData from "../data/DDBEnricherData";
import _DarkGiftFlaw from "./_DarkGiftFlaw";

export default class GatheredWhispersVoicesFromBeyond extends _DarkGiftFlaw {

  flaw = {
    ability: "wis",
    condition: "Immediately after you roll a 1 on the d20 for a D20 Test",
    effect: {
      name: "Voices from Beyond",
      statuses: ["Deafened"],
      options: { expiry: "sourceEnd" as const },
      midiChanges: [
        DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.disadvantage.ability.check.all"),
        DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.disadvantage.attack.all"),
      ],
      ac5eChanges: [
        DDBEnricherData.ChangeHelper.ac5eChange("1", 20, "flags.automated-conditions-5e.check.disadvantage"),
        DDBEnricherData.ChangeHelper.ac5eChange("1", 20, "flags.automated-conditions-5e.attack.disadvantage"),
      ],
    },
  };

}
