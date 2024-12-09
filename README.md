# Booking Service API

## Description

This project provides an API for managing bookings and user authentication/registration. The API supports creating, retrieving, updating, and deleting bookings as well as user registration, login, logout, and token refreshing. Authentication and authorization are implemented using JWT.Unit tests for user and booking. Swagger documentation.

---

## API Structure

### User Endpoints

#### **Register User**
- **Method:** `POST /users/register`
- **Description:** Registers a new user.
- **Responses:**
  - `201`: User created successfully.
  - `422`: Validation failed (e.g., passwords do not match, email or name already taken).

#### **Login User**
- **Method:** `POST /users/login`
- **Description:** Logs in a user and issues an access token and refresh token.
- **Responses:**
  - `200`: User logged in successfully.
  - `422`: User not found or password is incorrect.

#### **Logout User**
- **Method:** `POST /users/logout`
- **Authentication Required:** Yes (JWT)
- **Description:** Logs out the user by deleting the refresh token.
- **Responses:**
  - `200`: User logged out successfully.
  - `401`: Unauthorized.

#### **Refresh Tokens**
- **Method:** `GET /users/refresh`
- **Description:** Updates the access and refresh tokens.
- **Responses:**
  - `200`: Tokens refreshed successfully.
  - `403`: Forbidden.
  - `401`: Unauthorized.

---

### Booking Endpoints

#### **Create a Booking**
- **Method:** `POST /bookings`
- **Authentication Required:** Yes (JWT)
- **Description:** Creates a new booking.
- **Responses:**
  - `201`: Booking created successfully.
  - `403`: The selected time is unavailable.
  - `401`: Unauthorized.

#### **Get Booking by ID**
- **Method:** `GET /bookings/:id`
- **Description:** Retrieves booking details by ID.
- **Responses:**
  - `200`: Booking successfully retrieved.
  - `404`: Booking with the specified ID does not exist.

#### **Get All Bookings**
- **Method:** `GET /bookings`
- **Description:** Retrieves a list of all bookings.
- **Responses:**
  - `200`: List of bookings successfully retrieved.

#### **Update a Booking**
- **Method:** `PUT /bookings/:id`
- **Authentication Required:** Yes (JWT)
- **Description:** Updates the booking with the specified ID.
- **Responses:**
  - `200`: Booking successfully updated.
  - `403`: You are not the author of the booking, or the selected time is unavailable.
  - `404`: Booking with the specified ID does not exist.
  - `401`: Unauthorized.

#### **Delete a Booking**
- **Method:** `DELETE /bookings/:id`
- **Authentication Required:** Yes (JWT)
- **Description:** Deletes the booking with the specified ID.
- **Responses:**
  - `200`: Booking successfully deleted.
  - `401`: Unauthorized.

---

## Requirements

- **Node.js** version `14.x` or higher.
- **NestJS** for building the backend application.
- **PostgreSQL** relational database for data storage.

---
## Installation

1. Clone the repository:
   ```bash
   git clone <repository_url>

2. ```bash
   npm install

## Running the Application

1. Create a .env file with the required environment variables.
2. Start the development server:
   ```bash
   npm run start:dev

## Testing the Application

1. Command:
   ```bash
   npm run test

## Swagger Documentation
   
1. Route:http://localhost:<port>/api/docs

The API will be available at http://localhost:<port>.