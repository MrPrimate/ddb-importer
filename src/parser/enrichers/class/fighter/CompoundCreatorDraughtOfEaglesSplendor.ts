import CompoundCreatorDraught from "./CompoundCreatorDraught";

export default class CompoundCreatorDraughtOfEaglesSplendor extends CompoundCreatorDraught {

  get effects(): IDDBEffectHint[] {
    return [this.draughtEffect("Draught of Eagle's Splendor", "cha")];
  }

}
