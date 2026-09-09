import CompoundCreatorDraught from "./CompoundCreatorDraught";

export default class CompoundCreatorDraughtOfBearsEndurance extends CompoundCreatorDraught {

  override get effects(): IDDBEffectHint[] {
    return [this.draughtEffect("Draught of Bear's Endurance", "con")];
  }

}
