import CompoundCreatorDraught from "./CompoundCreatorDraught";

export default class CompoundCreatorDraughtOfCatsGrace extends CompoundCreatorDraught {

  get effects(): IDDBEffectHint[] {
    return [this.draughtEffect("Draught of Cat's Grace", "dex")];
  }

}
