# Agentic Email Client

![Demo GIF](docs/demo%20video.gif)

A web-based email client demonstrating an agentic user interface powered by BoundaryML (BAML) interacting with the Google Gmail API. Users interact by clicking on dynamically generated UI elements, which an AI agent interprets to perform email actions.

## Features

*   Secure Gmail login via Google OAuth 2.0.
*   Agentic interface: User actions (clicks) are interpreted by a BAML agent.
*   View email inbox list.
*   Read full email content.
*   Compose and send emails (triggered via agent interaction).
*   Delete emails (triggered via agent interaction).
*   Dynamic UI updates based on agent responses and email actions.

## Tech Stack

*   **Frontend:** HTML, CSS, TypeScript
*   **Backend:** Node.js, Express, TypeScript
*   **Agent Logic:** BoundaryML (BAML)
*   **Authentication:** Google OAuth 2.0
*   **API:** Google Gmail API

## How it Works

1.  **Authentication:** The user logs in and authorizes the application to access their Gmail account via Google OAuth.
2.  **Initial State:** The frontend requests the initial state (e.g., inbox view) from the backend `/api/llm` endpoint.
3.  **Agent Interaction:**
    *   The BAML agent (`SimulateEmailClient` function in `baml_src/email_client.baml`) generates the initial HTML UI.
    *   The user clicks on an interactive element within the UI (e.g., an email subject, a button like "Compose").
    *   The frontend sends the text content of the clicked element to the backend `/api/llm` endpoint.
4.  **Backend Processing:**
    *   The `server.ts` receives the request.
    *   It calls the `SimulateEmailClient` BAML function, passing the user's clicked text and conversation history.
    *   The BAML agent interprets the input and decides which "tool" (backend Gmail API function like `getEmailList`, `getEmailDetails`, `sendEmail`, `deleteEmail`) to call.
    *   The corresponding function in `server.ts` executes the Gmail API request.
5.  **Response & UI Update:**
    *   The result of the Gmail API call (or an error) is passed back to the BAML agent.
    *   The agent processes the result and generates new HTML content reflecting the updated state (e.g., showing email details, a compose form, or the updated inbox).
    *   The backend sends this new HTML back to the frontend.
    *   The frontend (`main.ts`) replaces the content of the dynamic container with the received HTML.

## Setup and Installation

**Prerequisites:**
*   Node.js and npm (or yarn)
*   Google Account

**Steps:**

1.  **Clone the repository:**
    ```bash
    git clone <your-repo-url>
    cd agentic-email-client
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Google Cloud Console Setup:**
    *   Go to the [Google Cloud Console](https://console.cloud.google.com/).
    *   Create a new project or select an existing one.
    *   Navigate to "APIs & Services" > "Enabled APIs & Services".
    *   Click "+ ENABLE APIS AND SERVICES", search for "Gmail API", and enable it.
    *   Navigate to "APIs & Services" > "Credentials".
    *   Click "+ CREATE CREDENTIALS" > "OAuth client ID".
    *   If prompted, configure the consent screen (User Type: External, provide app name, user support email, developer contact). Add the necessary scopes: `https://www.googleapis.com/auth/gmail.modify`. Add your Google account as a test user.
    *   Select "Web application" as the Application type.
    *   Give it a name (e.g., "Agentic Email Client Dev").
    *   Under "Authorized redirect URIs", add `http://localhost:3000/oauth2callback` (Adjust the port if you change it).
    *   Click "Create". Copy the **Client ID** and **Client Secret**.
4.  **Environment Variables:**
    *   Create a file named `.env` in the project root.
    *   Add the following lines, replacing the placeholders with your credentials:
      ```dotenv
      GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID
      GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET
      REDIRECT_URI=http://localhost:3000/oauth2callback
      PORT=3000 # Or any other port you prefer
      ```
5.  **Build the project:**
    ```bash
    npm run build
    ```
6.  **Run the server:**
    *   For development (with auto-reloading):
        ```bash
        npm run start:dev
        ```
    *   For production mode:
        ```bash
        npm start
        ```
7.  **Access the application:**
    Open your browser and navigate to `http://localhost:3000` (or the port you configured).

## Usage

1.  Click the "Login with Gmail" button.
2.  You will be redirected to Google to authorize the application. Select your account and grant permissions.
3.  You will be redirected back to the application, and it should display your initial email view (likely the inbox).
4.  Interact with the application by clicking on the elements presented (e.g., email subjects, buttons). The agent will process your clicks and update the UI accordingly.

## Project Structure (Key Files)

```
/
├── baml_src/             # BAML definitions
│   └── email_client.baml # Main BAML agent logic
├── public/               # Frontend static files
│   ├── index.html        # Initial HTML (Login button)
│   ├── client.html       # Main application HTML shell
│   └── main.ts           # Frontend TypeScript logic
├── src/                  # Backend source code
│   └── server.ts         # Express server, OAuth, API endpoints, BAML integration
├── .env.example          # Example environment variables (Consider adding this file)
├── package.json          # Project dependencies and scripts
├── tsconfig.json         # TypeScript configuration
└── README.md             # This file
```

## Acknowledgements

*   The core concept of building an agentic interface like this was inspired by the ideas presented in the video: [Rethinking how we Scaffold AI Agents](https://www.youtube.com/watch?v=-rsTkYgnNzM)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
