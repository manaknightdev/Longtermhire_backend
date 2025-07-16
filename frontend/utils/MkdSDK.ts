
  import TreeSDK from "./TreeSDK";
  import { RestAPIMethodEnum } from "./Enums";
  import { RestAPIMethod } from "./types/types";

// Interfaces for specific method payloads
interface SessionPostPayload {
  user_id: string;
  session_id: string;
  status: string;
  events: any[];
  screen_width: number;
  screen_height: number;
  screen_size: string;
  start_time: string;
  end_time: string;
  html_copy?: string;
}

interface TwoFactorPayload {
  [key: string]: any;
}

// Comprehensive configuration interface
interface MkdSDKConfig {
  baseurl?: string;
  fe_baseurl?: string;
  project_id?: string;
  secret?: string;
  table?: string;
}

// Flexible header interface
interface MkdSDKHeader {
  "Content-Type"?: string;
  "x-project"?: string;
  Authorization?: string;
}

// Comprehensive API response interface
interface MkdAPIResponse {
  status?: number;
  message?: string;
  data?: any;
  list?: any;
  model?: any;
  error?: boolean;
}

// Enhanced method configuration for dynamic method generation
export interface RestAPIMethodConfig {
  body?: any;
  params?: Record<string, string | number>;
  additionalHeaders?: Record<string, string>;
  excludeHeaders?: Array<string>;
}

export interface MethodConfig extends RestAPIMethodConfig {
  endpoint: string;
  method?: RestAPIMethod;
  requiresAuth?: boolean;
  transformResponse?: (response: any) => any;
  dynamicEndpoint?: boolean;
  signal?: AbortSignal | null | undefined;
}

// Comprehensive interface for REST API payload
interface RestAPIPayload {
  id?: string | number;
  join?: any;
  page?: number;
  limit?: number;
  orderBy?: string;
  sortId?: string;
  direction?: "asc" | "desc";
  payload?: Record<string, any>;
  set?: Record<string, any>;
  where?: Record<string, any>;
  [key: string]: any;
}

// Raw API method types
type RawAPIMethod = "GET" | "POST" | "PUT" | "DELETE";

interface AnalyticsPostPayload {
  [key: string]: any;
}

interface MkdAPIResponse {
  message?: string;
  [key: string]: any;
}
// Interfaces for join and subscription methods
interface JoinAPIPayload {
  join_id_1?: string;
  join_id_2?: string;
  select?: string;
  where?: string | string[];
  page?: number;
  limit?: number;
}

interface MultiJoinAPIPayload {
  tables: string[];
  joinIds: string[];
  selectStr: string;
  where?: string[];
  page?: number;
  limit?: number;
}

export default class MkdSDK {
  _baseurl: string;
  _project_id: string;
  _table: string;

  constructor(config: MkdSDKConfig = {}) {
    this._baseurl = config.baseurl || "https://baas.mytechpassport.com";
    this._project_id = config.project_id || "longtermhire";
    this._table = config.table || "";
  }


  setTable(table: string): void {
    this._table = table;
  }


  getProjectId(): string {
    return this._project_id;
  }

 
  logout(): void {
    window.localStorage.clear();
  }

  getRole(): string {
    return localStorage.getItem("role") || "user";
  }

  // Centralized method for dynamic API calls
  async request(config: MethodConfig): Promise<MkdAPIResponse> {
    // Destructure configuration with defaults
    const {
      endpoint,
      method = "GET",
      body = null,
      params = {},
      signal,
      dynamicEndpoint = false,
      additionalHeaders = {},
      excludeHeaders = [],
    } = config;

    // Construct dynamic endpoint if needed
    let finalEndpoint = dynamicEndpoint
      ? Object.entries(params).reduce(
          (acc, [key, value]) => acc.replace(`{${key}}`, String(value)),
          endpoint
        )
      : endpoint;

    // Prepare headers
    const headers = this.getHeader(
      {
        "Content-Type": "application/json",
        ...additionalHeaders,
      },
      excludeHeaders
    );

    // Prepare fetch configuration
    const fetchConfig: RequestInit = {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: signal,
    };
    const role = this.getRole();
    try {
      const result = await fetch(
        `${this._baseurl}${finalEndpoint
          ?.replaceAll("{{project}}", this.getProjectId())
          .replaceAll("{{role}}", role)}`,
        fetchConfig
      );
      return this.handleFetchResponse(result);
    } catch (error) {
      console.error("API Call Error:", error);
      throw error;
    }
  }

  // Centralized error handling
  async handleFetchResponse(result: Response): Promise<MkdAPIResponse> {
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

  // Flexible header generation
  getHeader(
    additionalHeaders?: Record<string, string> | null,
    exlude?: Array<string>
  ): Headers {
    const baseHeaders: MkdSDKHeader = {
      "Content-Type": "application/json",
      "x-project": this._base64Encode,
      Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
    };

    // Create Headers instance
    const headers = new Headers();

    // Add base headers
    Object.entries({ ...baseHeaders, ...(additionalHeaders || {}) }).forEach(
      ([key, value]) => {
        if (exlude?.includes(key)) return;
        headers.append(key, value);
      }
    );

    return headers;
  }

    /**
   * Upload image for editor
   * @param file File to upload
   * @returns Uploaded image details
   */
  async editorUploadImage(file: File): Promise<MkdAPIResponse> {
    const formData = new FormData();
    formData.append("file", file);

    const endpoint = `${this.baseUrl()}/v1/api/${this.getProjectId()}/${this.getRole()}/lambda/s3/upload`;
    const result = await fetch(endpoint, {
      method: RestAPIMethodEnum.POST,
      headers: this.getHeader(null, ["Content-Type"]),
      body: formData,
    });

    return this.handleFetchResponse(result);
  }

  /**
   * Create a new room
   * @param roomDetails Details of the room to create
   * @returns Created room information
   */
  async createRoom(roomDetails: any): Promise<MkdAPIResponse> {
    return this.request({
      endpoint: "/v3/api/lambda/realtime/room",
      method: RestAPIMethodEnum.POST,
      body: roomDetails
    });
  }

  /**
   * Get all users
   * @returns List of all users
   */
  async getAllUsers(): Promise<MkdAPIResponse> {
    return this.request({
      endpoint: "/v1/api/rest/user/GETALL",
      method: RestAPIMethodEnum.POST
    });
  }

  /**
   * Start polling for room updates
   * @param user_id User ID to poll for
   * @param signal AbortSignal to cancel polling
   * @returns Room update information
   */
  async startPooling(
    user_id: string,
    signal?: AbortSignal
  ): Promise<MkdAPIResponse> {
    return this.request({
      endpoint: `/v3/api/lambda/realtime/room/poll?user_id=${user_id}`,
      method: RestAPIMethodEnum.GET,
      signal
    });
  }

  /**
   * Add a new Stripe product
   * @param data Product data
   * @returns Added product details
   */
  async addStripeProduct(data: any): Promise<MkdAPIResponse> {
    return this.request({
      endpoint: `/v1/api/{{project}}/{{role}}/lambda/stripe/product`,
      method: RestAPIMethodEnum.POST,
      body: data
    });
  }

  /**
   * Get Stripe products
   * @param paginationParams Pagination parameters
   * @param filterParams Filter parameters
   * @returns List of Stripe products
   */
  async getStripeProducts(
    paginationParams: any,
    filterParams: any
  ): Promise<MkdAPIResponse> {
    const paginationQuery = new URLSearchParams(paginationParams);

    return this.request({
      endpoint: `/v1/api/{{project}}/{{role}}/lambda/stripe/products?${paginationQuery}&${filterParams}`,
      method: RestAPIMethodEnum.GET
    });
  }

  /**
   * Get a specific Stripe product
   * @param id Product ID
   * @returns Stripe product details
   */
  async getStripeProduct(id: string): Promise<MkdAPIResponse> {
    return this.request({
      endpoint: `/v1/api/{{project}}/{{role}}/lambda/stripe/product/${id}`,
      method: RestAPIMethodEnum.GET
    });
  }

  /**
   * Update a Stripe product
   * @param id Product ID
   * @param payload Update payload
   * @returns Updated product details
   */
  async updateStripeProduct(id: string, payload: any): Promise<MkdAPIResponse> {
    return this.request({
      endpoint: `/v1/api/{{project}}/{{role}}/lambda/stripe/product/${id}`,
      method: "PUT",
      body: payload
    });
  }

  /**
   * Add a new Stripe price
   * @param data Price data
   * @returns Added price details
   */
  async addStripePrice(data: any): Promise<MkdAPIResponse> {
    return this.request({
      endpoint: `/v1/api/{{project}}/{{role}}/lambda/stripe/price`,
      method: RestAPIMethodEnum.POST,
      body: data
    });
  }

  /**
   * Get Stripe prices
   * @param paginationParams Pagination parameters
   * @param filterParams Filter parameters
   * @returns List of Stripe prices
   */
  async getStripePrices(
    paginationParams: any,
    filterParams: any
  ): Promise<MkdAPIResponse> {
    const paginationQuery = new URLSearchParams(paginationParams);

    return this.request({
      endpoint: `/v1/api/{{project}}/{{role}}/lambda/stripe/prices?${paginationQuery}&${filterParams}`,
      method: RestAPIMethodEnum.GET
    });
  }

  /**
   * Get Stripe payment links
   * @returns List of payment links
   */
  async getStripePaymentLinks(): Promise<MkdAPIResponse> {
    return this.request({
      endpoint: `/v1/api/{{project}}/{{role}}/lambda/stripe/paymentlinks`,
      method: RestAPIMethodEnum.GET,
    });
  }

  /**
   * Get a specific Stripe price
   * @param id Price ID
   * @returns Stripe price details
   */
  async getStripePrice(id: string): Promise<MkdAPIResponse> {
    return this.request({
      endpoint: `/v1/api/{{project}}/{{role}}/lambda/stripe/price/${id}`,
      method: RestAPIMethodEnum.GET
    });
  }

  /**
   * Update a Stripe price
   * @param id Price ID
   * @param payload Update payload
   * @returns Updated price details
   */
  async updateStripePrice(id: string, payload: any): Promise<MkdAPIResponse> {
    return this.request({
      endpoint: `/v1/api/{{project}}/{{role}}/lambda/stripe/price/${id}`,
      method: "PUT",
      body: payload
    });
  }

  /**
   * Get Stripe subscriptions
   * @param paginationParams Pagination parameters
   * @param filterParams Filter parameters
   * @returns List of Stripe subscriptions
   */
  async getStripeSubscriptions(
    paginationParams: any,
    filterParams: any
  ): Promise<MkdAPIResponse> {
    const paginationQuery = new URLSearchParams(paginationParams);

    return this.request({
      endpoint: `/v1/api/{{project}}/{{role}}/lambda/stripe/subscriptions?${paginationQuery}&${filterParams}`,
      method: RestAPIMethodEnum.GET
    });
  }

  /**
   * Cancel a Stripe subscription as an admin
   * @param subId Subscription ID to cancel
   * @param data Additional cancellation data
   * @returns Cancellation result
   */
  async adminCancelStripeSubscription(
    subId: string,
    data: any
  ): Promise<MkdAPIResponse> {
    return this.request({
      endpoint: `/v1/api/{{project}}/{{role}}/lambda/stripe/subscription/${subId}`,
      method: RestAPIMethodEnum.DELETE,
      body: data
    });
  }

  /**
   * Create a usage charge for a Stripe subscription
   * @param subId Subscription ID
   * @param quantity Charge quantity
   * @returns Usage charge creation result
   */
  async adminCreateUsageCharge(
    subId: string,
    quantity: number
  ): Promise<MkdAPIResponse> {
    return this.request({
      endpoint: `/v1/api/{{project}}/{{role}}/lambda/stripe/subscription/usage-charge`,
      method: RestAPIMethodEnum.POST,
      body: { subId, quantity }
    });
  }

  /**
   * Get Stripe invoices
   * @param paginationParams Pagination parameters
   * @param filterParams Filter parameters
   * @returns List of Stripe invoices
   */
  async getStripeInvoices(
    paginationParams: any,
    _filterParams: any
  ): Promise<MkdAPIResponse> {
    const paginationQuery = new URLSearchParams(paginationParams);

    return this.request({
      endpoint: `/v1/api/{{project}}/{{role}}/lambda/stripe/invoices?${paginationQuery}`,
      method: RestAPIMethodEnum.GET
    });
  }

  /**
   * Get Stripe invoices (V2 version)
   * @param paginationParams Pagination parameters
   * @param filterParams Filter parameters
   * @returns List of Stripe invoices (V2)
   */
  async getStripeInvoicesV2(
    paginationParams: any,
    filterParams: any
  ): Promise<MkdAPIResponse> {
    const paginationQuery = new URLSearchParams(paginationParams);

    return this.request({
      endpoint: `/v1/api/{{project}}/{{role}}/lambda/stripe/invoices-v2?${paginationQuery}&${filterParams}`,
      method: RestAPIMethodEnum.GET
    });
  }

  /**
   * Get Stripe orders
   * @param paginationParams Pagination parameters
   * @param filterParams Filter parameters
   * @returns List of Stripe orders
   */
  async getStripeOrders(
    paginationParams: any,
    filterParams: any
  ): Promise<MkdAPIResponse> {
    const paginationQuery = new URLSearchParams(paginationParams);
    const filterQuery = new URLSearchParams(filterParams);

    return this.request({
      endpoint: `/v1/api/{{project}}/{{role}}/lambda/stripe/orders?${paginationQuery}&${filterQuery}`,
      method: RestAPIMethodEnum.GET
    });
  }

  /**
   * Convenience methods demonstrating dynamic API calls
   * @param email User's email address
   * @param password User's password
   * @param role User's role
   * @returns Login response
   */
  async login(
    email: string,
    password: string,
    role: string
  ): Promise<MkdAPIResponse> {
    return await this.request({
      endpoint: `/v1/api/${this.getProjectId()}/{role}/lambda/login`,
      method: RestAPIMethodEnum.POST,
      body: { email, password, is_refresh: true },
      dynamicEndpoint: true,
      params: { role }
    });
  }

  async upload(file: File): Promise<MkdAPIResponse> {
    const formData = new FormData();
    formData.append("file", file);

    const result = await fetch(`${this.uploadUrl()}`, {
      method: RestAPIMethodEnum.POST,
      headers: this.getHeader(null, ["Content-Type"]),
      body: formData,
    });

    return this.handleFetchResponse(result);
  }

  async createRole(payload: Record<string, any>): Promise<MkdAPIResponse> {
    return await this.request({
      endpoint: `/v1/api/{{project}}/{{role}}/lambda/role`,
      method: RestAPIMethodEnum.POST,
      body: payload
    });
  }

  async deleteRole(roleId: string): Promise<MkdAPIResponse> {
    return await this.request({
      endpoint: `/v1/api/{{project}}/{{role}}/lambda/role/{roleId}`,
      method: RestAPIMethodEnum.DELETE,
      dynamicEndpoint: true,
      params: { roleId }
    });
  }

  resetXPRoject(): void {
    const raw = this._project_id + ":" + this._secret;
    this._base64Encode = btoa(raw);
  }

  // Utility methods
  baseUrl(): string {
    return this._baseurl;
  }

  uploadUrl(): string {
    return `${this.baseUrl()}/v1/api/${this.getProjectId()}/{{role}}/lambda/upload`;
  }

  getFrontendBaseUrl(): string {
    return this._fe_baseurl;
  }

  getGoogleCaptchaSiteKey(): string {
    return this._GOOGLE_CAPTCHA_SITEKEY;
  }

  /**
   * Flexible REST API method that supports multiple operation types
   * @param payload Payload for the API call
   * @param method Specific REST API method to execute
   * @returns Promise with API response
   */
  async callRestAPI(
    payload: RestAPIPayload,
    method: RestAPIMethod
  ): Promise<any> {
    // Use TreeSDK for specific operations
    const tdk = new TreeSDK();

    try {
      switch (method) {
        case RestAPIMethodEnum.GET:
          const getOptions: any = { join: payload.join };
          return await tdk.getOne(this._table, payload.id!, getOptions);

        case RestAPIMethodEnum.POST:
          return await tdk.create(this._table, payload);

        case RestAPIMethodEnum.PUT:
          return await tdk.update(this._table, payload.id!, payload);

        case RestAPIMethodEnum.PUTWHERE:
          return await this.request({
            endpoint: `/v1/api/rest/${this._table}/${RestAPIMethodEnum.PUTWHERE}`,
            method: RestAPIMethodEnum.POST,
            body: payload
          });

        case RestAPIMethodEnum.DELETE:
          return await tdk.delete(this._table, payload.id!);

        case RestAPIMethodEnum.DELETEALL:
          return await this.request({
            endpoint: `/v1/api/rest/${this._table}/${RestAPIMethodEnum.DELETEALL}`,
            method: RestAPIMethodEnum.POST,
            body: payload
          });

        case RestAPIMethodEnum.GETALL:
          payload.order = payload.orderBy;
          return await tdk.getList(this._table, payload);

        case RestAPIMethodEnum.PAGINATE:
          const options: any = {
            size: payload.limit || 10,
            page: payload.page || 1,
            order: payload.sortId,
            direction: payload.direction,
            join: payload.join
          };

          const filters = payload.payload || {};
          options.filter = Object.keys(filters)
            .filter((col) => filters[col] !== undefined)
            .map((col) =>
              col === "id"
                ? `${col},eq,${filters[col]}`
                : `${col},cs,${filters[col]}`
            );

          return await tdk.getPaginate(this._table, options);

        case RestAPIMethodEnum.CURSORPAGINATE:
          return await this.request({
            endpoint: `/v1/api/rest/${this._table}/${RestAPIMethodEnum.CURSORPAGINATE}`,
            method: RestAPIMethodEnum.POST,
            body: {
              page: payload.page || 1,
              limit: payload.limit || 10,
              ...payload
            }
          });

        case RestAPIMethodEnum.AUTOCOMPLETE:
          return await this.request({
            endpoint: `/v1/api/rest/${this._table}/${RestAPIMethodEnum.AUTOCOMPLETE}`,
            method: RestAPIMethodEnum.POST,
            body: payload
          });

        default:
          throw new Error(`Unsupported REST API method: ${method}`);
      }
    } catch (error) {
      console.error("REST API Call Error:", error);
      throw error;
    }
  }

  /**
   * Raw API method for direct endpoint calls
   * @param uri Endpoint URI
   * @param payload Request payload
   * @param method HTTP method
   * @returns Promise with API response
   */
  async callRawAPI(
    uri: string,
    payload: any,
    method: RawAPIMethod
  ): Promise<any> {
    try {
      const fetchOptions: RequestInit = {
        method,
        headers: this.getHeader(),
        body:
          method !== RestAPIMethodEnum.GET ? JSON.stringify(payload) : undefined
      };

      const result = await fetch(this._baseurl + uri, fetchOptions);
      return this.handleFetchResponse(result);
    } catch (error) {
      console.error("Raw API Call Error:", error);
      throw error;
    }
  }

  /**
   * Oauth Login API for social authentication
   * @param type Social login type (e.g., google, facebook, microsoft, apple)
   * @param role User role
   * @returns Social login link or error
   */
  async oauthLoginApi(type: "google" | "facebook" | "microsoft" | "apple", role: string): Promise<string> {
    const socialLogin = await fetch(`${this.baseUrl()}/v1/api/${this.getProjectId()}/${role}/lambda/${type}/login`,);

    const socialLink = await socialLogin.text();

    if (socialLogin.status === 401 || socialLogin.status === 403) {
      throw new Error(socialLink);
    }

    return socialLink;
  }

  /**
   * Retrieve user profile
   * @returns User profile information
   */
  async getProfile(): Promise<MkdAPIResponse> {
    const endpoint = `/v1/api/{{project}}/{{role}}/lambda/profile`;
    return this.request({
      endpoint,
      method: RestAPIMethodEnum.GET
    });
  }

  /**
   * Update user profile
   * @param payload Profile update payload
   * @returns Updated profile response
   */
  async updateProfile(payload: Record<string, any>): Promise<MkdAPIResponse> {
    const endpoint = `/v1/api/{{project}}/{{role}}/lambda/profile`;
    return this.request({
      endpoint,
      method: RestAPIMethodEnum.POST,
      body: payload
    });
  }

  /**
   * Check user role and permissions
   * @param role User role to check
   * @returns Role check response
   */
  async check(role: string): Promise<MkdAPIResponse> {
    return this.request({
      endpoint: `/v1/api/{{project}}/{{role}}/lambda/check`,
      method: RestAPIMethodEnum.POST,
      body: { role }
    });
  }

  /**
   * Create a new user
   * @param email User's email address
   * @param password User's password
   * @param role User's role
   * @returns User creation response
   */
  async register(
    email: string,
    password: string,
    role: string
  ): Promise<MkdAPIResponse> {
    return this.request({
      endpoint: `/v1/api/{{project}}/${role}/lambda/register`,
      method: RestAPIMethodEnum.POST,
      body: { email, password, role },
    });
  }

  /**
   * Get user sessions data
   * @returns User sessions response
   */
  async getSession(): Promise<MkdAPIResponse> {
    return this.request({
      endpoint: `/v1/api/{{project}}/{{role}}/lambda/user-sessions/data`,
      method: RestAPIMethodEnum.GET
    });
  }

  /**
   * Post user session analytics data
   * @param reqObj Session data payload
   * @returns Session post response
   */
  async sessionPost(reqObj: SessionPostPayload): Promise<MkdAPIResponse> {
    return this.request({
      endpoint: `/v1/api/{{project}}/{{role}}/lambda/analytics/user-sessions/`,
      method: RestAPIMethodEnum.POST,
      body: reqObj
    });
  }

  /**
   * Enable Two-Factor Authentication
   * @param reqObj Optional configuration for 2FA
   * @returns 2FA enable response
   */
  async enable2FA(reqObj: TwoFactorPayload = {}): Promise<MkdAPIResponse> {
    return this.request({
      endpoint: `/v1/api/{{project}}/{{role}}/lambda/2fa/enable`,
      method: RestAPIMethodEnum.POST,
      body: reqObj
    });
  }

  /**
   * Disable Two-Factor Authentication
   * @param reqObj Optional configuration for 2FA
   * @returns 2FA disable response
   */
  async disable2FA(reqObj: TwoFactorPayload = {}): Promise<MkdAPIResponse> {
    return this.request({
      endpoint: `/v1/api/{{project}}/{{role}}/lambda/2fa/disable`,
      method: RestAPIMethodEnum.POST,
      body: reqObj
    });
  }

  /**
   * Verify Two-Factor Authentication token
   * @param access_token User access token
   * @param token 2FA verification token
   * @returns 2FA verification response
   */
  async verify2FA(
    access_token: string,
    token: string
  ): Promise<MkdAPIResponse> {
    return this.request({
      endpoint: `/v1/api/{{project}}/{{role}}/lambda/2fa/verify`,
      method: RestAPIMethodEnum.POST,
      body: { access_token, token },
      additionalHeaders: {
        Authorization: `Bearer ${access_token}`
      }
    });
  }

  /**
   * Authorize Two-Factor Authentication
   * @param access_token User access token
   * @returns 2FA authorization response
   */
  async authorize2FA(access_token: string): Promise<MkdAPIResponse> {
    return this.request({
      endpoint: `/v1/api/{{project}}/{{role}}/lambda/2fa/authorize`,
      method: RestAPIMethodEnum.POST,
      additionalHeaders: {
        Authorization: `Bearer ${access_token}`
      }
    });
  }

  /**
   * Validate Google reCAPTCHA token
   * @param captchaToken Google reCAPTCHA token
   * @returns Captcha validation response
   */
  async captchaValidation(captchaToken: string): Promise<MkdAPIResponse> {
    return this.request({
      endpoint: `/v1/api/{{project}}/{{role}}/lambda/google-captcha`,
      method: RestAPIMethodEnum.POST,
      body: { captchaToken }
    });
  }

  /**
   * Initiate Magic Login process
   * @param email User's email
   * @param role User's role
   * @returns Magic login generation response
   */
  async magicLoginAttempt(
    email: string,
    role: string
  ): Promise<MkdAPIResponse> {
    return this.request({
      endpoint: `/v1/api/{{project}}/{{role}}/lambda/magic-login/generate`,
      method: RestAPIMethodEnum.POST,
      body: {
        email,
        role,
        url: `${this._baseurl}/magic-login/verify`
      }
    });
  }

  /**
   * Verify Magic Login token
   * @param token Magic login verification token
   * @returns Magic login verification response
   */
  async magicLoginVerify(token: string = ""): Promise<MkdAPIResponse> {
    return this.request({
      endpoint: `/v1/api/{{project}}/{{role}}/lambda/magic-login`,
      method: RestAPIMethodEnum.POST,
      body: { token }
    });
  }

  /**
   * Export table data as CSV
   * Generates and triggers a CSV download for the current table
   */
  async exportCSV(): Promise<void> {
    const result = await fetch(`${this._baseurl}/rest/${this._table}/EXPORT`, {
      method: RestAPIMethodEnum.POST,
      headers: this.getHeader()
    });

    const res = await result.text();

    // Client-side CSV download
    const hiddenElement = document.createElement("a");
    hiddenElement.href = `data:text/csv;charset=utf-8,${encodeURI(res)}`;
    hiddenElement.target = "_blank";
    hiddenElement.download = `${this._table}.csv`;
    hiddenElement.click();

    // Error handling via handleFetchResponse
    await this.handleFetchResponse(result);
  }

  /**
   * Post analytics data
   * @param uri Endpoint URI
   * @param payload Analytics payload
   * @param method HTTP method
   * @returns Analytics post response
   */
  async analyticsPost(
    uri: string,
    payload: AnalyticsPostPayload,
    method: RestAPIMethod = RestAPIMethodEnum.POST
  ): Promise<MkdAPIResponse> {
    return this.request({
      endpoint: uri,
      method,
      body: payload
    });
  }

  /**
   * Retrieve user profile preferences
   * @returns User profile preferences
   */
  async getProfilePreference(): Promise<MkdAPIResponse> {
    return this.request({
      endpoint: `/v1/api/{{project}}/{{role}}/lambda/preference`,
      method: RestAPIMethodEnum.GET
    });
  }

  /**
   * Update user email
   * @param email New email address
   * @returns Email update response
   */
  async updateEmail(email: string): Promise<MkdAPIResponse> {
    return this.request({
      endpoint: `/v1/api/{{project}}/{{role}}/lambda/update/email`,
      method: RestAPIMethodEnum.POST,
      body: { email }
    });
  }

  /**
   * Update user profile photo
   * @param photo Base64 encoded photo or photo URL
   * @returns Photo update response
   */
  async updatePhoto(photo: string): Promise<MkdAPIResponse> {
    return this.request({
      endpoint: `/v1/api/{{project}}/{{role}}/lambda/update/photo`,
      method: RestAPIMethodEnum.POST,
      body: { photo }
    });
  }

  /**
   * Update user password
   * @param password New password
   * @returns Password update response
   */
  async updatePassword(password: string): Promise<MkdAPIResponse> {
    return this.request({
      endpoint: `/v1/api/{{project}}/{{role}}/lambda/update/password`,
      method: RestAPIMethodEnum.POST,
      body: { password }
    });
  }

  /**
   * Update user email by admin
   * @param email New email address
   * @param id User ID to update
   * @returns Email update response
   */
  async updateEmailByAdmin(email: string, id: string): Promise<MkdAPIResponse> {
    return this.request({
      endpoint: `/v1/api/{{project}}/{{role}}/lambda/admin/update/email`,
      method: RestAPIMethodEnum.POST,
      body: { email, id }
    });
  }

  /**
   * Update user password by admin
   * @param password New password
   * @param id User ID to update
   * @returns Password update response
   */
  async updatePasswordByAdmin(
    password: string,
    id: string
  ): Promise<MkdAPIResponse> {
    return this.request({
      endpoint: `/v1/api/{{project}}/{{role}}/lambda/admin/update/password`,
      method: RestAPIMethodEnum.POST,
      body: { password, id }
    });
  }

  /**
   * Verify a user by their ID
   * @param user_id User identifier to verify
   * @returns User verification response
   */
  async verifyUser(user_id: string): Promise<MkdAPIResponse> {
    return this.request({
      endpoint: `/v1/api/{{project}}/{{role}}/lambda/verify/user`,
      method: RestAPIMethodEnum.POST,
      body: { user_id }
    });
  }

  /**
   * Create a new user
   * @param email User's email address
   * @param password User's password
   * @param role User's role
   * @returns User creation response
   */
  async createUser(
    email: string,
    password: string,
    role: string
  ): Promise<MkdAPIResponse> {
    return this.request({
      endpoint: `/v1/api/{{project}}/{{role}}/lambda/register`,
      method: RestAPIMethodEnum.POST,
      body: { email, password, role }
    });
  }

  /**
   * Initiate forgot password process
   * @param email User's email address
   * @returns Forgot password response
   */
  async forgot(email: string): Promise<MkdAPIResponse> {
    return this.request({
      endpoint: `/v1/api/{{project}}/{{role}}/lambda/forgot`,
      method: RestAPIMethodEnum.POST,
      body: { email }
    });
  }

  /**
   * Reset user password
   * @param token Password reset token
   * @param code Verification code
   * @param password New password
   * @returns Password reset response
   */
  async reset(
    token: string,
    code: string,
    password: string
  ): Promise<MkdAPIResponse> {
    return this.request({
      endpoint: `/v1/api/{{project}}/{{role}}/lambda/reset`,
      method: RestAPIMethodEnum.POST,
      body: { token, code, password }
    });
  }

  /**
   * Get data by joining two columns
   * @param table1 First table name
   * @param table2 Second table name
   * @param join_id_1 Join identifier for first table
   * @param join_id_2 Join identifier for second table
   * @param select Columns to select
   * @param where Optional where conditions
   * @param method API method (GETALL or PAGINATE)
   * @param page Page number for pagination
   * @param limit Items per page
   * @returns Joined data result
   */
  async callJoinRestAPI(
    table1: string,
    table2: string,
    join_id_1: string,
    join_id_2: string,
    select: string,
    where?: string | string[],
    method: "GETALL" | "PAGINATE" = "GETALL",
    page: number = 1,
    limit: number = 10
  ): Promise<MkdAPIResponse> {
    const payload: JoinAPIPayload = {
      join_id_1,
      join_id_2,
      select,
      where: where || "",
      ...(method === "PAGINATE" && { page, limit })
    };

    return this.request({
      endpoint: `/v1/api/{{project}}/{{role}}/join/${table1}/${table2}/${method}`,
      method: RestAPIMethodEnum.POST,
      body: payload
    });
  }

  /**
   * Get data by joining multiple columns with pagination
   * @param tables Array of table names
   * @param joinIds Array of join identifiers
   * @param selectStr Columns to select
   * @param where Optional where conditions
   * @param page Page number
   * @param limit Items per page
   * @param method API method
   * @returns Multi-join data result
   */
  async callMultiJoinRestAPI(
    tables: string[],
    joinIds: string[],
    selectStr: string,
    where?: string[],
    page: number = 1,
    limit: number = 10,
    method: RestAPIMethod = RestAPIMethodEnum.PAGINATE
  ): Promise<MkdAPIResponse> {
    const payload: MultiJoinAPIPayload = {
      tables,
      joinIds,
      selectStr,
      where,
      page,
      limit
    };

    return this.request({
      endpoint: `/v1/api/{{project}}/{{role}}/multi-join/${method}`,
      method: RestAPIMethodEnum.POST,
      body: payload
    });
  }

  /**
   * Subscribe to a channel
   * @param channel Channel name
   * @returns Subscription response
   */
  async subscribeChannel(channel: string): Promise<MkdAPIResponse> {
    return this.request({
      endpoint: `/v1/api/{{project}}/{{role}}/lambda/subscription/channel/room`,
      method: RestAPIMethodEnum.POST,
      body: { room: channel }
    });
  }

  /**
   * Listen on a channel and wait for response
   * @param channel Channel name
   * @returns Channel listening response
   */
  async subscribeListen(channel: string): Promise<MkdAPIResponse> {
    return this.request({
      endpoint: `/v1/api/{{project}}/{{role}}/lambda/subscription/channel/poll?room=${channel}`,
      method: RestAPIMethodEnum.GET
    });
  }

  /**
   * Unsubscribe from a channel
   * @param channel Channel name
   * @returns Unsubscription response
   */
  async unSubscribeChannel(channel: string): Promise<MkdAPIResponse> {
    return this.request({
      endpoint: `/v1/api/{{project}}/{{role}}/lambda/subscription/channel/unsubscribe?room=${channel}`,
      method: RestAPIMethodEnum.GET
    });
  }

  /**
   * Check if a channel is online
   * @param channel Channel name
   * @returns Channel online status
   */
  async channelOnline(channel: string): Promise<MkdAPIResponse> {
    return this.request({
      endpoint: `/v1/api/{{project}}/{{role}}/lambda/subscription/channel/online?room=${channel}`,
      method: RestAPIMethodEnum.GET
    });
  }

  /**
   * Broadcast a message to a specified channel
   * @param payload Payload to broadcast
   * @param channel Channel to broadcast to
   * @returns Broadcast response
   */
  async broadcast(payload: any, channel: string): Promise<MkdAPIResponse> {
    return this.request({
      endpoint: `/v1/api/{{project}}/{{role}}/lambda/subscription/channel/send`,
      method: RestAPIMethodEnum.POST,
      body: {
        payload: payload,
        room: channel
      }
    });
  }

  /**
   * Add a new CMS entry
   * @param page Page for the CMS entry
   * @param key Key for the CMS entry
   * @param type Type of the CMS entry
   * @param value Value of the CMS entry
   * @returns CMS add response
   */
  async cmsAdd(
    page: string,
    key: string,
    type: string,
    value: any
  ): Promise<MkdAPIResponse> {
    return this.request({
      endpoint: `/v1/api/{{project}}/{{role}}/lambda/cms`,
      method: RestAPIMethodEnum.POST,
      body: {
        page,
        key,
        type,
        value
      }
    });
  }

  /**
   * Edit an existing CMS entry
   * @param id ID of the CMS entry to edit
   * @param page Page for the CMS entry
   * @param key Key for the CMS entry
   * @param type Type of the CMS entry
   * @param value New value of the CMS entry
   * @returns CMS edit response
   */
  async cmsEdit(
    id: string,
    page: string,
    key: string,
    type: string,
    value: any
  ): Promise<MkdAPIResponse> {
    return this.request({
      endpoint: `/v1/api/{{project}}/{{role}}/lambda/cms/${id}`,
      method: RestAPIMethodEnum.PUT,
      body: {
        page,
        key,
        type,
        value
      }
    });
  }

  /**
   * Get the current authentication token
   * @returns Authentication token or null
   */
  getToken(): string | null {
    return window.localStorage.getItem("token");
  }

  /**
   * Get the current user's chat rooms
   * @returns User's chat rooms
   */
  async getMyRoom(): Promise<MkdAPIResponse> {
    return this.request({
      endpoint: "/v3/api/{{project}}/{{role}}/lambda/realtime/room/my",
      method: RestAPIMethodEnum.GET
    });
  }

  /**
   * Get chat ID for a specific room
   * @param room_id Room ID to get chat ID for
   * @returns Chat ID
   */
  async getChatId(room_id: string): Promise<MkdAPIResponse> {
    return this.request({
      endpoint: `/v1/api/{{project}}/{{role}}/lambda/room?room_id=${room_id}`,
      method: RestAPIMethodEnum.GET
    });
  }

  /**
   * Get chats for a specific room
   * @param room_id Room ID
   * @param chat_id Chat ID
   * @param date Date for chat retrieval
   * @returns Chats
   */
  async getChats(
    room_id: string,
    chat_id: string,
    date: string
  ): Promise<MkdAPIResponse> {
    return this.request({
      endpoint: "/v3/api/{{project}}/{{role}}/lambda/realtime/chat",
      method: RestAPIMethodEnum.POST,
      body: {
        room_id,
        chat_id,
        date
      }
    });
  }

  /**
   * Restore chat for a specific room
   * @param room_id Room ID to restore chat for
   * @returns Void promise
   */
  async restoreChat(room_id: string): Promise<MkdAPIResponse> {
    return this.request({
      endpoint: `/v1/api/{{project}}/{{role}}/lambda/v1/api/lambda/{{project}}/{{role}}/room/poll?room=${room_id}`,
      method: RestAPIMethodEnum.GET
    });
  }

  /**
   * Post a new message
   * @param messageDetails Details of the message to post
   * @returns Posted message result
   */
  async postMessage(messageDetails: any): Promise<MkdAPIResponse> {
    return this.request({
      endpoint: "/v3/api/{{project}}/{{role}}/lambda/realtime/send",
      method: RestAPIMethodEnum.POST,
      body: messageDetails
    });
  }

  /**
   * Upload an image
   * @param file File to upload
   * @returns Upload result
   */
  async uploadImage(file: any): Promise<MkdAPIResponse> {
    const endpoint = `${this.baseUrl()}/v1/api/${this.getProjectId()}/${this.getRole()}/lambda/s3/upload`;
    const result = await fetch(endpoint, {
      method: RestAPIMethodEnum.POST,
      headers: this.getHeader(null, ["Content-Type"]),
      body: file,
    });

    return this.handleFetchResponse(result);
  }


  /**
   * Initialize a Stripe checkout session
   * @param data Checkout session data
   * @returns Checkout session details
   */
  async initCheckoutSession(data: any): Promise<MkdAPIResponse> {
    return this.request({
      endpoint: `/v1/api/{{project}}/{{role}}/lambda/stripe/checkout`,
      method: RestAPIMethodEnum.POST,
      body: data
    });
  }

  /**
   * Register a new user and subscribe to a plan
   * @param data Registration and subscription data
   * @returns Registration and subscription result
   */
  async registerAndSubscribe(data: {
    email: string;
    password: string;
    cardToken: string;
    planId: string;
  }): Promise<MkdAPIResponse> {
    return this.request({
      endpoint: `/v1/api/{{project}}/{{role}}/lambda/stripe/customer/register-subscribe`,
      method: RestAPIMethodEnum.POST,
      body: data
    });
  }

  /**
   * Create a Stripe customer
   * @param payload Customer creation payload
   * @returns Created customer details
   */
  async createStripeCustomer(payload: any): Promise<MkdAPIResponse> {
    return this.request({
      endpoint: `/v1/api/{{project}}/{{role}}/lambda/stripe/customer`,
      method: RestAPIMethodEnum.POST,
      body: payload
    });
  }

  /**
   * Create a Stripe card for a customer
   * @param payload Card creation payload
   * @returns Created card details
   */
  async createCustomerStripeCard(payload: any): Promise<MkdAPIResponse> {
    return this.request({
      endpoint: `/v1/api/{{project}}/{{role}}/lambda/stripe/customer/card`,
      method: RestAPIMethodEnum.POST,
      body: payload
    });
  }

  /**
   * Create a Stripe subscription
   * @param data Subscription creation data
   * @returns Created subscription details
   */
  async createStripeSubscription(data: any): Promise<MkdAPIResponse> {
    return this.request({
      endpoint: `/v1/api/{{project}}/{{role}}/lambda/stripe/customer/subscription`,
      method: RestAPIMethodEnum.POST,
      body: data
    });
  }

  /**
   * Get customer's Stripe subscription
   * @returns Customer's subscription details
   */
  async getCustomerStripeSubscription(): Promise<MkdAPIResponse> {
    return this.request({
      endpoint: `/v1/api/{{project}}/{{role}}/lambda/stripe/customer/subscription`,
      method: RestAPIMethodEnum.GET
    });
  }

  /**
   * Get customer's Stripe subscriptions
   * @param paginationParams Pagination parameters
   * @param filterParams Filter parameters
   * @returns List of customer's subscriptions
   */
  async getCustomerStripeSubscriptions(
    paginationParams: any,
    filterParams: any
  ): Promise<MkdAPIResponse> {
    const paginationQuery = new URLSearchParams(paginationParams);
    const filterQuery = new URLSearchParams(filterParams);

    return this.request({
      endpoint: `/v1/api/{{project}}/{{role}}/lambda/stripe/customer/subscriptions?${paginationQuery}&${filterQuery}`,
      method: RestAPIMethodEnum.GET
    });
  }

  /**
   * Change an existing Stripe subscription
   * @param data Subscription change data
   * @returns Updated subscription details
   */
  async changeStripeSubscription(data: any): Promise<MkdAPIResponse> {
    return this.request({
      endpoint: `/v1/api/{{project}}/{{role}}/lambda/stripe/customer/subscription`,
      method: RestAPIMethodEnum.PUT,
      body: data
    });
  }

  /**
   * Cancel a Stripe subscription
   * @param subId Subscription ID to cancel
   * @param data Cancellation data
   * @returns Cancellation result
   */
  async cancelStripeSubscription(
    subId: string,
    data: any
  ): Promise<MkdAPIResponse> {
    return this.request({
      endpoint: `/v1/api/{{project}}/{{role}}/lambda/stripe/customer/subscription/${subId}`,
      method: RestAPIMethodEnum.DELETE,
      body: data
    });
  }

  /**
   * Get customer's Stripe details
   * @returns Customer's Stripe account details
   */
  async getCustomerStripeDetails(): Promise<MkdAPIResponse> {
    return this.request({
      endpoint: `/v1/api/{{project}}/{{role}}/lambda/stripe/customer`,
      method: RestAPIMethodEnum.GET
    });
  }

  /**
   * Get customer's Stripe cards
   * @param paginationParams Pagination parameters
   * @returns List of customer's Stripe cards
   */
  async getCustomerStripeCards(paginationParams: any): Promise<MkdAPIResponse> {
    const paginationQuery = new URLSearchParams(paginationParams);

    return this.request({
      endpoint: `/v1/api/{{project}}/{{role}}/lambda/stripe/customer/cards?${paginationQuery}`,
      method: RestAPIMethodEnum.GET
    });
  }

  /**
   * Get customer's Stripe invoices
   * @param paginationParams Pagination parameters
   * @returns List of customer's Stripe invoices
   */
  async getCustomerStripeInvoices(
    paginationParams: any
  ): Promise<MkdAPIResponse> {
    const paginationQuery = new URLSearchParams(paginationParams);

    return this.request({
      endpoint: `/v1/api/{{project}}/{{role}}/lambda/stripe/customer/invoices?${paginationQuery}`,
      method: RestAPIMethodEnum.GET
    });
  }

  /**
   * Get customer's Stripe charges
   * @param paginationParams Pagination parameters
   * @returns List of customer's Stripe charges
   */
  async getCustomerStripeCharges(
    paginationParams: any
  ): Promise<MkdAPIResponse> {
    const paginationQuery = new URLSearchParams(paginationParams);

    return this.request({
      endpoint: `/v1/api/{{project}}/{{role}}/lambda/stripe/customer/charges?${paginationQuery}`,
      method: RestAPIMethodEnum.GET
    });
  }

  /**
   * Get customer's Stripe orders
   * @param paginationParams Pagination parameters
   * @returns List of customer's Stripe orders
   */
  async getCustomerStripeOrders(
    paginationParams: any
  ): Promise<MkdAPIResponse> {
    const paginationQuery = new URLSearchParams(paginationParams);

    return this.request({
      endpoint: `/v1/api/{{project}}/{{role}}/lambda/stripe/customer/orders?${paginationQuery}`,
      method: RestAPIMethodEnum.GET
    });
  }

  /**
   * Set a Stripe customer's default card
   * @param cardId Card ID to set as default
   * @returns Result of setting default card
   */
  async setStripeCustomerDefaultCard(cardId: string): Promise<MkdAPIResponse> {
    return this.request({
      endpoint: `/v1/api/{{project}}/{{role}}/lambda/stripe/customer/card/${cardId}/set-default`,
      method: RestAPIMethodEnum.PUT
    });
  }

  /**
   * Delete a customer's Stripe card
   * @param cardId Card ID to delete
   * @returns Result of card deletion
   */
  async deleteCustomerStripeCard(cardId: string): Promise<MkdAPIResponse> {
    return this.request({
      endpoint: `/v1/api/{{project}}/{{role}}/lambda/stripe/customer/card/${cardId}`,
      method: RestAPIMethodEnum.DELETE
    });
  }

  /**
   * Add an event to Google Calendar
   * @param params Google Calendar event parameters
   * @returns Promise resolving to the API response
   */
  async addEventToGC(params: {
    access_token: string;
    expires_in: number;
    refresh_token: string;
    scope: string;
    token_type: string;
    summary: string;
    location?: string;
    description?: string;
    startTime: string;
    endTime: string;
    attendees?: any[];
  }): Promise<MkdAPIResponse> {
    return this.request({
      endpoint: `/v1/api/{{project}}/{{role}}/lambda/scheduling/google-calendar-event`,
      method: RestAPIMethodEnum.POST,
      body: params
    });
  }

  /**
   * Get filtered blogs based on tags and categories
   * @param tags Array of tag IDs to filter
   * @param categories Array of category IDs to filter
   * @param rule Filtering rule ('or' | 'and')
   * @returns Promise resolving to filtered blogs
   */
  async getFilteredBlogs(
    tags: number[] = [],
    categories: number[] = [],
    rule?: "or" | "and"
  ): Promise<MkdAPIResponse> {
    const queryParams = new URLSearchParams();

    if (tags.length) {
      queryParams.append("tags", tags.join(","));
    }

    if (categories.length) {
      queryParams.append("categories", categories.join(","));
    }

    if (rule) {
      queryParams.append("rule", rule);
    }

    return this.request({
      endpoint: `/v1/api/{{project}}/{{role}}/lambda/blog/filter?${queryParams.toString()}`,
      method: RestAPIMethodEnum.GET
    });
  }

  /**
   * Retrieve all blogs
   * @returns Promise resolving to all blogs
   */
  async getAllBlogs(): Promise<MkdAPIResponse> {
    return this.request({
      endpoint: `/v1/api/{{project}}/{{role}}/lambda/blog/all`,
      method: RestAPIMethodEnum.GET
    });
  }

  /**
   * Create a new blog
   * @param payload Blog creation payload
   * @returns Promise resolving to blog creation result
   */
  async createBlog(payload: any): Promise<MkdAPIResponse> {
    return this.request({
      endpoint: `/v1/api/{{project}}/{{role}}/lambda/blog/create`,
      method: RestAPIMethodEnum.POST,
      body: payload
    });
  }

  /**
   * Retrieve a single blog by ID
   * @param id Blog identifier
   * @returns Promise resolving to the blog details
   */
  async getSingleBlog(id: string | number): Promise<MkdAPIResponse> {
    return this.request({
      endpoint: `/v1/api/{{project}}/{{role}}/lambda/blog/single/${id}`,
      method: RestAPIMethodEnum.GET
    });
  }

  /**
   * Edit an existing blog
   * @param id Blog identifier
   * @param payload Blog update payload
   * @returns Promise resolving to blog update result
   */
  async editBlog(id: string | number, payload: any): Promise<MkdAPIResponse> {
    return this.request({
      endpoint: `/v1/api/{{project}}/{{role}}/lambda/blog/edit/${id}`,
      method: RestAPIMethodEnum.POST,
      body: payload
    });
  }

  /**
   * Delete a blog
   * @param id Blog identifier
   * @returns Promise resolving to blog deletion result
   */
  async deleteBlog(id: string | number): Promise<MkdAPIResponse> {
    return this.request({
      endpoint: `/v1/api/{{project}}/{{role}}/lambda/blog/delete/${id}`,
      method: RestAPIMethodEnum.DELETE
    });
  }

  /**
   * Retrieve all blog categories
   * @returns Promise resolving to blog categories
   */
  async getallBlogCategories(): Promise<MkdAPIResponse> {
    return this.request({
      endpoint: `/v1/api/{{project}}/{{role}}/lambda/blog/category`,
      method: RestAPIMethodEnum.GET
    });
  }

  /**
   * Create a new blog category
   * @param payload Blog category creation payload
   * @returns Promise resolving to blog category creation result
   */
  async createBlogCategory(payload: any): Promise<MkdAPIResponse> {
    return this.request({
      endpoint: `/v1/api/{{project}}/{{role}}/lambda/blog/category`,
      method: RestAPIMethodEnum.POST,
      body: payload
    });
  }

  /**
   * Delete a blog category
   * @param id Blog category identifier
   * @returns Promise resolving to blog category deletion result
   */
  async deleteBlogCategory(id: string | number): Promise<MkdAPIResponse> {
    return this.request({
      endpoint: `/v1/api/{{project}}/{{role}}/lambda/blog/category/${id}`,
      method: RestAPIMethodEnum.DELETE
    });
  }

  /**
   * Retrieve all blog tags
   * @returns Promise resolving to blog tags
   */
  async getallBlogTags(): Promise<MkdAPIResponse> {
    return this.request({
      endpoint: `/v1/api/{{project}}/{{role}}/lambda/blog/tags`,
      method: RestAPIMethodEnum.GET
    });
  }

  /**
   * Create a new blog tag
   * @param payload Blog tag creation payload
   * @returns Promise resolving to blog tag creation result
   */
  async createBlogTag(payload: any): Promise<MkdAPIResponse> {
    return this.request({
      endpoint: `/v1/api/{{project}}/{{role}}/lambda/blog/tags`,
      method: RestAPIMethodEnum.POST,
      body: payload
    });
  }

  /**
   * Delete a blog tag
   * @param id Blog tag identifier
   * @returns Promise resolving to blog tag deletion result
   */
  async deleteBlogTag(id: string | number): Promise<MkdAPIResponse> {
    return this.request({
      endpoint: `/v1/api/{{project}}/{{role}}/lambda/blog/tags/${id}`,
      method: RestAPIMethodEnum.DELETE
    });
  }

  /**
   * Retrieve all workspaces
   * @returns Promise resolving to workspaces list
   */
  async getAllWorkspaces(): Promise<MkdAPIResponse> {
    return this.request({
      endpoint: `/v1/api/{{project}}/{{role}}/lambda/pm/workspaces`,
      method: RestAPIMethodEnum.GET,
      params: { limit: "99999" }
    });
  }

  /**
   * Retrieve a specific workspace
   * @param id Workspace identifier
   * @returns Promise resolving to workspace details
   */
  async getWorkspace(id: string | number): Promise<MkdAPIResponse> {
    return this.request({
      endpoint: `/v1/api/{{project}}/{{role}}/lambda/pm/workspaces/${id}`,
      method: RestAPIMethodEnum.GET
    });
  }

  /**
   * Create a new workspace
   * @param obj Workspace creation payload
   * @returns Promise resolving to workspace creation result
   */
  async createWorkspace(obj: any): Promise<MkdAPIResponse> {
    return this.request({
      endpoint: `/v1/api/{{project}}/{{role}}/lambda/pm/workspaces`,
      method: RestAPIMethodEnum.POST,
      body: obj
    });
  }

  /**
   * Create user boards in a workspace
   * @param workspaceId Workspace identifier
   * @param reqObj Board creation payload
   * @returns Promise resolving to board creation result
   */
  async createUserBoards(
    workspaceId: string | number,
    reqObj: any
  ): Promise<MkdAPIResponse> {
    return this.request({
      endpoint: `/v1/api/{{project}}/{{role}}/lambda/pm/workspaces/${workspaceId}/boards`,
      method: RestAPIMethodEnum.POST,
      body: { ...reqObj, workspace_id: workspaceId }
    });
  }

  /**
   * Retrieve user boards for a workspace
   * @param workspaceId Workspace identifier
   * @param page Page number for pagination
   * @param limit Number of items per page
   * @param id Sort identifier
   * @param direction Sort direction
   * @returns Promise resolving to user boards
   */
  async getUserBoards(
    workspaceId: string | number,
    page: number = 1,
    limit: number = 10,
    id: string = "id",
    direction: "asc" | "desc" = "desc"
  ): Promise<MkdAPIResponse> {
    return this.request({
      endpoint: `/v1/api/{{project}}/{{role}}/lambda/pm/workspaces/${workspaceId}/boards?page=${page}&limit=${limit}&sortId=${id}&direction=${direction}`,
      method: RestAPIMethodEnum.GET
    });
  }

  /**
   * Send a query to ChatGPT
   * @param message User prompt
   * @returns Promise resolving to ChatGPT response
   */
  async chatGPT(message: string): Promise<MkdAPIResponse> {
    return this.request({
      endpoint: "/v1/api/qna/query",
      method: RestAPIMethodEnum.POST,
      body: { user_prompt: message }
    });
  }

  /**
   * Transcribe audio/video file using GPT
   * @param file File to transcribe
   * @returns Promise resolving to transcription result
   */
  async gptTranscribe(file: any): Promise<MkdAPIResponse> {
    return this.request({
      endpoint: "/v5/api/deployments/sow/gpt-transcribe",
      method: RestAPIMethodEnum.POST,
      body: file
    });
  }

  /**
   * Translate file using GPT
   * @param file File to translate
   
   * @returns Promise resolving to translation result
   */
  async gptTranslate(file: any): Promise<MkdAPIResponse> {
    return this.request({
      endpoint: "/v5/api/deployments/sow/gpt-translate",
      method: RestAPIMethodEnum.POST,
      body: file
    });
  }

  /**
   * Check the status of the pod
   * @returns Promise resolving to pod status
   */
  async runPodStatus(): Promise<MkdAPIResponse> {
    return this.request({
      endpoint: "/v1/api/qna/server/status",
      method: RestAPIMethodEnum.GET
    });
  }


  
  /**
   * Apple Code API
   * 
   * 
   * @method POST
   * @url /v2/api/lambda/apple/code
   * 
   * @example Request
   * {}
   * 
   * @example Response
   * undefined
   */
  
  async AppleCodeAPI(data: any): Promise<MkdAPIResponse>  {
    return this.request({
      endpoint: "/v2/api/lambda/apple/code",
      method: RestAPIMethodEnum.POST,
      body: data,
    });
  };
  

  /**
   * Apple Login API
   * 
   * 
   * @method GET
   * @url /v2/api/lambda/apple/login
   * 
   * @example Request
   * {}
   * 
   * @example Response
   * undefined
   */
  
  async AppleLoginAPI(data: any): Promise<MkdAPIResponse>  {
    return this.request({
      endpoint: "/v2/api/lambda/apple/login",
      method: RestAPIMethodEnum.GET,
      
    });
  };
  

  /**
   * Apple Code API
   * 
   * 
   * @method POST
   * @url /v2/api/lambda/apple/code
   * 
   * @example Request
   * {}
   * 
   * @example Response
   * undefined
   */
  
  async AppleCodeAPI(data: any): Promise<MkdAPIResponse>  {
    return this.request({
      endpoint: "/v2/api/lambda/apple/code",
      method: RestAPIMethodEnum.POST,
      body: data,
    });
  };
  

  /**
   * Apple Login API
   * 
   * 
   * @method GET
   * @url /v2/api/lambda/apple/login
   * 
   * @example Request
   * {}
   * 
   * @example Response
   * undefined
   */
  
  async AppleLoginAPI(data: any): Promise<MkdAPIResponse>  {
    return this.request({
      endpoint: "/v2/api/lambda/apple/login",
      method: RestAPIMethodEnum.GET,
      
    });
  };
  

  /**
   * Facebook Login API
   * 
   * 
   * @method GET
   * @url /v2/api/lambda/facebook/lambda
   * 
   * @example Request
   * {}
   * 
   * @example Response
   * undefined
   */
  
  async FacebookLoginAPI(data: any): Promise<MkdAPIResponse>  {
    return this.request({
      endpoint: "/v2/api/lambda/facebook/lambda",
      method: RestAPIMethodEnum.GET,
      
    });
  };
  

  /**
   * Facebook Code Webhook
   * 
   * 
   * @method GET
   * @url /v2/api/lambda/facebook/code
   * 
   * @example Request
   * {}
   * 
   * @example Response
   *  * {
 *   "error": false,
 *   "role": "admin",
 *   "qr_code": "qrCode",
 *   "one_time_token": "token",
 *   "expire_at": 60,
 *   "user_id": 1
 * }
   */
  
  async FacebookCodeWebhook(data: any): Promise<MkdAPIResponse>  {
    return this.request({
      endpoint: "/v2/api/lambda/facebook/code",
      method: RestAPIMethodEnum.GET,
      
    });
  };
  

  /**
   * Facebook Login API
   * 
   * 
   * @method GET
   * @url /v2/api/lambda/facebook/lambda
   * 
   * @example Request
   * {}
   * 
   * @example Response
   * undefined
   */
  
  async FacebookLoginAPI(data: any): Promise<MkdAPIResponse>  {
    return this.request({
      endpoint: "/v2/api/lambda/facebook/lambda",
      method: RestAPIMethodEnum.GET,
      
    });
  };
  

  /**
   * Facebook Code Webhook
   * 
   * 
   * @method GET
   * @url /v2/api/lambda/facebook/code
   * 
   * @example Request
   * {}
   * 
   * @example Response
   *  * {
 *   "error": false,
 *   "role": "admin",
 *   "qr_code": "qrCode",
 *   "one_time_token": "token",
 *   "expire_at": 60,
 *   "user_id": 1
 * }
   */
  
  async FacebookCodeWebhook(data: any): Promise<MkdAPIResponse>  {
    return this.request({
      endpoint: "/v2/api/lambda/facebook/code",
      method: RestAPIMethodEnum.GET,
      
    });
  };
  

  /**
   * Google Code API
   * 
   * 
   * @method GET
   * @url /v2/api/lambda/google/code
   * 
   * @example Request
   * {}
   * 
   * @example Response
   * undefined
   */
  
  async GoogleCodeAPI(data: any): Promise<MkdAPIResponse>  {
    return this.request({
      endpoint: "/v2/api/lambda/google/code",
      method: RestAPIMethodEnum.GET,
      
    });
  };
  

  /**
   * Google Login API
   * 
   * 
   * @method GET
   * @url /v2/api/lambda/google/login
   * 
   * @example Request
   * {}
   * 
   * @example Response
   * undefined
   */
  
  async GoogleLoginAPI(data: any): Promise<MkdAPIResponse>  {
    return this.request({
      endpoint: "/v2/api/lambda/google/login",
      method: RestAPIMethodEnum.GET,
      
    });
  };
  

  /**
   * Google Code API
   * 
   * 
   * @method GET
   * @url /v2/api/lambda/google/code
   * 
   * @example Request
   * {}
   * 
   * @example Response
   * undefined
   */
  
  async GoogleCodeAPI(data: any): Promise<MkdAPIResponse>  {
    return this.request({
      endpoint: "/v2/api/lambda/google/code",
      method: RestAPIMethodEnum.GET,
      
    });
  };
  

  /**
   * Google Login API
   * 
   * 
   * @method GET
   * @url /v2/api/lambda/google/login
   * 
   * @example Request
   * {}
   * 
   * @example Response
   * undefined
   */
  
  async GoogleLoginAPI(data: any): Promise<MkdAPIResponse>  {
    return this.request({
      endpoint: "/v2/api/lambda/google/login",
      method: RestAPIMethodEnum.GET,
      
    });
  };
  

  /**
   * microsoft Code API
   * 
   * 
   * @method GET
   * @url /v2/api/lambda/microsoft/code
   * 
   * @example Request
   * {}
   * 
   * @example Response
   * undefined
   */
  
  async MicrosoftCodeAPI(data: any): Promise<MkdAPIResponse>  {
    return this.request({
      endpoint: "/v2/api/lambda/microsoft/code",
      method: RestAPIMethodEnum.GET,
      
    });
  };
  

  /**
   * microsoft Login API
   * 
   * 
   * @method GET
   * @url /v2/api/lambda/microsoft/login
   * 
   * @example Request
   * {}
   * 
   * @example Response
   * undefined
   */
  
  async MicrosoftLoginAPI(data: any): Promise<MkdAPIResponse>  {
    return this.request({
      endpoint: "/v2/api/lambda/microsoft/login",
      method: RestAPIMethodEnum.GET,
      
    });
  };
  

  /**
   * microsoft Code API
   * 
   * 
   * @method GET
   * @url /v2/api/lambda/microsoft/code
   * 
   * @example Request
   * {}
   * 
   * @example Response
   * undefined
   */
  
  async MicrosoftCodeAPI(data: any): Promise<MkdAPIResponse>  {
    return this.request({
      endpoint: "/v2/api/lambda/microsoft/code",
      method: RestAPIMethodEnum.GET,
      
    });
  };
  

  /**
   * microsoft Login API
   * 
   * 
   * @method GET
   * @url /v2/api/lambda/microsoft/login
   * 
   * @example Request
   * {}
   * 
   * @example Response
   * undefined
   */
  
  async MicrosoftLoginAPI(data: any): Promise<MkdAPIResponse>  {
    return this.request({
      endpoint: "/v2/api/lambda/microsoft/login",
      method: RestAPIMethodEnum.GET,
      
    });
  };
  

  /**
   * Register Company Account API
   * 
   * 
   * @method POST
   * @url /v1/api/lambda/company
   * 
   * @example Request
   * {}
   * 
   * @example Response
   * {}
   */
  
  async RegisterCompanyAccountAPI(data: any): Promise<MkdAPIResponse>  {
    return this.request({
      endpoint: "/v1/api/lambda/company",
      method: RestAPIMethodEnum.POST,
      body: data,
    });
  };
  

  /**
   * Update Company Account API
   * 
   * 
   * @method POST
   * @url /v1/api/lambda/company/:id
   * 
   * @example Request
   * {}
   * 
   * @example Response
   * {}
   */
  
  async UpdateCompanyAccountAPI(data: any): Promise<MkdAPIResponse>  {
    return this.request({
      endpoint: "/v1/api/lambda/company/:id",
      method: RestAPIMethodEnum.POST,
      body: data,
    });
  };
  

  /**
   * Add Users API
   * 
   * 
   * @method POST
   * @url /v1/api/lambda/company/user-add
   * 
   * @example Request
   * {}
   * 
   * @example Response
   * {}
   */
  
  async AddUsersAPI(data: any): Promise<MkdAPIResponse>  {
    return this.request({
      endpoint: "/v1/api/lambda/company/user-add",
      method: RestAPIMethodEnum.POST,
      body: data,
    });
  };
  

  /**
   * Suspend/Disable Company API
   * 
   * 
   * @method POST
   * @url /v1/api/lambda/company/suspend/:id
   * 
   * @example Request
   * {}
   * 
   * @example Response
   * {}
   */
  
  async Suspend/DisableCompanyAPI(data: any): Promise<MkdAPIResponse>  {
    return this.request({
      endpoint: "/v1/api/lambda/company/suspend/:id",
      method: RestAPIMethodEnum.POST,
      body: data,
    });
  };
  

  /**
   * Suspend Employee API
   * 
   * 
   * @method POST
   * @url /v1/api/lambda/company/employee/:id
   * 
   * @example Request
   * {}
   * 
   * @example Response
   * {}
   */
  
  async SuspendEmployeeAPI(data: any): Promise<MkdAPIResponse>  {
    return this.request({
      endpoint: "/v1/api/lambda/company/employee/:id",
      method: RestAPIMethodEnum.POST,
      body: data,
    });
  };
  

  /**
   * Suspend User API
   * 
   * 
   * @method POST
   * @url /v1/api/lambda/company/user/:id
   * 
   * @example Request
   * {}
   * 
   * @example Response
   * {}
   */
  
  async SuspendUserAPI(data: any): Promise<MkdAPIResponse>  {
    return this.request({
      endpoint: "/v1/api/lambda/company/user/:id",
      method: RestAPIMethodEnum.POST,
      body: data,
    });
  };
  
}

