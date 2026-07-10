export {};

global {

  interface ICustomFunctionOptions {
    name: string;
    activity?: IDDBActivityData;
  }

  interface IAdditionalActivityOutline {
    type: string;
    name: string;
    options: IDDBActivityBuild;
  }

}
