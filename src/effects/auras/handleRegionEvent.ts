import RegionAutomations, { IRegionEventContext } from "./RegionAutomations";

/** Entry point used by the script generated in hooks/regionBehaviors/behaviorData.ts. */
export default function handleRegionEvent(context: IRegionEventContext): Promise<void> {
  return RegionAutomations.handleRegionEvent(context);
}
