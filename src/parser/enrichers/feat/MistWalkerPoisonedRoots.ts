import _DarkGiftFlaw from "./_DarkGiftFlaw";

// a failed save denies the Short Rest's benefits, which no effect can model
export default class MistWalkerPoisonedRoots extends _DarkGiftFlaw {

  flaw = {
    ability: "con",
    activationType: "shortRest" as const,
    condition: "Finishing a Short Rest within 10 miles of where you finished your last Long Rest",
  };

}
