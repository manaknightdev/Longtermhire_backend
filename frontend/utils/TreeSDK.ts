
import { empty } from "./utils";
import { MethodConfig } from "./types/types";
import { RestAPIMethodEnum } from "./Enums";

export interface TreeSDKOptions {
  join?: string | string[];
  order?: string;
  direction?: "asc" | "desc";
  filter?: string[];
  size?: number;
  page?: number;
  role?: string;
}

export interface ApiResponse<T = any> {
  error: boolean;
  data?: T[] | T;
  message?: string;
  model?: T;
  list?: T[];
  count?: number;
  total?: number;
  limit?: number;
  num_pages?: number;
  page?: number;
}

export interface TreeSDKHeaders {
  "Content-Type"?: string;
  "x-project"?: string;
  Authorization?: string;
}

export interface TreeSDKConfig {
  baseurl?: string;
  project_id?: string;
  secret?: string;
}

export default class TreeSDK {
  private _baseurl: string;
  private _project_id: string;

  constructor(config: TreeSDKConfig = {}) {
    this._baseurl = config.baseurl || "https://baas.mytechpassport.com";
    this._project_id = config.project_id || "longtermhire";

  }

  // Flexible header generation
  private getHeader(additionalHeaders?: Record<string, string>): Headers {
    const baseHeaders: TreeSDKHeaders = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token") || ""}`
    };

    // Create Headers instance
    const headers = new Headers();

    // Add base headers
    Object.entries({ ...baseHeaders, ...(additionalHeaders || {}) }).forEach(
      ([key, value]) => headers.append(key, value)
    );

    return headers;
  }

  baseUrl(): string {
    return this._baseurl;
  }

  getProjectId(): string {
    return this._project_id;
  }

  treeBaseUrl(): string {
    return this._baseurl + "/v1/api/records";
  }
  // return this._baseurl + "/v4/api/records";

  treeBaseUrl_1(): string {
    return this._baseurl + "/v5/api/deployments/";
  }

  private getJoins(options: TreeSDKOptions = {}): [boolean, string[], string] {
    let hasJoin = Object.prototype.hasOwnProperty.call(options, "join");
    let joins = options.join;
    if (hasJoin && typeof joins === "string") {
      joins = joins.split(",");
    } else if (Array.isArray(joins)) {
      joins = joins;
    } else {
      joins = [];
    }

    let joinQuery = "";
    joins.forEach((join) => {
      joinQuery += `join=${join}&`;
    });

    return [hasJoin, joins, joinQuery];
  }

  private getOrdering(options: TreeSDKOptions): string {
    const order = options.order ?? "id";
    const direction = options.direction ?? "desc";
    return `order=${order},${direction}&`;
  }

  private getFilters(
    options: TreeSDKOptions
  ): [boolean, string[] | undefined, string] {
    const hasFilter = Object.prototype.hasOwnProperty.call(options, "filter");
    const filters = options.filter;

    let filterQuery = "";
    if (hasFilter && Array.isArray(filters)) {
      filters.forEach((filter) => {
        filterQuery += `filter=${filter}&`;
      });
    }

    return [hasFilter, filters, filterQuery];
  }

  getRole(): string {
    return localStorage.getItem("role") || "role";
  }

  // Centralized method for dynamic API calls
  private async request<T = any>(
    config: MethodConfig & {
      body?: any;
      params?: Record<string, string | number>;
      additionalHeaders?: Record<string, string>;
    }
  ): Promise<ApiResponse<T>> {
    // Destructure configuration with defaults
    const {
      endpoint = "",
      method = "GET",
      body = null,
      params = {},
      signal,
      dynamicEndpoint = false,
      additionalHeaders = {}
    } = config;

    // Construct dynamic endpoint if needed
    let finalEndpoint = dynamicEndpoint
      ? Object.entries(params).reduce(
          (acc, [key, value]) => acc.replace(`{${key}}`, String(value)),
          endpoint
        )
      : endpoint;

    // Prepare headers
    const headers = this.getHeader(additionalHeaders);

    // Prepare fetch configuration
    const fetchConfig: RequestInit = {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal
    };
    const role = this.getRole();
    try {
      const result = await fetch(
        `${this.treeBaseUrl()}${finalEndpoint
          ?.replaceAll("{{project}}", this.getProjectId())
          .replaceAll("{{role}}", role)}`,
        fetchConfig
      );
      return this.handleFetchResponse<T>(result);
    } catch (error) {
      console.error("API Call Error:", error);
      throw error;
    }
  }

  // Centralized error handling
  private async handleFetchResponse<T = any>(
    result: Response
  ): Promise<ApiResponse<T>> {
    try {
      const json = await result.json();

      if (!result.ok) {
        throw new Error(json.message || `HTTP error! status: ${result.status}`);
      }

      return json;
    } catch (error) {
      console.error("Fetch response handling error:", error);
      throw error;
    }
  }

  async getOne<T = any>(
    table: string,
    id: number | string,
    options: TreeSDKOptions = {}
  ): Promise<ApiResponse<T>> {
    if (empty(table) || empty(id)) throw new Error("table, id is required.");

    const [_hasJoin, _joins, joinQuery] = this.getJoins(options);

    return this.request<T>({
      endpoint: `/{{project}}/{{role}}/${table}/${id}?${joinQuery}`,
      method: RestAPIMethodEnum.GET
    });
  }

  async getOneFilter<T = any>(
    table: string,
    options: TreeSDKOptions = {}
  ): Promise<ApiResponse<T>> {
    if (empty(table) || empty(options?.filter))
      throw new Error("table and filter is required.");

    const [_hasJoin, _joins, _joinQuery] = this.getJoins(options);
    const [_hasFilter, _filters, filterQuery] = this.getFilters(options);

    return this.request<T>({
      endpoint: `/{{project}}/{{role}}/${table}?${filterQuery}`,
      method: RestAPIMethodEnum.GET
    });
  }

  async getMany<T = any>(
    table: string,
    ids: number | string | (number | string)[],
    options: TreeSDKOptions = {}
  ): Promise<ApiResponse<T>> {
    if (empty(table) || empty(ids)) throw new Error("table id is required.");

    const [_hasJoin, _joins, joinQuery] = this.getJoins(options);
    const id = Array.isArray(ids) ? ids.join(",") : ids;

    return this.request<T>({
      endpoint: `/{{project}}/{{role}}/${table}/${id}?${joinQuery}`,
      method: RestAPIMethodEnum.GET
    });
  }

  async getList<T = any>(
    table: string,
    options: TreeSDKOptions = {}
  ): Promise<ApiResponse<T>> {
    if (empty(table)) throw new Error("table is required.");

    const [_hasJoin, _joins, joinQuery] = this.getJoins(options);
    const [_hasFilter, _filters, filterQuery] = this.getFilters(options);
    const orderQuery = this.getOrdering(options);
    const size = options.size ?? 10;
    const page = options.page ?? 1;

    return this.request<T>({
      endpoint: `/{{project}}/{{role}}/${table}?${joinQuery}${filterQuery}${orderQuery}size=${size}&page=${page}`,
      method: RestAPIMethodEnum.GET
    });
  }

  async getPaginate<T = any>(
    table: string,
    options: TreeSDKOptions = {},
    signal?: AbortSignal
  ): Promise<ApiResponse<T>> {
    if (empty(table)) throw new Error("table is required.");

    const [_hasJoin, _joins, joinQuery] = this.getJoins(options);
    const [_hasFilter, _filters, filterQuery] = this.getFilters(options);
    const orderQuery = this.getOrdering(options);
    const size = options.size ?? 20;
    const page = options.page ?? 1;
    // /v1/api/records/:project/:role/:table?
    return this.request<T>({
      endpoint: `/{{project}}/{{role}}/${table}?${joinQuery}${filterQuery}${orderQuery}size=${size}&page=${page}`,
      method: RestAPIMethodEnum.GET,
      signal
    });
  }

  async create<T = any>(
    table: string,
    payload: Record<string, any>
  ): Promise<ApiResponse<T>> {
    if (empty(table)) throw new Error("table is required.");

    return this.request<T>({
      endpoint: `/{{project}}/{{role}}/${table}`,
      method: RestAPIMethodEnum.POST,
      body: payload
    });
  }

  async update<T = any>(
    table: string,
    id: number | string,
    payload: Record<string, any>
  ): Promise<ApiResponse<T>> {
    if (empty(table) || empty(id)) throw new Error("table, id is required.");

    return this.request<T>({
      endpoint: `/{{project}}/{{role}}/${table}/${id}`,
      method: RestAPIMethodEnum.PUT,
      body: payload
    });
  }

  async updateWhere<T = any>(
    table: string,
    where: Record<string, any>,
    payload: Record<string, any>
  ): Promise<ApiResponse<T>> {
    if (empty(table)) throw new Error("table is required.");
    if (Object.keys(where).length === 0)
      throw new Error("condition is required.");

    return this.request<T>({
      endpoint: `/{{project}}/{{role}}/${table}`,
      method: RestAPIMethodEnum.PUT,
      body: { ...payload, updateCondition: where }
    });
  }

  async delete<T = any>(
    table: string,
    id: number | string,
    payload?: Record<string, any>
  ): Promise<ApiResponse<T>> {
    if (empty(table) || empty(id)) throw new Error("table, id is required.");

    return this.request<T>({
      endpoint: `/{{project}}/{{role}}/${table}/${id}`,
      method: RestAPIMethodEnum.DELETE,
      body: payload
    });
  }
}
