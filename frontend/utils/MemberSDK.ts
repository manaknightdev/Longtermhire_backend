
  
  
import TreeSDK from "./TreeSDK";
import MkdSDK from "./MkdSDK";
import { RestAPIMethodEnum } from "./Enums";
import { RestAPIMethod } from "./types/types";


// Comprehensive configuration interface
interface MemberSDKConfig {
  baseurl?: string;
  fe_baseurl?: string;
  project_id?: string;
  secret?: string;
  table?: string;
  GOOGLE_CAPTCHA_SITEKEY?: string;
}

// Comprehensive API response interface
interface MemberAPIResponse {
  status?: number;
  message?: string;
  data?: any;
  list?: any;
  model?: any;
  error?: boolean;
}

interface MemberAPIResponse {
  message?: string;
  [key: string]: any;
}


export default class MemberSDK extends MkdSDK {
  constructor(config: MemberSDKConfig = {}) {
    super(config);
    this._baseurl = config.baseurl || "https://baas.mytechpassport.com";
    this._project_id = config.project_id || "longtermhire";
    this._table = config.table || "";
  }

    /**
   * Oauth Login API for social authentication
   * @param type Social login type (e.g., google, facebook, microsoft, apple)
   * @returns Social login link or error
   */
  async oauthLoginApi(type: "google" | "facebook" | "microsoft" | "apple"): Promise<string> {
    const socialLogin = await fetch(`${this.baseUrl()}/v1/api/${this.getProjectId()}/member/lambda/${type}/login`,);

    const socialLink = await socialLogin.text();

    if (socialLogin.status === 401 || socialLogin.status === 403) {
      throw new Error(socialLink);
    }

    return socialLink;
  }

  async sampleMethod(): Promise<MemberAPIResponse> {
    return this.request({
      endpoint: `/v1/api/{{project}}/{{role}}/lambda/sampleMethod`,
      method: RestAPIMethodEnum.POST,
    });
  }

  
  /**
   * 2FA Login API
   * 
   * 
   * @method POST
   * @url /v1/api/longtermhire/member/lambda/2fa/login
   * 
   * @example Request
   *  * {
 *   "email": "user@example.com",
 *   "password": "password123",
 *   "role": "user"
 * }
   * 
   * @example Response
   *  * {
 *   "error": false,
 *   "role": "user",
 *   "qr_code": "base64_qr_code",
 *   "one_time_token": "token",
 *   "expire_at": 60,
 *   "user_id": 1
 * }
   */
  
  async 2FALoginAPI(data: {email: string, password: string, role: string}): Promise<MemberAPIResponse>  {
    return this.request({
      endpoint: "/v1/api/longtermhire/member/lambda/2fa/login",
      method: RestAPIMethodEnum.POST,
      body: data,
    });
  };
  

  /**
   * 2FA Verify API
   * 
   * 
   * @method POST
   * @url /v2/api/longtermhire/member/lambda/2fa/verify
   * 
   * @example Request
   *  * {
 *   "token": "verification_code"
 * }
   * 
   * @example Response
   *  * {
 *   "error": false,
 *   "valid": true,
 *   "message": "Verified Successfully"
 * }
   */
  
  async 2FAVerifyAPI(data: {token: string}): Promise<MemberAPIResponse>  {
    return this.request({
      endpoint: "/v2/api/longtermhire/member/lambda/2fa/verify",
      method: RestAPIMethodEnum.POST,
      body: data,
    });
  };
  

  /**
   * 2FA Authorization API
   * 
   * 
   * @method POST
   * @url /v2/api/longtermhire/member/lambda/2fa/auth
   * 
   * @example Request
   *  * {
 *   "code": "verification_code",
 *   "token": "one_time_token"
 * }
   * 
   * @example Response
   *  * {
 *   "error": false,
 *   "role": "user",
 *   "token": "access_token",
 *   "expire_at": 3600,
 *   "user_id": 1
 * }
   */
  
  async 2FAAuthorizationAPI(data: {code: string, token: string}): Promise<MemberAPIResponse>  {
    return this.request({
      endpoint: "/v2/api/longtermhire/member/lambda/2fa/auth",
      method: RestAPIMethodEnum.POST,
      body: data,
    });
  };
  

  /**
   * Forgot Password API
   * 
   * 
   * @method POST
   * @url /v1/api/longtermhire/member/lambda/forgot
   * 
   * @example Request
   * {}
   * 
   * @example Response
   * undefined
   */
  
  async ForgotPasswordAPI(data: any): Promise<MemberAPIResponse>  {
    return this.request({
      endpoint: "/v1/api/longtermhire/member/lambda/forgot",
      method: RestAPIMethodEnum.POST,
      body: data,
    });
  };
  

  /**
   * Forgot Password Mobile API
   * 
   * 
   * @method POST
   * @url /v1/api/longtermhire/member/lambda/mobile/forgot
   * 
   * @example Request
   * {}
   * 
   * @example Response
   * undefined
   */
  
  async ForgotPasswordMobileAPI(data: any): Promise<MemberAPIResponse>  {
    return this.request({
      endpoint: "/v1/api/longtermhire/member/lambda/mobile/forgot",
      method: RestAPIMethodEnum.POST,
      body: data,
    });
  };
  

  /**
   * User Login API
   * 
   * 
   * @method POST
   * @url /v1/api/longtermhire/member/lambda/login
   * 
   * @example Request
   *  * {
 *   "email": "user@example.com",
 *   "password": "password123"
 * }
   * 
   * @example Response
   *  * {
 *   "error": false,
 *   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
 *   "refresh": "...",
 *   "user": {
 *     "id": 1,
 *     "email": "user@example.com",
 *     "name": "Test User"
 *   }
 * }
   */
  
  async UserLoginAPI(data: {email: string, password: string}): Promise<MemberAPIResponse>  {
    return this.request({
      endpoint: "/v1/api/longtermhire/member/lambda/login",
      method: RestAPIMethodEnum.POST,
      body: data,
    });
  };
  

  /**
   * Generate Magic Link
   * 
   * 
   * @method POST
   * @url /v1/api/longtermhire/member/lambda/magic-login/generate
   * 
   * @example Request
   * {}
   * 
   * @example Response
   * undefined
   */
  
  async GenerateMagicLink(data: any): Promise<MemberAPIResponse>  {
    return this.request({
      endpoint: "/v1/api/longtermhire/member/lambda/magic-login/generate",
      method: RestAPIMethodEnum.POST,
      body: data,
    });
  };
  

  /**
   * Magic Login
   * 
   * 
   * @method POST
   * @url /v1/api/longtermhire/member/lambda/magic-login
   * 
   * @example Request
   * {}
   * 
   * @example Response
   * undefined
   */
  
  async MagicLogin(data: any): Promise<MemberAPIResponse>  {
    return this.request({
      endpoint: "/v1/api/longtermhire/member/lambda/magic-login",
      method: RestAPIMethodEnum.POST,
      body: data,
    });
  };
  

  /**
   * Get Preference
   * 
   * 
   * @method GET
   * @url /v1/api/longtermhire/member/lambda/preference
   * 
   * @example Request
   * {}
   * 
   * @example Response
   *  * {
 *   "error": false,
 *   "model": {
 *     "id": 1,
 *     "user_id": 1,
 *     "name": "preference",
 *     "value": "value"
 *   }
 * }
   */
  
  async GetPreference(data: any): Promise<MemberAPIResponse>  {
    return this.request({
      endpoint: "/v1/api/longtermhire/member/lambda/preference",
      method: RestAPIMethodEnum.GET,
      
    });
  };
  

  /**
   * Update Preference
   * 
   * 
   * @method POST
   * @url /v1/api/longtermhire/member/lambda/preference
   * 
   * @example Request
   * {}
   * 
   * @example Response
   *  * {
 *   "error": false,
 *   "message": "Updated"
 * }
   */
  
  async UpdatePreference(data: any): Promise<MemberAPIResponse>  {
    return this.request({
      endpoint: "/v1/api/longtermhire/member/lambda/preference",
      method: RestAPIMethodEnum.POST,
      body: data,
    });
  };
  

  /**
   * User Profile API
   * 
   * 
   * @method GET
   * @url /v1/api/longtermhire/member/lambda/profile
   * 
   * @example Request
   * {}
   * 
   * @example Response
   *  * {
 *   "error": false,
 *   "user": {
 *     "id": 1,
 *     "email": "user@example.com",
 *     "name": "Test User",
 *     "created_at": "2023-01-01T00:00:00.000Z"
 *   }
 * }
   */
  
  async UserProfileAPI(data: any): Promise<MemberAPIResponse>  {
    return this.request({
      endpoint: "/v1/api/longtermhire/member/lambda/profile",
      method: RestAPIMethodEnum.GET,
      
    });
  };
  

  /**
   * Update User Profile API
   * 
   * 
   * @method PUT
   * @url /v1/api/longtermhire/member/lambda/profile
   * 
   * @example Request
   *  * {
 *   "name": "Updated Name",
 *   "profile_image": "https://example.com/image.jpg"
 * }
   * 
   * @example Response
   *  * {
 *   "error": false,
 *   "message": "Profile updated successfully",
 *   "user": {
 *     "id": 1,
 *     "email": "user@example.com",
 *     "name": "Updated Name",
 *     "profile_image": "https://example.com/image.jpg"
 *   }
 * }
   */
  
  async UpdateUserProfileAPI(data: {name: string, profile_image: string}): Promise<MemberAPIResponse>  {
    return this.request({
      endpoint: "/v1/api/longtermhire/member/lambda/profile",
      method: RestAPIMethodEnum.PUT,
      body: data,
    });
  };
  

  /**
   * Refresh Token API
   * 
   * 
   * @method GET
   * @url /v1/api/longtermhire/member/lambda/refresh_token
   * 
   * @example Request
   * undefined
   * 
   * @example Response
   *  * {
 *   "error": false,
 *   "access_token": "New JWT Token",
 *   "refresh_token": "New JWT Token"
 * }
   */
  
  async RefreshTokenAPI(data: undefined): Promise<MemberAPIResponse>  {
    return this.request({
      endpoint: "/v1/api/longtermhire/member/lambda/refresh_token",
      method: RestAPIMethodEnum.GET,
      
    });
  };
  

  /**
   * Register API
   * 
   * 
   * @method POST
   * @url /v1/api/longtermhire/member/lambda/register
   * 
   * @example Request
   *  * {
 *   "email": "a@gmail.com",
 *   "first_name": "wxy",
 *   "last_name": "User",
 *   "is_refresh": true,
 *   "password": "a123456"
 * }
   * 
   * @example Response
   *  * {
 *   "error": false,
 *   "role": "member",
 *   "token": "JWT Token",
 *   "expire_at": 3600,
 *   "user_id": 20
 * }
   */
  
  async RegisterAPI(data: {email: string, first_name: string, last_name: string, is_refresh: boolean, password: string}): Promise<MemberAPIResponse>  {
    return this.request({
      endpoint: "/v1/api/longtermhire/member/lambda/register",
      method: RestAPIMethodEnum.POST,
      body: data,
    });
  };
  

  /**
   * Reset Password API
   * 
   * 
   * @method POST
   * @url /v1/api/longtermhire/member/lambda/reset
   * 
   * @example Request
   *  * {
 *   "code": 234556,
 *   "password": "password"
 * }
   * 
   * @example Response
   *  * {
 *   "error": false,
 *   "message": "Password Reset Successfully"
 * }
   */
  
  async ResetPasswordAPI(data: {code: number, password: string}): Promise<MemberAPIResponse>  {
    return this.request({
      endpoint: "/v1/api/longtermhire/member/lambda/reset",
      method: RestAPIMethodEnum.POST,
      body: data,
    });
  };
  

  /**
   * Mobile Reset Password API
   * 
   * 
   * @method POST
   * @url /v1/api/longtermhire/member/lambda/reset
   * 
   * @example Request
   *  * {
 *   "code": 234556,
 *   "password": "password"
 * }
   * 
   * @example Response
   *  * {
 *   "error": false,
 *   "message": "Password Reset Successfully"
 * }
   */
  
  async MobileResetPasswordAPI(data: {code: number, password: string}): Promise<MemberAPIResponse>  {
    return this.request({
      endpoint: "/v1/api/longtermhire/member/lambda/reset",
      method: RestAPIMethodEnum.POST,
      body: data,
    });
  };
  

  /**
   * GET single or many record
   * 
   * 
   * @method GET
   * @url /v1/api/records/longtermhire/member/:table/:id
   * 
   * @example Request
   * {}
   * 
   * @example Response
   *  * {
 *   "error": false,
 *   "mappings": {
 *     "table1": {
 *       "field1": "field1",
 *       "field2": "field2"
 *     },
 *     "table2": {
 *       "field3": "field3",
 *       "field4": "field4"
 *     }
 *   },
 *   "list": [
 *     {
 *       "id": 1,
 *       "name": "John Doe"
 *     },
 *     {
 *       "id": 2,
 *       "name": "Jane Doe"
 *     }
 *   ]
 * }
   */
  
  async GETSingleOrManyRecord(data: any): Promise<MemberAPIResponse>  {
    return this.request({
      endpoint: "/v1/api/records/longtermhire/member/:table/:id",
      method: RestAPIMethodEnum.GET,
      
    });
  };
  

  /**
   * LIST/PAGINATE records
   * 
   * 
   * @method GET
   * @url /v1/api/records/longtermhire/member/:table
   * 
   * @example Request
   * {}
   * 
   * @example Response
   *  * {
 *   "error": false,
 *   "list": [
 *     {
 *       "id": 1,
 *       "name": "John Doe"
 *     },
 *     {
 *       "id": 2,
 *       "name": "Jane Doe"
 *     }
 *   ]
 * }
   */
  
  async LIST/PAGINATERecords(data: any): Promise<MemberAPIResponse>  {
    return this.request({
      endpoint: "/v1/api/records/longtermhire/member/:table",
      method: RestAPIMethodEnum.GET,
      
    });
  };
  

  /**
   * CREATE record
   * 
   * 
   * @method POST
   * @url /v1/api/records/longtermhire/member/:table
   * 
   * @example Request
   * {}
   * 
   * @example Response
   *  * {
 *   "error": false,
 *   "model": {
 *     "id": 1,
 *     "name": "John Doe"
 *   }
 * }
   */
  
  async CREATERecord(data: any): Promise<MemberAPIResponse>  {
    return this.request({
      endpoint: "/v1/api/records/longtermhire/member/:table",
      method: RestAPIMethodEnum.POST,
      body: data,
    });
  };
  

  /**
   * UPDATE record
   * 
   * 
   * @method PUT
   * @url /v1/api/records/longtermhire/member/:table/:id
   * 
   * @example Request
   * {}
   * 
   * @example Response
   *  * {
 *   "error": false,
 *   "model": {
 *     "id": 1,
 *     "name": "John Doe"
 *   }
 * }
   */
  
  async UPDATERecord(data: any): Promise<MemberAPIResponse>  {
    return this.request({
      endpoint: "/v1/api/records/longtermhire/member/:table/:id",
      method: RestAPIMethodEnum.PUT,
      body: data,
    });
  };
  

  /**
   * DELETE record
   * 
   * 
   * @method DELETE
   * @url /v1/api/records/longtermhire/member/:table/:id
   * 
   * @example Request
   * {}
   * 
   * @example Response
   *  * {
 *   "error": false,
 *   "message": "Record deleted successfully"
 * }
   */
  
  async DELETERecord(data: any): Promise<MemberAPIResponse>  {
    return this.request({
      endpoint: "/v1/api/records/longtermhire/member/:table/:id",
      method: RestAPIMethodEnum.DELETE,
      
    });
  };
  

  /**
   * File Upload API
   * 
   * 
   * @method POST
   * @url /v1/api/longtermhire/member/lambda/upload
   * 
   * @example Request
   * undefined
   * 
   * @example Response
   *  * {
 *   "error": false,
 *   "url": "https://example.com/uploads/file.jpg",
 *   "path": "/uploads/file.jpg"
 * }
   */
  
  async FileUploadAPI(data: undefined): Promise<MemberAPIResponse>  {
    return this.request({
      endpoint: "/v1/api/longtermhire/member/lambda/upload",
      method: RestAPIMethodEnum.POST,
      body: data,
    });
  };
  

  /**
   * Verify Email API
   * 
   * 
   * @method POST
   * @url /v1/api/longtermhire/member/lambda/verify
   * 
   * @example Request
   *  * {
 *   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxOCwidG9rZW4iOiJiMmpzdHptdGk0IiwiaWF0IjoxNzM3NTAwMzA4LCJleHAiOjE3Mzc1ODY3MDh9.cNBhlA7UtF3Mil3IasevFR5NeYJTBOipoMQEvkzo3rE"
 * }
   * 
   * @example Response
   *  * {
 *   "error": false,
 *   "message": "Your email is verified!"
 * }
   */
  
  async VerifyEmailAPI(data: {token: string}): Promise<MemberAPIResponse>  {
    return this.request({
      endpoint: "/v1/api/longtermhire/member/lambda/verify",
      method: RestAPIMethodEnum.POST,
      body: data,
    });
  };
  
  
  }
  