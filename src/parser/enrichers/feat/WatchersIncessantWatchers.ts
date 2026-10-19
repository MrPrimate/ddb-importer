import DDBEnricherData from "../data/DDBEnricherData";
import _DarkGiftFlaw from "./_DarkGiftFlaw";

export default class WatchersIncessantWatchers extends _DarkGiftFlaw {

  flaw = {
    ability: "wis",
    condition: "Immediately after you roll a 1 on the d20 for a D20 Test",
    effect: {
      name: "Paranoia",
      options: {
        durationSeconds: 60,
        description: "Disadvantage on D20 Tests for 1 minute. Repeat the save at the end of each of your turns, ending the effect on a success.",
      },
      midiChanges: [
        DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.disadvantage.all"),
      ],
      ac5eChanges: [
        DDBEnricherData.ChangeHelper.ac5eChange("1", 20, "flags.automated-conditions-5e.attack.disadvantage"),
        DDBEnricherData.ChangeHelper.ac5eChange("1", 20, "flags.automated-conditions-5e.save.disadvantage"),
        DDBEnricherData.ChangeHelper.ac5eChange("1", 20, "flags.automated-conditions-5e.check.disadvantage"),
      ],
    },
  };

}
