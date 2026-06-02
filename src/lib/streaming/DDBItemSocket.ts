import BaseStreamSocket, {
  BaseStreamAuthBody,
  BaseStreamEvent,
  BaseStreamHandlers,
} from "./BaseStreamSocket";

export type DDBItemAuthBody = BaseStreamAuthBody;

export interface DDBItemStartParams {
  campaignId?: string | number | null;
  addSpells?: boolean;
  cobalt?: string;
}

export type DDBItemEvent = BaseStreamEvent;
export type DDBItemHandlers = BaseStreamHandlers<DDBItemEvent>;

export default class DDBItemSocket extends BaseStreamSocket<DDBItemStartParams, DDBItemEvent> {
  protected get namespace() {
    return "/items"; 
  }

  protected get logTag() {
    return "[DDBItemSocket]"; 
  }
}
