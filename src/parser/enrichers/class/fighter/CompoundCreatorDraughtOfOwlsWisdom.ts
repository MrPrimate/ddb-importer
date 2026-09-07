import CompoundCreatorDraught from "./CompoundCreatorDraught";

export default class CompoundCreatorDraughtOfOwlsWisdom extends CompoundCreatorDraught {

  override get effects(): IDDBEffectHint[] {
    return [this.draughtEffect("Draught of Owl's Wisdom", "wis")];
  }

}
