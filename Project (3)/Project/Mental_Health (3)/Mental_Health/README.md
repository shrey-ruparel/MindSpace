# Digital Psychological Intervention System Backend

This project provides the backend services for a Digital Psychological Intervention System, comprising a Flask API for AI microservices and a Node.js (Express) API for student and admin functionalities.

## Architecture

-   **Flask (Python):** Handles AI-powered features like chatbot, mood analysis, and screening tools using HuggingFace models.
-   **Node.js (Express):** Manages user authentication, appointment booking, peer forum, resource hub, gamification, emergency support, and admin functionalities. It also integrates with the Flask API for AI moderation and analysis. File uploads (profile pictures, resources, forum media) are handled via Multer and stored on Cloudinary.
-   **MongoDB:** Used as the primary database for both Node.js services, storing user data, appointments, forum posts, resources, and analytics.

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- Python (v3.9 or higher)
- MongoDB

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/your-repo.git
    cd your-repo
    ```

2.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```

### Flask AI Microservices

#### Setup

1.  **Navigate to the Flask directory:**
    ```bash
    cd flask
    ```
2.  **Create a Python virtual environment and activate it:**
    ```bash
    python -m venv venv
    ./venv/Scripts/activate # On Windows
    source venv/bin/activate # On macOS/Linux
    ```
3.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

#### Endpoints

-   **`/chat_ai` (POST):** AI chatbot for stress-relief and escalation.
    -   **Request Body:** `{"message": "Your message here"}`
    -   **Response:** `{"response": "AI chatbot response"}`
-   **`/predict_mood` (POST):** Sentiment/mood analysis from text.
    -   **Request Body:** `{"text": "Your text here"}`
    -   **Response:** `{"mood": "positive/negative/neutral", "score": 0.95}`
-   **`/screening/phq9` (POST):** PHQ-9 depression screening.
    -   **Request Body:** `{"answers": [0, 1, 2, 3, 0, 1, 2, 3, 0]}` (array of scores for each question)
    -   **Response:** `{"score": 15, "severity": "moderate"}`
-   **`/screening/gad7` (POST):** GAD-7 anxiety screening.
    -   **Request Body:** `{"answers": [0, 1, 2, 3, 0, 1, 2]}` (array of scores for each question)
    -   **Response:** `{"score": 10, "severity": "mild"}`

### Node.js (Express) Platform

#### Setup

1.  **Navigate to the Node.js directory:**
    ```bash
    cd node
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Create a `.env` file** in the `backend/node` directory with the following variables:
    ```
    PORT=8000
    MONGO_URI=your_mongodb_connection_string
    JWT_SECRET=your_jwt_secret
    FLASK_API_URL=http://localhost:5000 # Or wherever your Flask app is running
    CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
    CLOUDINARY_API_KEY=your_cloudinary_api_key
    CLOUDINARY_API_SECRET=your_cloudinary_api_secret
    ```

#### Endpoints (To be documented as developed)

-   **Authentication**
    -   `POST /api/auth/register`: Register a new user.
    -   `POST /api/auth/login`: Authenticate user and get JWT token.
    -   `GET /api/auth/me`: Get logged-in user's data (Private).

-   **Appointments**
    -   `POST /api/appointments`: Create a new appointment (Private, Student).
    -   `GET /api/appointments`: Get all appointments for the logged-in student (Private, Student).
    -   `PUT /api/appointments/:id/status`: Update appointment status (Private, Counsellor/Admin).

-   **Peer Forum**
    -   `POST /api/forum`: Create a new forum post (Private).
    -   `GET /api/forum`: Get all forum posts (Public).
    -   `DELETE /api/forum/:id`: Delete a forum post (Private, Owner or Admin).

-   **Resource Hub**
    -   `POST /api/resources`: Create a new resource (Private, Admin).
    -   `GET /api/resources`: Get all resources (Public).
    -   `GET /api/resources/:id`: Get resource by ID (Public).
    -   `DELETE /api/resources/:id`: Delete a resource (Private, Admin).

-   **Screenings**
    -   `POST /api/screenings/phq9`: Submit PHQ-9 screening (Private).
    -   `POST /api/screenings/gad7`: Submit GAD-7 screening (Private).
    -   `GET /api/screenings/me`: Get all screenings for the logged-in user (Private).

-   **Gamification**
    -   `GET /api/gamification/stats`: Get gamification stats for the logged-in user (Private).
    -   `POST /api/gamification/award-badge`: Manually award a badge (Private, Admin).

-   **Emergency Support**
    -   `POST /api/emergency`: Trigger emergency support (Private).

-   **Admin Dashboard**
    -   `GET /api/admin/users`: Get all users (Private, Admin).
    -   `GET /api/admin/users/:id`: Get user by ID (Private, Admin).
    -   `DELETE /api/admin/users/:id`: Delete a user (Private, Admin).
    -   `GET /api/admin/analytics`: Get admin dashboard analytics (Private, Admin).
    -   `PUT /api/admin/users/:id/role`: Update user role (Private, Admin).

## Database Schema

### `users`

```json
{
    "_id": "ObjectId",
    "role": "String (student, counsellor, admin)",
    "name": "String",
    "email": "String (unique)",
    "password_hash": "String",
    "anonymous_flag": "Boolean"
}
```

### `appointments`

```json
{
    "_id": "ObjectId",
    "student_id": "ObjectId (refers to User)",
    "counsellor_id": "ObjectId (refers to User)",
    "datetime": "Date",
    "status": "String (scheduled, completed, cancelled)",
    "anonymous": "Boolean"
}
```

### `resources`

```json
{
    "_id": "ObjectId",
    "type": "String (pdf, audio, video, text)",
    "title": "String",
    "file_url": "String",
    "category": "String"
}
```

### `forum_posts`

```json
{
    "_id": "ObjectId",
    "user_id": "ObjectId (refers to User)",
    "content": "String",
    "anonymous": "Boolean",
    "flagged": "Boolean"
}
```

### `screenings`

```json
{
    "_id": "ObjectId",
    "user_id": "ObjectId (refers to User)",
    "type": "String (phq9, gad7)",
    "score": "Number",
    "timestamp": "Date"
}
```

### `analytics`

```json
{
    "_id": "ObjectId",
    "metric": "String",
    "value": "Any",
    "timestamp": "Date"
}
```

## Security

-   JWT authentication for API access.
-   Role-based access control.
-   Environment variables for sensitive information.

## Scalability and Maintainability

-   Modular design with clear separation of concerns.
-   Microservice architecture for AI features.
-   Containerization (e.g., Docker) recommended for deployment.
