import { Options } from "swagger-jsdoc";

export const swaggerOptions: Options = {
  definition: {
    openapi: "3.0.0",
    info: { title: "Growth Tracker API", version: "1.0.0" },
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      },
      schemas: {
        AddressInput: {
          type: "object",
          required: ["label", "street1", "city", "zipCode"],
          properties: {
            label:   { type: "string", example: "Home" },
            street1: { type: "string", example: "123 Main St" },
            street2: { type: "string", nullable: true, example: "Apt 4B" },
            city:    { type: "string", example: "New York" },
            zipCode: { type: "integer", example: 10001 },
          },
        },
        Address: {
          allOf: [
            { $ref: "#/components/schemas/AddressInput" },
            {
              type: "object",
              properties: {
                id:        { type: "string" },
                userId:    { type: "string" },
                createdAt: { type: "string", format: "date-time" },
              },
            },
          ],
        },
        User: {
          type: "object",
          properties: {
            id:              { type: "string" },
            email:           { type: "string", format: "email" },
            role:            { type: "string", enum: ["LEARNER", "MANAGER"] },
            department: {
              type: "string",
              enum: ["Engineering", "Product", "Design", "Marketing", "Operations", "HR", "Other"],
            },
            experienceLevel: { type: "string", enum: ["JUNIOR", "MID", "SENIOR"] },
            teamName:        { type: "string", nullable: true, example: "Platform Team" },
            bio:             { type: "string", nullable: true, maxLength: 250, example: "I love learning React." },
            birthdate:       { type: "string", format: "date", example: "1995-06-15" },
            createdAt:       { type: "string", format: "date-time" },
            addresses:       { type: "array", items: { $ref: "#/components/schemas/Address" } },
          },
        },
      },
    },
    paths: {
      "/api/health": {
        get: {
          tags: ["Health"],
          summary: "Health check",
          responses: {
            "200": {
              description: "OK",
              content: {
                "application/json": {
                  schema: { type: "object", properties: { status: { type: "string", example: "ok" } } },
                },
              },
            },
          },
        },
      },
      "/api/auth/signup": {
        post: {
          tags: ["Auth"],
          summary: "Register a new user",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["email", "password", "role", "department", "experienceLevel", "birthdate"],
                  properties: {
                    email:           { type: "string", format: "email", example: "user@example.com" },
                    password:        { type: "string", minLength: 8, example: "Secret123!" },
                    role:            { type: "string", enum: ["LEARNER", "MANAGER"] },
                    department: {
                      type: "string",
                      enum: ["Engineering", "Product", "Design", "Marketing", "Operations", "HR", "Other"],
                    },
                    experienceLevel: { type: "string", enum: ["JUNIOR", "MID", "SENIOR"] },
                    teamName:        { type: "string", description: "Required when role is MANAGER", example: "Platform Team" },
                    bio:             { type: "string", maxLength: 250, example: "I love learning React." },
                    birthdate:       { type: "string", format: "date", example: "1995-06-15", description: "YYYY-MM-DD" },
                    addresses: {
                      type: "array",
                      items: { $ref: "#/components/schemas/AddressInput" },
                      description: "Optional list of addresses to attach at signup",
                    },
                  },
                },
              },
            },
          },
          responses: {
            "201": {
              description: "User created",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      accessToken: { type: "string" },
                      user: { $ref: "#/components/schemas/User" },
                    },
                  },
                },
              },
            },
            "400": { description: "Validation error" },
            "409": { description: "Email already in use" },
          },
        },
      },
      "/api/auth/login": {
        post: {
          tags: ["Auth"],
          summary: "Log in",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["email", "password"],
                  properties: {
                    email:    { type: "string", format: "email", example: "user@example.com" },
                    password: { type: "string", example: "Secret123!" },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Authenticated",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      accessToken: { type: "string" },
                      user: { $ref: "#/components/schemas/User" },
                    },
                  },
                },
              },
            },
            "400": { description: "Validation error" },
            "401": { description: "Invalid credentials" },
          },
        },
      },
      "/api/auth/logout": {
        post: {
          tags: ["Auth"],
          summary: "Log out — clears the refresh token cookie",
          responses: {
            "200": {
              description: "Logged out",
              content: {
                "application/json": {
                  schema: { type: "object", properties: { message: { type: "string", example: "Logged out" } } },
                },
              },
            },
          },
        },
      },
      "/api/auth/refresh": {
        post: {
          tags: ["Auth"],
          summary: "Rotate refresh token and get a new access token",
          responses: {
            "200": {
              description: "New access token issued",
              content: {
                "application/json": {
                  schema: { type: "object", properties: { accessToken: { type: "string" } } },
                },
              },
            },
            "401": { description: "Invalid or expired refresh token" },
          },
        },
      },
      "/api/auth/me": {
        get: {
          tags: ["Auth"],
          summary: "Get current user profile",
          security: [{ bearerAuth: [] }],
          responses: {
            "200": {
              description: "Current user",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: { user: { $ref: "#/components/schemas/User" } },
                  },
                },
              },
            },
            "401": { description: "Unauthorized" },
            "404": { description: "User not found" },
          },
        },
      },
      "/api/auth/check-email": {
        get: {
          tags: ["Auth"],
          summary: "Check whether an email address is available",
          parameters: [
            {
              name: "email",
              in: "query",
              required: true,
              schema: { type: "string", format: "email" },
              example: "user@example.com",
            },
          ],
          responses: {
            "200": {
              description: "Availability result",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: { available: { type: "boolean" } },
                  },
                },
              },
            },
            "400": { description: "Missing or invalid email query parameter" },
          },
        },
      },
    },
  },
  apis: [],
};
