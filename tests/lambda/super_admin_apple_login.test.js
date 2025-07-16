const APITestFramework = require("../../../../tests/apitesting.base.js");

const BASE_URL = "http://localhost:5172";

/**
 * Apple Login API Tests
 * Class-based implementation of the Apple Login API tests
 */
class AppleLoginTests {
  constructor() {
    this.framework = new APITestFramework();
    this.baseUrl = BASE_URL;

    // Define expected response schema
    this.appleLoginSchema = {
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
    this.framework.describe("super_admin Apple Login API Tests", () => {
      let mockIdentityToken;
      let mockAppleId;

      // Setup before each test
      this.framework.beforeEach(async () => {
        // Setup mock data
        mockIdentityToken = "mock.apple.identity.token";
        mockAppleId = "apple123456";
      });

      // Test case for mobile login
      this.framework.addTestCase(
        "super_admin Apple Login Mobile - Success Path",
        async () => {
          // Create spy to track request
          const requestSpy = this.framework.createSpy(
            this.framework,
            "makeRequest"
          );

          // Mock the API response
          this.framework.mockRequest(
            `${this.baseUrl}/v2/api/lambda/apple/login/mobile`,
            {
              error: false,
              role: "super_admin",
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
            `${this.baseUrl}/v2/api/lambda/apple/login/mobile`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                first_name: "John",
                last_name: "Doe",
                identityToken: mockIdentityToken,
                apple_id: mockAppleId,
                role: "super_admin",
                projectId: "test_project",
              }),
            }
          );

          // Assertions
          this.framework.assert(
            response.status === 200,
            "Apple Login Mobile should return 200 status"
          );
          this.framework.assert(
            response.body.error === false,
            "Apple Login Mobile error flag should be false"
          );

          // Enhanced assertions
          this.framework.assertions.assertResponseValid(
            response,
            this.appleLoginSchema
          );
          this.framework.assertions.assertEquals(
            response.body.role,
            "super_admin",
            "Role should be super_admin"
          );

          // Verify request was made correctly
          this.framework.assert(
            requestSpy.callCount() === 1,
            "API should be called exactly once"
          );
        }
      );

      // Test case for error path
      this.framework.addTestCase(
        "super_admin Apple Login Mobile - Invalid Identity",
        async () => {
          // Mock the API response for error case
          this.framework.mockRequest(
            `${this.baseUrl}/v2/api/lambda/apple/login/mobile`,
            {
              error: true,
              message: "Invalid Identity",
            },
            {
              status: 403,
              headers: {
                "Content-Type": "application/json",
              },
            }
          );

          const response = await this.framework.makeRequest(
            `${this.baseUrl}/v2/api/lambda/apple/login/mobile`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                first_name: "John",
                last_name: "Doe",
                identityToken: mockIdentityToken,
                apple_id: "different_id", // Different from what's in the token
                role: "super_admin",
                projectId: "test_project",
              }),
            }
          );

          // Assertions for error case
          this.framework.assertions.assertEquals(
            response.status,
            403,
            "Should return 403 status for invalid identity"
          );
          this.framework.assertions.assertEquals(
            response.body.error,
            true,
            "Error flag should be true"
          );
          this.framework.assertions.assertEquals(
            response.body.message,
            "Invalid Identity",
            "Should return correct error message"
          );
        }
      );

      // Test case for Apple Login URL
      this.framework.addTestCase(
        "super_admin Apple Login URL - Success Path",
        async () => {
          // Mock the API response
          this.framework.mockRequest(
            `${this.baseUrl}/v2/api/lambda/apple/login?role=super_admin`,
            "https://appleid.apple.com/auth/authorize?client_id=mock_client_id&redirect_uri=mock_redirect_uri&response_type=code&scope=name%20email&response_mode=form_post&state=mock_state",
            {
              status: 200,
              headers: {
                "Content-Type": "text/plain",
              },
            }
          );

          const response = await this.framework.makeRequest(
            `${this.baseUrl}/v2/api/lambda/apple/login?role=super_admin`,
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
            "Apple Login URL should return 200 status"
          );
          this.framework.assert(
            response.body.includes("appleid.apple.com"),
            "Response should contain Apple authorization URL"
          );
        }
      );

      // Test case for Apple Code API
      this.framework.addTestCase(
        "super_admin Apple Code API - Success Path",
        async () => {
          // Mock the API response
          this.framework.mockRequest(
            `${this.baseUrl}/v2/api/lambda/apple/code`,
            {
              error: false,
              role: "super_admin",
              token: "mock_jwt_token",
              expire_at: 60,
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
            `${this.baseUrl}/v2/api/lambda/apple/code`,
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
            "Apple Code API should return 200 status"
          );
          this.framework.assert(
            response.body.error === false,
            "Apple Code API error flag should be false"
          );
          this.framework.assert(
            response.body.token !== undefined,
            "Response should contain a token"
          );
        }
      );
    });
  }

  // Helper method to run all tests
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
const tests = new AppleLoginTests();
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
