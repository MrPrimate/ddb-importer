import BaseStreamSocket, {
  BaseStreamAuthBody,
  BaseStreamEvent,
  BaseStreamHandlers,
} from "./BaseStreamSocket";

export type DDBMonsterAuthBody = BaseStreamAuthBody;

export interface DDBMonsterStartParams {
  searchTerm?: string;
  search?: string;
  sources?: number[];
  excludedCategories?: number[];
  monsterTypes?: string[];
  homebrew?: boolean;
  homebrewOnly?: boolean;
  excludeLegacy?: boolean;
  exactMatch?: boolean;
  cobalt?: string;
}

export type DDBMonsterEvent = BaseStreamEvent;
export type DDBMonsterHandlers = BaseStreamHandlers<DDBMonsterEvent>;

export default class DDBMonsterSocket extends BaseStreamSocket<DDBMonsterStartParams, DDBMonsterEvent> {
  protected get namespace() {
    return "/monsters"; 
  }

  protected get logTag() {
    return "[DDBMonsterSocket]"; 
  }
}
