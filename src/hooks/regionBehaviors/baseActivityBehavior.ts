/**
 * dnd5e 6.0 exposes its activity behavior base class at
 * `dnd5e.dataModels.regionBehavior.BaseActivityBehavior`; the bundled dnd5e type
 * package predates it, so the runtime value is typed here.
 */

export interface IBaseActivityBehavior {
  getDispositions(target: any, options?: { ignored?: boolean; relativeTo?: number }): Set<number>;
  createBehaviorData(activity: any, options?: { token?: any }): Record<string, unknown> | false;
  customizeField(field: any, data: any): void;
  [key: string]: any;
}

export interface IBaseActivityBehaviorClass {
  new (...args: any[]): IBaseActivityBehavior;
  LOCALIZATION_PREFIXES: string[];
  defineSchema(): Record<string, unknown>;
}

interface IRegionBehaviorModels {
  regionBehavior: {
    BaseActivityBehavior: IBaseActivityBehaviorClass;
  };
}

const BaseActivityBehavior = (dnd5e.dataModels as unknown as IRegionBehaviorModels).regionBehavior.BaseActivityBehavior;

export default BaseActivityBehavior;
