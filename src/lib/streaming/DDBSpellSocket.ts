import BaseStreamSocket, {
  BaseStreamAuthBody,
  BaseStreamEvent,
  BaseStreamHandlers,
} from "./BaseStreamSocket";

export type DDBSpellAuthBody = BaseStreamAuthBody;

export interface DDBSpellStartParams {
  className: string;
  rulesVersion: string;
  campaignId?: string | number | null;
  cobalt?: string;
}

export type DDBSpellEvent = BaseStreamEvent;
export type DDBSpellHandlers = BaseStreamHandlers<DDBSpellEvent>;

export default class DDBSpellSocket extends BaseStreamSocket<DDBSpellStartParams, DDBSpellEvent> {
  protected get namespace() {
    return "/spells"; 
  }

  protected get logTag() {
    return "[DDBSpellSocket]"; 
  }
}
