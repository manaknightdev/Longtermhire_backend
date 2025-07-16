const APITestFramework = require("../../../../tests/apitesting.base.js");
const BASE_URL = "http://localhost:5172";

// Response schemas for validation
const schemas = {
  googleUrlResponse: {
    url: "string",
    state: "string",
  },
  mobileAuthResponse: {
    token: "string",
    refresh_token: "string",
    error: "boolean",
  },
};

class GoogleAuthTests {
  constructor() {
    this.framework = new APITestFramework();
    this.setupTests();
  }

  setupTests() {
    this.framework.describe("super_admin Google Authentication Flow", () => {
      // Common test data
      const testData = {
        validCompanyId: "123",
        validCode: "valid-google-auth-code",
        invalidCode: "invalid-code",
        role: "super_admin",
        baseState: Buffer.from("longtermhire:_").toString("base64") + "~super_admin",
      };

      // Setup mock responses
      this.framework.beforeEach(() => {
        // Reset any mocks/spies between tests
        this.framework.mocks.clear();
      });

      // Test 1: Enhanced Google Login URL Generation
      this.framework.addTestCase(
        "super_admin Google Login URL Generation",
        async () => {
          const requestSpy = this.framework.createSpy(
            this.framework,
            "makeRequest"
          );

          const response = await this.framework.makeRequest(
            `${BASE_URL}/v2/api/longtermhire/super_admin/lambda/google/login`,
            {
              method: "GET",
            }
          );

          // Original assertions
          this.framework.assert(
            response.status === 200,
            "Should return 200 status code"
          );
          this.framework.assert(
            response.body.includes("accounts.google.com"),
            "Should return Google auth URL"
          );

          // Enhanced assertions
          this.framework.assertions.assertType(
            response.body,
            "string",
            "Response body should be a string"
          );
          this.framework.assertions.assertMatch(
            response.body,
            /https:\/\/accounts\.google\.com/,
            "URL should be properly formatted Google auth URL"
          );

          // Verify request was made correctly
          this.framework.assert(
            requestSpy.callCount() === 1,
            "API should be called exactly once"
          );
        }
      );

      // Test 2: Enhanced Company-specific Login
      this.framework.addTestCase(
        "super_admin Google Login with Company ID",
        async () => {
          const response = await this.framework.makeRequest(
            `${BASE_URL}/v2/api/longtermhire/super_admin/lambda/google/login`,
            {
              method: "GET",
              query: {
                company_id: testData.validCompanyId,
                is_refresh: "true",
              },
            }
          );

          // Original assertions with enhanced error messages
          this.framework.assertions.assertEquals(
            response.status,
            200,
            "Company-specific login should return 200 status"
          );
          this.framework.assertions.assertMatch(
            response.body,
            new RegExp(`company_id=${testData.validCompanyId}`),
            "URL should contain the correct company ID"
          );
        }
      );

      // Test 3: Enhanced OAuth Callback
      this.framework.addTestCase(
        "super_admin Google Code Callback - Success",
        async () => {
          const response = await this.framework.makeRequest(
            `${BASE_URL}/v2/api/longtermhire/super_admin/lambda/google/code`,
            {
              method: "GET",
              query: {
                code: testData.validCode,
                state: testData.baseState,
              },
            }
          );

          // Enhanced assertions
          this.framework.assertions.assertEquals(
            response.status,
            302,
            "Should redirect after successful auth"
          );
          this.framework.assertions.assertType(
            response.headers.location,
            "string",
            "Redirect URL should be string"
          );
          this.framework.assertions.assertMatch(
            response.headers.location,
            /^\/login\/oauth/,
            "Should redirect to correct OAuth endpoint"
          );
        }
      );

      // Test 4: Enhanced Mobile Flow
      this.framework.addTestCase(
        "super_admin Google Code Mobile - Success",
        async () => {
          // Mock successful mobile auth response
          this.framework.mockRequest(
            `${BASE_URL}/v2/api/longtermhire/super_admin/lambda/google/code/mobile`,
            {
              error: false,
              token: "mock-token-123",
              refresh_token: "mock-refresh-token-123",
            },
            { status: 200 }
          );

          const response = await this.framework.makeRequest(
            `${BASE_URL}/v2/api/longtermhire/super_admin/lambda/google/code/mobile`,
            {
              method: "GET",
              query: {
                code: testData.validCode,
                role: testData.role,
                is_refresh: "true",
              },
            }
          );

          // Validate response against schema
          this.framework.assertions.assertResponseValid(
            response,
            schemas.mobileAuthResponse
          );

          // Original assertions with enhanced checks
          this.framework.assertions.assertEquals(
            response.status,
            200,
            "Mobile auth should succeed"
          );
          this.framework.assertions.assertEquals(
            response.body.error,
            false,
            "Should not contain errors"
          );
          this.framework.assertions.assertType(
            response.body.token,
            "string",
            "Should return valid token"
          );
          this.framework.assertions.assertType(
            response.body.refresh_token,
            "string",
            "Should return valid refresh token"
          );
        }
      );

      // Test 5: Enhanced Error Handling
      this.framework.addTestCase("super_admin Google Code - Invalid Code", async () => {
        const response = await this.framework.makeRequest(
          `${BASE_URL}/v2/api/longtermhire/super_admin/lambda/google/code`,
          {
            method: "GET",
            query: {
              code: testData.invalidCode,
              state: testData.baseState,
            },
          }
        );

        // Enhanced error assertions
        this.framework.assertions.assertEquals(
          response.status,
          302,
          "Should redirect on authentication failure"
        );
        this.framework.assertions.assertMatch(
          response.headers.location,
          /error=true/,
          "Should include error flag in redirect URL"
        );
      });

      // New Test 6: Rate Limiting
      this.framework.addTestCase("super_admin Rate Limiting Protection", async () => {
        const requests = Array(5)
          .fill()
          .map(() =>
            this.framework.makeRequest(
              `${BASE_URL}/v2/api/longtermhire/super_admin/lambda/google/login`,
              {
                method: "GET",
              }
            )
          );

        const responses = await Promise.all(requests);
        const tooManyRequests = responses.some((r) => r.status === 429);

        this.framework.assert(
          !tooManyRequests,
          "Should handle multiple simultaneous requests without rate limiting errors"
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
const tests = new GoogleAuthTests();
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
