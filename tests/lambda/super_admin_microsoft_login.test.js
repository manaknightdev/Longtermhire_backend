const APITestFramework = require("../../../../tests/apitesting.base.js");

const BASE_URL = "http://localhost:5172";

/**
 * Microsoft Login API Tests
 * Class-based implementation of the Microsoft Login API tests
 */
class MicrosoftLoginTests {
  constructor() {
    this.framework = new APITestFramework();
    
    // Define expected response schema
    this.microsoftLoginSchema = {
      error: false,
      role: "string",
      access_token: "string",
      refresh_token: "string",
      expire_at: "number",
      user_id: "number"
    };
    
    this.setupTests();
  }

  setupTests() {
    this.framework.describe("super_admin Microsoft Login API Tests", () => {
      let mockAccessToken;

      // Setup before each test
      this.framework.beforeEach(async () => {
        // Setup mock data
        mockAccessToken = "mock.microsoft.access.token";
      });

      // Microsoft Login URL test
      this.framework.addTestCase("super_admin Microsoft Login URL - Success Path", async () => {
        // Create spy to track request
        const requestSpy = this.framework.createSpy(this.framework, "makeRequest");

        // Mock the API response
        this.framework.mockRequest(
          `${BASE_URL}/v2/api/lambda/microsoft/login?role=super_admin`,
          "https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=mock_client_id&redirect_uri=mock_redirect_uri&response_type=code&scope=openid%20profile%20email&state=mock_state",
          {
            status: 200,
            headers: {
              "Content-Type": "text/plain"
            }
          }
        );

        const response = await this.framework.makeRequest(
          `${BASE_URL}/v2/api/lambda/microsoft/login?role=super_admin`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json"
            }
          }
        );

        // Assertions
        this.framework.assert(
          response.status === 200,
          "Microsoft Login URL should return 200 status"
        );
        this.framework.assert(
          response.body.includes("microsoftonline.com"),
          "Response should contain Microsoft authorization URL"
        );

        // Verify request was made correctly
        this.framework.assert(
          requestSpy.callCount() === 1,
          "API should be called exactly once"
        );
      });

      // Microsoft Code API test
      this.framework.addTestCase("super_admin Microsoft Code API - Success Path", async () => {
        // Mock the API response
        this.framework.mockRequest(
          `${BASE_URL}/v2/api/lambda/microsoft/code`,
          {
            error: false,
            role: "super_admin",
            access_token: "mock_access_token",
            refresh_token: "mock_refresh_token",
            expire_at: 3600,
            user_id: 123
          },
          {
            status: 200,
            headers: {
              "Content-Type": "application/json"
            }
          }
        );

        const response = await this.framework.makeRequest(
          `${BASE_URL}/v2/api/lambda/microsoft/code`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              code: "mock_auth_code",
              state: "test_project~secret"
            })
          }
        );

        // Assertions
        this.framework.assert(
          response.status === 200,
          "Microsoft Code API should return 200 status"
        );
        this.framework.assert(
          response.body.error === false,
          "Microsoft Code API error flag should be false"
        );

        // Enhanced assertions
        this.framework.assertions.assertResponseValid(response, this.microsoftLoginSchema);
        this.framework.assertions.assertEquals(
          response.body.role,
          "super_admin",
          "Role should be super_admin"
        );
      });

      // Microsoft Code API error test
      this.framework.addTestCase("super_admin Microsoft Code API - Error Path", async () => {
        // Mock the API response for error case
        this.framework.mockRequest(
          `${BASE_URL}/v2/api/lambda/microsoft/code`,
          {
            error: true,
            message: "Invalid authorization code"
          },
          {
            status: 403,
            headers: {
              "Content-Type": "application/json"
            }
          }
        );

        const response = await this.framework.makeRequest(
          `${BASE_URL}/v2/api/lambda/microsoft/code`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              code: "invalid_code",
              state: "test_project~secret"
            })
          }
        );

        // Assertions for error case
        this.framework.assertions.assertEquals(
          response.status,
          403,
          "Should return 403 status for invalid code"
        );
        this.framework.assertions.assertEquals(
          response.body.error,
          true,
          "Error flag should be true"
        );
        this.framework.assertions.assertEquals(
          response.body.message,
          "Invalid authorization code",
          "Should return correct error message"
        );
      });

      // Microsoft Mobile Login test
      this.framework.addTestCase("super_admin Microsoft Mobile Login - Success Path", async () => {
        // Mock the API response
        this.framework.mockRequest(
          `${BASE_URL}/v2/api/lambda/microsoft/login/mobile`,
          {
            error: false,
            role: "super_admin",
            access_token: "mock_access_token",
            refresh_token: "mock_refresh_token",
            expire_at: 3600,
            user_id: 123
          },
          {
            status: 200,
            headers: {
              "Content-Type": "application/json"
            }
          }
        );

        const response = await this.framework.makeRequest(
          `${BASE_URL}/v2/api/lambda/microsoft/login/mobile`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              accessToken: mockAccessToken,
              role: "super_admin",
              projectId: "test_project"
            })
          }
        );

        // Assertions
        this.framework.assert(
          response.status === 200,
          "Microsoft Mobile Login should return 200 status"
        );
        this.framework.assert(
          response.body.error === false,
          "Microsoft Mobile Login error flag should be false"
        );

        // Enhanced assertions
        this.framework.assertions.assertResponseValid(response, this.microsoftLoginSchema);
        this.framework.assertions.assertEquals(
          response.body.role,
          "super_admin",
          "Role should be super_admin"
        );
      });

      // Microsoft Mobile Login error test
      this.framework.addTestCase("super_admin Microsoft Mobile Login - Error Path", async () => {
        // Mock the API response for error case
        this.framework.mockRequest(
          `${BASE_URL}/v2/api/lambda/microsoft/login/mobile`,
          {
            error: true,
            message: "Invalid access token"
          },
          {
            status: 403,
            headers: {
              "Content-Type": "application/json"
            }
          }
        );

        const response = await this.framework.makeRequest(
          `${BASE_URL}/v2/api/lambda/microsoft/login/mobile`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              accessToken: "invalid_token",
              role: "super_admin",
              projectId: "test_project"
            })
          }
        );

        // Assertions for error case
        this.framework.assertions.assertEquals(
          response.status,
          403,
          "Should return 403 status for invalid token"
        );
        this.framework.assertions.assertEquals(
          response.body.error,
          true,
          "Error flag should be true"
        );
        this.framework.assertions.assertEquals(
          response.body.message,
          "Invalid access token",
          "Should return correct error message"
        );
      });
    });
  }

  async runTests() {
    try {
      // Run the tests and return the results directly
      return await this.framework.runTests();
    } catch (error) {
      console.error("Test execution failed:", error);
      throw error;
    }
  }
}

// Create an instance of the test class and run the tests
const tests = new MicrosoftLoginTests();
module.exports = tests
  .runTests()
  .then((report) => {
    if (report.failed > 0) {
      process.exit(1);
    }
    return report; // Important: return the report for the test runner
  })
  .catch((error) => {
    console.error("Test framework error:", error);
    process.exit(1);
  });
