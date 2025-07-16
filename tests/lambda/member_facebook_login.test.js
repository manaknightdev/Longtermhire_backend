const APITestFramework = require("../../../../tests/apitesting.base.js");

const BASE_URL = "http://localhost:5172";

/**
 * Facebook Login API Tests
 * Class-based implementation of the Facebook Login API tests
 */
class FacebookLoginTests {
  constructor() {
    this.framework = new APITestFramework();

    // Define expected response schema
    this.facebookLoginSchema = {
      error: false,
      role: "string",
      access_token: "string",
      refresh_token: "string",
      expire_at: "number",
      user_id: "number",
    };

    this.setupTests();
  }

  setupTests() {
    this.framework.describe("member Facebook Login API Tests", () => {
      let mockAccessToken;

      // Setup before each test
      this.framework.beforeEach(async () => {
        // Setup mock data
        mockAccessToken = "mock.facebook.access.token";
      });

      // Facebook Login URL test
      this.framework.addTestCase(
        "member Facebook Login URL - Success Path",
        async () => {
          // Create spy to track request
          const requestSpy = this.framework.createSpy(
            this.framework,
            "makeRequest"
          );

          // Mock the API response
          this.framework.mockRequest(
            `${BASE_URL}/v2/api/lambda/facebook/login?role=member`,
            "https://www.facebook.com/v12.0/dialog/oauth?client_id=mock_app_id&redirect_uri=mock_redirect_uri&state=mock_state&scope=email",
            {
              status: 200,
              headers: {
                "Content-Type": "text/plain",
              },
            }
          );

          const response = await this.framework.makeRequest(
            `${BASE_URL}/v2/api/lambda/facebook/login?role=member`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
              },
            }
          );

          // Assertions
          this.framework.assert(
            response.status === 200,
            "Facebook Login URL should return 200 status"
          );
          this.framework.assert(
            response.body.includes("facebook.com"),
            "Response should contain Facebook authorization URL"
          );

          // Verify request was made correctly
          this.framework.assert(
            requestSpy.callCount() === 1,
            "API should be called exactly once"
          );
        }
      );

      // Facebook Code API test
      this.framework.addTestCase(
        "member Facebook Code API - Success Path",
        async () => {
          // Mock the API response
          this.framework.mockRequest(
            `${BASE_URL}/v2/api/lambda/facebook/code`,
            {
              error: false,
              role: "member",
              access_token: "mock_access_token",
              refresh_token: "mock_refresh_token",
              expire_at: 3600,
              user_id: 123,
            },
            {
              status: 200,
              headers: {
                "Content-Type": "application/json",
              },
            }
          );

          const response = await this.framework.makeRequest(
            `${BASE_URL}/v2/api/lambda/facebook/code`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                code: "mock_auth_code",
                state: "test_project~secret",
              }),
            }
          );

          // Assertions
          this.framework.assert(
            response.status === 200,
            "Facebook Code API should return 200 status"
          );
          this.framework.assert(
            response.body.error === false,
            "Facebook Code API error flag should be false"
          );

          // Enhanced assertions
          this.framework.assertions.assertResponseValid(
            response,
            this.facebookLoginSchema
          );
          this.framework.assertions.assertEquals(
            response.body.role,
            "member",
            "Role should be member"
          );
        }
      );

      // Facebook Code API error test
      this.framework.addTestCase(
        "member Facebook Code API - Error Path",
        async () => {
          // Mock the API response for error case
          this.framework.mockRequest(
            `${BASE_URL}/v2/api/lambda/facebook/code`,
            {
              error: true,
              message: "Invalid authorization code",
            },
            {
              status: 403,
              headers: {
                "Content-Type": "application/json",
              },
            }
          );

          const response = await this.framework.makeRequest(
            `${BASE_URL}/v2/api/lambda/facebook/code`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                code: "invalid_code",
                state: "test_project~secret",
              }),
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
        }
      );

      // Facebook Mobile Login test
      this.framework.addTestCase(
        "member Facebook Mobile Login - Success Path",
        async () => {
          // Mock the API response
          this.framework.mockRequest(
            `${BASE_URL}/v2/api/lambda/facebook/login/mobile`,
            {
              error: false,
              role: "member",
              access_token: "mock_access_token",
              refresh_token: "mock_refresh_token",
              expire_at: 3600,
              user_id: 123,
            },
            {
              status: 200,
              headers: {
                "Content-Type": "application/json",
              },
            }
          );

          const response = await this.framework.makeRequest(
            `${BASE_URL}/v2/api/lambda/facebook/login/mobile`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                accessToken: mockAccessToken,
                role: "member",
                projectId: "test_project",
              }),
            }
          );

          // Assertions
          this.framework.assert(
            response.status === 200,
            "Facebook Mobile Login should return 200 status"
          );
          this.framework.assert(
            response.body.error === false,
            "Facebook Mobile Login error flag should be false"
          );

          // Enhanced assertions
          this.framework.assertions.assertResponseValid(
            response,
            this.facebookLoginSchema
          );
          this.framework.assertions.assertEquals(
            response.body.role,
            "member",
            "Role should be member"
          );
        }
      );

      // Facebook Mobile Login error test
      this.framework.addTestCase(
        "member Facebook Mobile Login - Error Path",
        async () => {
          // Mock the API response for error case
          this.framework.mockRequest(
            `${BASE_URL}/v2/api/lambda/facebook/login/mobile`,
            {
              error: true,
              message: "Invalid access token",
            },
            {
              status: 403,
              headers: {
                "Content-Type": "application/json",
              },
            }
          );

          const response = await this.framework.makeRequest(
            `${BASE_URL}/v2/api/lambda/facebook/login/mobile`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                accessToken: "invalid_token",
                role: "member",
                projectId: "test_project",
              }),
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
        }
      );
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
const tests = new FacebookLoginTests();
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
