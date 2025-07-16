const APITestFramework = require("../apitesting.base.js");

/**
 * Profile API Tests
 * Class-based implementation of the Profile API tests
 */
class ProfileTests {
  constructor() {
    this.framework = new APITestFramework();
    this.setupTests();
  }

  setupTests() {
    this.framework.describe("super_admin Profile API Tests", () => {
      // Profile Tests
      this.framework.addTestCase("super_admin Get Profile - Success", async () => {
        const response = await this.framework.makeRequest(
          "http://localhost:5172/v1/api/longtermhire/super_admin/lambda/profile",
          {
            method: "GET",
            headers: {
              Authorization: "Bearer valid-token",
            },
          }
        );

        this.framework.assert(
          response.status === 200,
          "Should return 200 status code"
        );
        this.framework.assert(!response.body.error, "Should not return error");
        this.framework.assert(
          response.body.model.email,
          "Should return user email"
        );
        this.framework.assert(
          response.body.model.role_id,
          "Should return user role"
        );
      });

      this.framework.addTestCase("super_admin Update Profile - Success", async () => {
        const response = await this.framework.makeRequest(
          "http://localhost:5172/v1/api/longtermhire/super_admin/lambda/profile",
          {
            method: "POST",
            headers: {
              Authorization: "Bearer valid-token",
            },
            body: JSON.stringify({
              payload: {
                status: 1,
              },
            }),
          }
        );

        this.framework.assert(
          response.status === 200,
          "Should return 200 status code"
        );
        this.framework.assert(!response.body.error, "Should not return error");
        this.framework.assert(
          response.body.message === "Updated",
          "Should return success message"
        );
      });

      // Error Cases
      this.framework.addTestCase(
        "super_admin Get Profile - Invalid Token",
        async () => {
          const response = await this.framework.makeRequest(
            "http://localhost:5172/v1/api/longtermhire/super_admin/lambda/profile",
            {
              method: "GET",
              headers: {
                Authorization: "Bearer invalid-token",
              },
            }
          );

          this.framework.assert(
            response.status === 401,
            "Should return 401 status code"
          );
          this.framework.assert(
            response.body.error === true,
            "Should return error flag"
          );
          this.framework.assert(
            response.body.message === "Invalid Credentials",
            "Should return error message"
          );
        }
      );
    });
  }

  async runTests() {
    try {
      // Run the tests and return the results directly
      // without generating a report (let the test runner handle that)
      return await this.framework.runTests();
    } catch (error) {
      console.error("Test execution failed:", error);
      throw error;
    }
  }
}

// Create and run tests
const tests = new ProfileTests();
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
