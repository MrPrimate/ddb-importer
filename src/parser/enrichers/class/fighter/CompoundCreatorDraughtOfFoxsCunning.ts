import CompoundCreatorDraught from "./CompoundCreatorDraught";

export default class CompoundCreatorDraughtOfFoxsCunning extends CompoundCreatorDraught {

  get effects(): IDDBEffectHint[] {
    return [this.draughtEffect("Draught of Fox's Cunning", "int")];
  }

}
