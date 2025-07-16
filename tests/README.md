# API Testing Guide

This directory contains the test suite for the application's API endpoints. The tests are organized to ensure proper functionality and reliability of the API.

## Table of Contents

1. [Test Structure](#test-structure)
2. [Running Tests](#running-tests)
3. [Creating New Test Files](#creating-new-test-files)
4. [Writing Test Cases](#writing-test-cases)
5. [Using AI to Generate Tests](#using-ai-to-generate-tests)
6. [Best Practices](#best-practices)

## Test Structure

The test files follow a class-based structure with the following organization:

```
├── apitesting.base.js     # Base testing framework - live in main tests folder

tests/
├── lambda/                # Lambda API tests
│   ├── super_admin_login.test.js      # Super ADmin Authentication tests
│   ├── super_admin_profile.test.js    # Super Admin User profile tests
│   └── ...                # Other API endpoint tests
└── unit/                  # Unit tests for specific components
└── integration/           # Integration tests for specific components
```

Each test file follows this pattern:

```javascript
const APITestFramework = require("../../../../tests/apitesting.base.js");

class ExampleApiTests {
  constructor() {
    this.framework = new APITestFramework();
    this.setupTests();
  }

  setupTests() {
    this.framework.describe("[Role] Example API Tests", () => {
      // Test cases go here
    });
  }

  async runTests() {
    try {
      return await this.framework.runTests();
    } catch (error) {
      console.error("Test execution failed:", error);
      throw error;
    }
  }
}

// Export the tests
const tests = new ExampleApiTests();
module.exports = tests
  .runTests()
  .then((report) => {
    if (report.failed > 0) {
      process.exit(1);
    }
    return report;
  })
  .catch((error) => {
    console.error("Test framework error:", error);
    process.exit(1);
  });
```

## Running Tests

To run the tests, use the test runner with the following command:

```bash
node test_runner.js --path custom/[project_name_backend]/tests/ # Run all tests
node test_runner.js --path custom/[project_name_backend]/tests/lambda # Run all lambda tests
node test_runner.js --path custom/[project_name_backend]/tests/unit # Run all unit tests
node test_runner.js --path custom/[project_name_backend]/tests/integration # Run all integration test
node test_runner.js --path custom/[project_name_backend]/tests/:dir --pattern login
```

where :dir is `integration|unit|lambda`
Options:

- `--path`: Specifies the directory containing the test files (default: "tests")
- `--pattern`: Filters test files by name (optional)
- `--verbose`: Shows detailed output including full test results (optional)

## Creating New Test Files

### Manual Creation

1. Create a new file in the appropriate directory (e.g., `tests/unit/feature_name.test.js`)
2. Use the class-based template structure shown above
3. Define your test cases within the `setupTests()` method
4. Make sure to include "[Role]" in the name of the test file and in your test descriptions to identify the role
   Always Create your tests file in the right folder based on purpose
   e.g unit testing files into `custom/[project_name_backend]/tests/unit`

### Using AI to Generate Test Files

You can use AI to generate test files by providing a clear prompt. Here's an example:

```
Generate a class-based API test file for testing the user preferences API endpoints.
The file should:
1. Import APITestFramework from "../../../../tests/apitesting.base.js"
2. Create a class called PreferencesApiTests
3. Include test cases for getting, updating, and deleting user preferences
4. Mock appropriate API responses
5. Include assertions to verify the responses
6. Include "[Role]" in all test descriptions and name of the file
7. Export the tests properly for the test runner
```

## Writing Test Cases

Each test case should follow this structure:

```javascript
this.framework.addTestCase("[Role] Test Case Description", async () => {
  // 1. Mock the API response
  this.framework.mockRequest(
    `${BASE_URL}/api/endpoint`,
    {
      // Mock response data
      error: false,
      data: {
        /* response data */
      },
    },
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );

  // 2. Make the request
  const response = await this.framework.makeRequest(
    `${BASE_URL}/api/endpoint`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer token",
      },
    }
  );

  // 3. Add assertions
  this.framework.assert(
    response.status === 200,
    "Should return 200 status code"
  );
  this.framework.assert(
    response.body.error === false,
    "Error flag should be false"
  );

  // 4. Add enhanced assertions if needed
  this.framework.assertions.assertEquals(
    response.body.data.property,
    "expected value",
    "Property should match expected value"
  );
});
```

## Using AI to Generate Tests

### Prompting AI to Write Assertions

First:

- If the test file already exists, Navigate into the `tests` folder of your project and locate the test file
- If it does not exist, Navigate into the `tests` folder of your project and create test file

When asking AI to help with writing assertions, provide clear context about:

1. The API endpoint being tested
2. The expected response structure
3. The specific conditions you want to verify

Example prompt:

```
Write assertions for a test case that verifies a user profile update API.
The API endpoint is PUT /api/v1/profile and the expected response has this structure:
{
  "error": false,
  "message": "Profile updated successfully",
  "user": {
    "id": 123,
    "name": "John Doe",
    "email": "john@example.com",
    "updated_at": "2023-01-01T00:00:00.000Z"
  }
}

I need assertions to verify:
1. The status code is 200
2. The error flag is false
3. The message is correct
4. The user object contains the updated information
5. The updated_at field is present
```

### Prompting AI to Implement Test Cases

For implementing complete test cases, provide:

1. The API endpoint details (URL, method, parameters)
2. Expected request format
3. Expected response format
4. Edge cases to consider
5. Any authentication requirements

Example prompt:

```
Implement a test case for the "Create New Post" API endpoint with these details:

Endpoint: POST /api/v1/posts
Request body:
{
  "title": "Post Title",
  "content": "Post content here",
  "tags": ["tag1", "tag2"]
}

Expected successful response (status 201):
{
  "error": false,
  "message": "Post created successfully",
  "post": {
    "id": 456,
    "title": "Post Title",
    "content": "Post content here",
    "tags": ["tag1", "tag2"],
    "created_at": "2023-01-01T00:00:00.000Z"
  }
}

Also implement a test case for validation error when title is missing.
Use the class-based structure and include "[Role]" in the test descriptions.
```

## Best Practices

1. **Always include "[Role]" in test descriptions** to identify the role being tested
2. **Mock API responses** to avoid actual network requests during testing
3. **Test both success and error cases** for comprehensive coverage
4. **Use descriptive test names** that explain what's being tested
5. **Group related tests** within the same test file
6. **Keep test cases independent** so they can run in any order
7. **Use the assertion helpers** provided by the framework for clearer error messages
8. **Verify all important aspects** of the API response, not just status codes
9. **Add comments** to explain complex test logic
10. **Don't modify the test framework** unless absolutely necessary

## Common Assertion Patterns

### Basic Assertions

```javascript
// Status code assertion
this.framework.assert(response.status === 200, "Should return 200 status code");

// Error flag assertion
this.framework.assert(
  response.body.error === false,
  "Error flag should be false"
);

// Property existence assertion
this.framework.assert(
  response.body.data !== undefined,
  "Response should contain data property"
);
```

### Enhanced Assertions

```javascript
// Equality assertion
this.framework.assertions.assertEquals(
  response.body.message,
  "Operation successful",
  "Should return success message"
);

// Schema validation
this.framework.assertions.assertResponseValid(
  response,
  schemaObject,
  "Response should match schema"
);

// Array length assertion
this.framework.assertions.assertEquals(
  response.body.items.length,
  5,
  "Should return 5 items"
);
```

### Error Case Assertions

```javascript
// Error status code
this.framework.assert(
  response.status === 400,
  "Should return 400 status for invalid input"
);

// Error flag
this.framework.assert(
  response.body.error === true,
  "Error flag should be true"
);

// Error message
this.framework.assertions.assertEquals(
  response.body.message,
  "Invalid input",
  "Should return correct error message"
);
```

---

By following this guide, you can effectively create, maintain, and extend the API test suite for your application. If you have any questions or need further assistance, please contact the development team.
