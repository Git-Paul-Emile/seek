declare module 'swagger-ui-express' {
  import { RequestHandler } from 'express';

  interface SwaggerUiOptions {
    swaggerOptions?: {
      url?: string;
      spec?: object;
      explorer?: boolean;
      swaggerUrl?: string;
      swaggerOptions?: object;
    };
    customCss?: string;
    customCssUrl?: string;
    customJs?: string;
    customJsStr?: string;
    customfavIcon?: string;
    customSiteTitle?: string;
    docExp?: string;
    ops?: boolean;
  }

  const swaggerUi: {
    serve: RequestHandler[];
    setup: (spec?: object | undefined, options?: SwaggerUiOptions) => RequestHandler;
  };

  export default swaggerUi;
}
