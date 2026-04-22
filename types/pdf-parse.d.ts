// We import pdf-parse via its internal module path to skip the debug
// code that runs on the package entry. @types/pdf-parse only declares
// the top-level module, so we mirror its shape here for the inner path.
declare module "pdf-parse/lib/pdf-parse.js" {
  import pdf from "pdf-parse";
  export default pdf;
}
