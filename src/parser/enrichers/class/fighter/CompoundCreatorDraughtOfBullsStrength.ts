import CompoundCreatorDraught from "./CompoundCreatorDraught";

export default class CompoundCreatorDraughtOfBullsStrength extends CompoundCreatorDraught {

  get effects(): IDDBEffectHint[] {
    return [this.draughtEffect("Draught of Bull's Strength", "str")];
  }

}
