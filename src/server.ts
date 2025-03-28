import express, { Request, Response, NextFunction } from 'express'; // For creating the web server
import { OAuth2Client } from "google-auth-library"; // Google's library for OAuth
import { google, gmail_v1 } from "googleapis";
import path from "path"; // Node.js module for working with file paths
import axios from "axios"; // For making HTTP requests (if needed)
import dotenv from "dotenv"; // For loading environment variables from .env file

// --- BAML Client Import ---
import { b } from "../baml_client";

// --- Load Environment Variables ---
dotenv.config();

// --- Initialize Express App ---
const app = express();
const PORT = process.env.PORT;

// --- Express Middleware ---
// This allows Express to automatically parse JSON formatted request bodies
app.use(express.json());

// --- Serve Frontend Files ---
// Define the path to the 'public' directory relative to the 'src' directory
const publicPath = path.join(__dirname, "..", "public");
console.log(`Serving static files from: ${publicPath}`);

// Serve static files (like main.js, style.css) from the 'public' directory
app.use(express.static(publicPath));

// Serve the main index.html file for the root route
app.get("/", (req, res) => {
  res.sendFile(path.join(publicPath, "index.html"));
});

// --- Initialize Google OAuth Client ---
// Reads the credentials from your .env file
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !REDIRECT_URI) {
  console.error("Missing Google OAuth credentials in .env file");
  process.exit(1); // Exit if essential credentials aren't found
}

const oauth2Client = new OAuth2Client(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  REDIRECT_URI
);

// --- Simple In-Memory Token Storage (Temporary & Insecure) ---
// For initial testing ONLY. This will only work for one user at a time
// and tokens are lost when the server restarts.
let accessToken: string | null = null;
let refreshToken: string | null = null;
console.log("Using temporary in-memory token storage.");

// --- Implement Google OAuth Flow Endpoints ---

// Route to start the Google OAuth flow
app.get("/auth/google", (req, res) => {
  // Define the scopes (permissions) we need. Start with read-only.
  const scopes = [
    "https://www.googleapis.com/auth/gmail.readonly",
    // Later, for sending/deleting, you might add:
    // 'https://www.googleapis.com/auth/gmail.modify'
  ];

  // Generate the URL that will redirect the user to Google's consent screen
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline", // Request a refresh token along with the access token
    scope: scopes,
    prompt: "consent", // Force consent screen even if previously approved (good for testing)
  });

  console.log("Redirecting to Google for authentication...");
  res.redirect(authUrl); // Send the user to Google
});

// Define the async handler separately to avoid issues with async/await in route handlers
const oauthCallbackHandler = async (req: Request, res: Response) => {
  const code = req.query.code as string; // Get the authorization code from the query params

  if (!code) {
    console.error("OAuth callback called without authorization code.");
    return res.status(400).send("Authorization code missing.");
  }

  console.log("Received authorization code from Google.");

  try {
    // Exchange the authorization code for access and refresh tokens
    console.log("Exchanging code for tokens...");
    const { tokens } = await oauth2Client.getToken(code);
    console.log("Tokens received successfully from Google.");
    if (tokens.refresh_token) {
        console.log("Refresh token was present in the response.");
    }
    if (tokens.access_token) {
        console.log("Access token was present in the response.");
    }

    // --- Store Tokens (Temporary In-Memory Method) ---
    accessToken = tokens.access_token || null;
    // IMPORTANT: Refresh tokens are usually only sent the *first* time a user authorizes.
    // If you re-authorize, you might only get an access token.
    if (tokens.refresh_token) {
      refreshToken = tokens.refresh_token;
      console.log("Refresh token received and stored (in memory).");
    } else {
      console.log(
        "Refresh token not received (may already exist or scope changed). Using existing (if any)."
      );
    }

    // --- Set credentials on the OAuth2 client instance ---
    // This is crucial so the client can use these tokens for future API calls
    oauth2Client.setCredentials(tokens);
    console.log("OAuth2 client credentials set.");

    // Redirect the user back to the main page of your application
    console.log("Redirecting back to application root...");
    res.redirect("/");
  } catch (error) {
    console.error("Error exchanging authorization code for tokens:", error);
    // Check if error is an AxiosError or similar to get more details
    if (axios.isAxiosError(error) && error.response) {
      console.error("Error details:", error.response.data);
    }
    res.status(500).send("Failed to authenticate with Google.");
  }
};


// Route to handle the callback from Google after user grants permission
app.get('/oauth2callback', (req: Request, res: Response, next: NextFunction) => {
  oauthCallbackHandler(req, res).catch(next);
});

console.log("OAuth routes added.");

// Initializes the Gmail API client using the authenticated OAuth2 client.
function getGmailClient(): gmail_v1.Gmail | null {
  if (!accessToken) {
    console.warn("Attempted to get Gmail client without access token.");
    // In a real app, you'd trigger re-authentication or use refresh token here
    return null;
  }
  // Ensure the oauth2Client has the latest credentials (might be redundant if set on callback, but safe)
  oauth2Client.setCredentials({ access_token: accessToken, refresh_token: refreshToken });
  return google.gmail({ version: 'v1', auth: oauth2Client });
}

/**
 * Fetches a list of recent email messages (IDs and basic metadata).
 * Corresponds to a tool the LLM can call.
 */
async function getEmailList(maxResults = 15): Promise<any[] | null> {
  console.log("Tool Function: getEmailList called");
  const gmail = getGmailClient();
  if (!gmail) return null; // Not authenticated

  try {
    // 1. List message IDs
    const listResponse = await gmail.users.messages.list({
      userId: 'me',
      maxResults: maxResults,
      q: 'in:inbox' // Only fetch inbox messages, you can adjust query
    });

    const messages = listResponse.data.messages;
    if (!messages || messages.length === 0) {
      console.log('No messages found.');
      return [];
    }

    console.log(`Found ${messages.length} message IDs. Fetching metadata...`);

    // 2. Fetch metadata for each message (Batching is better for performance, but keep it simple first)
    const emailListPromises = messages.map(async (message) => {
      if (!message.id) return null;
      try {
        const msgResponse = await gmail.users.messages.get({
          userId: 'me',
          id: message.id,
          format: 'metadata', // Fetch only headers/metadata
          metadataHeaders: ['Subject', 'From', 'Date'] // Specify needed headers
        });

        const headers = msgResponse.data.payload?.headers;
        if (!headers) return { id: message.id, snippet: msgResponse.data.snippet || 'No snippet' };

        const subject = headers.find(h => h.name === 'Subject')?.value || 'No Subject';
        const from = headers.find(h => h.name === 'From')?.value || 'No Sender';
        const date = headers.find(h => h.name === 'Date')?.value || 'No Date';

        return {
          id: message.id,
          subject: subject,
          from: from,
          date: date,
          snippet: msgResponse.data.snippet || ''
        };
      } catch (err) {
        console.error(`Error fetching metadata for message ${message.id}:`, err);
        return null; // Skip this email on error
      }
    });

    const emailList = (await Promise.all(emailListPromises)).filter(email => email !== null); // Filter out nulls from errors
    console.log("getEmailList successful, returning list.");
    return emailList;

  } catch (error) {
    console.error('Error fetching email list:', error);
    // Handle potential auth errors (e.g., expired token) - requires refresh logic later
     if (axios.isAxiosError(error) && error.response?.status === 401) {
         console.error("Auth error (token might be expired)");
         // Reset token to force re-login for now
         accessToken = null;
         refreshToken = null;
     }
    return null; // Indicate failure
  }
}

/**
 * Fetches the full details of a specific email message.
 * Corresponds to a tool the LLM can call.
 */
async function getEmailDetails(messageId: string): Promise<any | null> {
  console.log(`Tool Function: getEmailDetails called for ID: ${messageId}`);
  const gmail = getGmailClient();
  if (!gmail) return null; // Not authenticated

  if (!messageId) {
      console.error("getEmailDetails called without messageId");
      return null;
  }

  try {
    const msgResponse = await gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'full' // Fetch the full message payload
    });

    const payload = msgResponse.data.payload;
    const headers = payload?.headers;
    if (!payload || !headers) {
        console.error(`No payload or headers found for message ${messageId}`);
        return null;
    }

    const subject = headers.find(h => h.name === 'Subject')?.value || 'No Subject';
    const from = headers.find(h => h.name === 'From')?.value || 'No Sender';
    const date = headers.find(h => h.name === 'Date')?.value || 'No Date';
    const to = headers.find(h => h.name === 'To')?.value || 'No Recipient'; // Added To header

    // --- Body Parsing Logic (Simplified) ---
    let body = '';
    if (payload.parts) {
      // Handle multipart messages (common)
      const part = payload.parts.find(p => p.mimeType === 'text/plain') || payload.parts.find(p => p.mimeType === 'text/html');
      if (part?.body?.data) {
        body = Buffer.from(part.body.data, 'base64').toString('utf-8');
      }
    } else if (payload.body?.data) {
      // Handle single part messages
       body = Buffer.from(payload.body.data, 'base64').toString('utf-8');
    }

    // If HTML body was found and no plain text, you might want to strip HTML tags for simplicity
    // (Requires an external library like 'html-to-text' or basic regex)
    // For now, we just return whatever we found first (prefer plain text)

    const emailDetails = {
        id: messageId,
        subject: subject,
        from: from,
        to: to, // Added To field
        date: date,
        body: body || 'No body content found or could not parse.',
        snippet: msgResponse.data.snippet || '' // Include snippet as well
    };

    console.log(`getEmailDetails successful for ID: ${messageId}`);
    return emailDetails;

  } catch (error) {
    console.error(`Error fetching details for message ${messageId}:`, error);
     if (axios.isAxiosError(error) && error.response?.status === 401) {
         console.error("Auth error (token might be expired)");
         accessToken = null;
         refreshToken = null;
     }
    return null; // Indicate failure
  }
}

console.log("Gmail API tool functions added.");

// --- Placeholder for /api/llm endpoint ---

console.log("Basic server configuration complete.");

// --- Start the Server (We'll add this at the very end) ---
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
    console.log(`Visit http://localhost:${PORT}`);
  });

// Export the app and oauth2Client if needed by other potential modules (optional for now)
// export { app, oauth2Client };
