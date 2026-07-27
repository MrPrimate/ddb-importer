export {};

global {
  interface IDDBFixFunctionArgs {
    newName?: string | null;
    identifier?: string | null;
  }
  type TDDBFixFunction = (advancement: I5eAdvancement, args?: IDDBFixFunctionArgs) => I5eAdvancement;
  type TDDBScaleValueFixFunction = (advancement: I5eAdvancementScaleValue) => I5eAdvancement;
  type TDDBClassSpecialAdvancements = Record<string, {
    fix: boolean;
    fixFunction?: TDDBFixFunction;
    functionArgs?: IDDBFixFunctionArgs;
    additionalAdvancements?: boolean;
    additionalFunctions?: TDDBScaleValueFixFunction[];
    fixFunctions?: { fn: TDDBFixFunction; args?: IDDBFixFunctionArgs }[];
  }>;

  interface IDBClassPendingClassDocument {
    data: I5eClassItem;
    isSubClass?: boolean;
    className: string;
    name: string;
    versionStub: string;
  }

}
