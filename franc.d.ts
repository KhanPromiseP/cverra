// types/franc.d.ts
declare module 'franc' {
  function franc(text: string, options?: any): string;
  export = franc;
  // Don't mix export = and export default
}