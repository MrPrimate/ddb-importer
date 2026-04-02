export default class AdvancementWrapper {

  _data: Record<string, any>;

  constructor(AdvancementClass: new (data?: any) => any) {
    const instance = new AdvancementClass({ configuration: {}, value: {} });
    this._data = instance.toObject();
  }

  get _id(): string {
    return this._data._id;
  }

  get configuration(): Record<string, any> {
    return this._data.configuration;
  }

  updateSource(changes: Record<string, any>): void {
    foundry.utils.mergeObject(this._data, changes);
  }

  toObject(): Record<string, any> {
    return foundry.utils.duplicate(this._data);
  }

  static createAdvancement<T>(AdvancementClass: new () => T): T {
    return new AdvancementWrapper(AdvancementClass) as unknown as T;
  }

}
