// Augment Express request types to avoid verbosity of `string | string[] | undefined`
import "express-serve-static-core";

declare module "express-serve-static-core" {
  interface Request {
    // parameters and query are free-form; controllers cast/validate as needed
    params: any;
    query: any;
  }
}
