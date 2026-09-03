export type HttpMethod = 'get' | 'post' | 'put' | 'delete' | 'patch' | 'options' | 'head' | 'trace';

export interface OpenApiContact {
  name?: string;
  url?: string;
  email?: string;
}

export interface OpenApiLicense {
  name: string;
  url?: string;
}

export interface OpenApiInfo {
  title: string;
  version: string;
  description?: string;
  termsOfService?: string;
  contact?: OpenApiContact;
  license?: OpenApiLicense;
}

export interface OpenApiServerVariable {
  enum?: string[];
  default: string;
  description?: string;
}

export interface OpenApiServer {
  url: string;
  description?: string;
  variables?: Record<string, OpenApiServerVariable>;
}

export interface OpenApiTag {
  name: string;
  description?: string;
  externalDocs?: {
    description?: string;
    url: string;
  };
}

export interface OpenApiSchema {
  type?: string;
  format?: string;
  title?: string;
  description?: string;
  default?: any;
  enum?: any[];
  required?: string[];
  properties?: Record<string, OpenApiSchema>;
  items?: OpenApiSchema;
  $ref?: string;
  allOf?: OpenApiSchema[];
  oneOf?: OpenApiSchema[];
  anyOf?: OpenApiSchema[];
  not?: OpenApiSchema;
  example?: any;
  examples?: Record<string, any>;
  readOnly?: boolean;
  writeOnly?: boolean;
  nullable?: boolean;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  minItems?: number;
  maxItems?: number;
  uniqueItems?: boolean;
  additionalProperties?: boolean | OpenApiSchema;
}

export interface OpenApiParameter {
  name: string;
  in: 'path' | 'query' | 'header' | 'cookie';
  description?: string;
  required?: boolean;
  deprecated?: boolean;
  allowEmptyValue?: boolean;
  schema?: OpenApiSchema;
  example?: any;
  examples?: Record<string, any>;
}

export interface OpenApiMediaType {
  schema?: OpenApiSchema;
  example?: any;
  examples?: Record<string, any>;
}

export interface OpenApiRequestBody {
  description?: string;
  required?: boolean;
  content: Record<string, OpenApiMediaType>;
}

export interface OpenApiResponseHeader {
  description?: string;
  schema?: OpenApiSchema;
}

export interface OpenApiResponse {
  description: string;
  headers?: Record<string, OpenApiResponseHeader>;
  content?: Record<string, OpenApiMediaType>;
  $ref?: string;
}

export type OpenApiResponses = Record<string, OpenApiResponse>;

export interface OpenApiSecurityRequirement {
  [name: string]: string[];
}

export interface OpenApiOperation {
  tags?: string[];
  summary?: string;
  description?: string;
  operationId?: string;
  parameters?: OpenApiParameter[];
  requestBody?: OpenApiRequestBody;
  responses: OpenApiResponses;
  deprecated?: boolean;
  security?: OpenApiSecurityRequirement[];
  servers?: OpenApiServer[];
}

export interface OpenApiPathItem {
  $ref?: string;
  summary?: string;
  description?: string;
  get?: OpenApiOperation;
  put?: OpenApiOperation;
  post?: OpenApiOperation;
  delete?: OpenApiOperation;
  options?: OpenApiOperation;
  head?: OpenApiOperation;
  patch?: OpenApiOperation;
  trace?: OpenApiOperation;
  servers?: OpenApiServer[];
  parameters?: OpenApiParameter[];
}

export interface OpenApiSecurityScheme {
  type: 'apiKey' | 'http' | 'oauth2' | 'openIdConnect';
  description?: string;
  name?: string;
  in?: 'query' | 'header' | 'cookie';
  scheme?: string; // e.g. 'bearer', 'basic'
  bearerFormat?: string; // e.g. 'JWT'
  flows?: Record<string, any>;
  openIdConnectUrl?: string;
}

export interface OpenApiComponents {
  schemas?: Record<string, OpenApiSchema>;
  responses?: Record<string, OpenApiResponse>;
  parameters?: Record<string, OpenApiParameter>;
  requestBodies?: Record<string, OpenApiRequestBody>;
  securitySchemes?: Record<string, OpenApiSecurityScheme>;
  headers?: Record<string, OpenApiResponseHeader>;
}

export interface OpenApiSpec {
  openapi?: string; // e.g. '3.0.0', '3.1.0'
  swagger?: string; // e.g. '2.0'
  info: OpenApiInfo;
  servers?: OpenApiServer[];
  host?: string; // Swagger 2.0
  basePath?: string; // Swagger 2.0
  schemes?: string[]; // Swagger 2.0
  tags?: OpenApiTag[];
  paths: Record<string, OpenApiPathItem>;
  components?: OpenApiComponents;
  definitions?: Record<string, OpenApiSchema>; // Swagger 2.0
  securityDefinitions?: Record<string, OpenApiSecurityScheme>; // Swagger 2.0
  security?: OpenApiSecurityRequirement[];
}

export interface ParseError {
  message: string;
  line?: number;
  column?: number;
}

export interface AuthState {
  type: 'bearer' | 'apiKey' | 'basic' | 'custom';
  bearerToken: string;
  apiKeyName: string;
  apiKeyValue: string;
  apiKeyIn: 'header' | 'query';
  basicUsername: string;
  basicPassword: string;
  customHeaders: Record<string, string>;
}

export interface TryItOutState {
  parameters: Record<string, any>; // key: param.name
  requestBody: string; // raw json or text
  selectedContentType: string;
  loading: boolean;
  response?: {
    status: number;
    statusText: string;
    timeMs: number;
    headers: Record<string, string>;
    body: any;
    rawBody: string;
    curl: string;
  };
  error?: string;
}
