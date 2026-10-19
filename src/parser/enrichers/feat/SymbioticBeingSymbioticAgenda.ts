import _DarkGiftFlaw from "./_DarkGiftFlaw";

export default class SymbioticBeingSymbioticAgenda extends _DarkGiftFlaw {

  flaw = {
    ability: "cha",
    condition: "Immediately after you roll a 1 on the d20 for a D20 Test",
    effect: {
      name: "Symbiotic Agenda",
      statuses: ["Charmed"],
      options: {
        // the charm lasts 1d12 hours, which a fixed effect duration cannot hold
        durationSeconds: null,
        description: "Charmed for 1d12 hours: you must try to follow the symbiote's commands and further its goals. Whenever you take damage, repeat the save, ending the effect on a success.",
      },
    },
  };

}
