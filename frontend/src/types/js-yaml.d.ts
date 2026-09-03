declare module 'js-yaml' {
  export function load(str: string, opts?: any): any;
  export function loadAll(str: string, iterator?: any, opts?: any): any;
  export function dump(obj: any, opts?: any): string;
  export function safeLoad(str: string, opts?: any): any;
  export function safeDump(obj: any, opts?: any): string;
  export class YAMLException extends Error {
    reason: string;
    mark: {
      line: number;
      column: number;
      position: number;
      snippet: string;
    };
  }
}
