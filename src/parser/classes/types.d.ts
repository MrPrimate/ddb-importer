export {};

global {
  type TDDBFixFunction = (advancement: I5eAdvancement, args?: Record<string, unknown>) => I5eAdvancement;
  type TDDBClassSpecialAdvancements = Record<string, {
    fix: boolean;
    fixFunction?: TDDBFixFunction;
    functionArgs?: Record<string, unknown>;
    additionalAdvancements?: boolean;
    additionalFunctions?: TDDBFixFunction[];
  }>;

}
