console.log("Client-side script loaded.");

// Get DOM elements
const appDiv = document.getElementById("app") as HTMLDivElement;
const loadingDiv = document.getElementById("loading") as HTMLDivElement;

// Track if this is the first load after authentication
let isFirstLoad = true;

// --- Helper Functions ---

// Check if user just authenticated
function checkIfJustAuthenticated(): boolean {
  // Check URL parameters for a sign of redirect from OAuth
  return window.location.href.includes('justAuthenticated=true') ||
         sessionStorage.getItem('justAuthenticated') === 'true';
}

// Function to load inbox after authentication
async function loadInbox() {
  console.log("Loading inbox after authentication");
  showLoading(true);

  const response = await callBackend("/api/llm", "POST", {
    target: "User just finished authenticating with the email client. Show the inbox."
  });

  if (response && response.html) {
    console.log("Received inbox HTML from backend");
    // Directly render the complete HTML from the LLM
    renderFullPage(response.html);
  } else {
    console.error("Failed to load inbox");
    renderError("Could not load inbox.");
  }

  // Clear the authentication flag
  sessionStorage.removeItem('justAuthenticated');
}

function showLoading(isLoading: boolean) {
  if (loadingDiv) {
    loadingDiv.style.display = isLoading ? "block" : "none";
  }
}

// Render the full HTML page from the LLM
function renderFullPage(htmlContent: string) {
  try {
    console.log('Rendering full HTML document:', htmlContent.substring(0, 100) + '...');

    // Always assume complete HTML document, replace entire page
    console.log('Replacing entire page with LLM-generated HTML');

    // First, hide the loading indicator (ensure loadingDiv is accessible or handle potential null)
    showLoading(false);

    // Create a new HTML document
    // Note: document.write has implications, ensure it fits your use case.
    document.open();
    document.write(htmlContent);
    document.close();

    // Set up event delegation for the new document
    // This is crucial as all previous listeners are wiped out.
    setupGlobalEventDelegation();

    console.log('Replaced entire document and set up global listeners.');

  } catch (error) {
    console.error('Error rendering full page:', error);
    // Consider how to render errors if document.write fails or if appDiv is gone
    renderError('Failed to render email client interface: ' + error);
  }
}

// Render an error message
function renderError(message: string) {
  if (appDiv) {
    appDiv.innerHTML = `<div style="color: red; padding: 20px; text-align: center;">
      <h3>Error</h3>
      <p>${message}</p>
      <button onclick="window.location.reload()">Retry</button>
    </div>`;
  }
  showLoading(false);
}

// Set up event delegation for the entire document (after document.write)
function setupGlobalEventDelegation() {
  // Wait a moment for the DOM to be fully processed
  setTimeout(() => {
    console.log('Setting up global event delegation');

    // Add click event listener to the document body
    document.body.addEventListener('click', async (event) => {
      const target = event.target as HTMLElement;
      console.log('Click detected in document. Target:', target.tagName, target.id || '(no id)');

      // Prevent default for links
      if (target.tagName === 'A') {
        event.preventDefault();
      }

      // Format the interaction message properly
      const userInteraction = `User clicked on ${target.outerHTML}`;
      console.log('Sending interaction to backend:', userInteraction.substring(0, 100) + '...');

      // Show loading indicator
      const loadingDiv = document.createElement('div');
      loadingDiv.style.position = 'fixed';
      loadingDiv.style.top = '0';
      loadingDiv.style.left = '0';
      loadingDiv.style.width = '100%';
      loadingDiv.style.height = '100%';
      loadingDiv.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
      loadingDiv.style.display = 'flex';
      loadingDiv.style.justifyContent = 'center';
      loadingDiv.style.alignItems = 'center';
      loadingDiv.style.fontSize = '24px';
      loadingDiv.style.color = '#333';
      loadingDiv.style.zIndex = '1000';
      loadingDiv.textContent = 'Loading...';
      document.body.appendChild(loadingDiv);

      try {
        // Call the backend with the formatted interaction
        const response = await fetch('/api/llm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ target: userInteraction })
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Response received:', data);

        if (data && data.html) {
          console.log('HTML content found in response, length:', data.html.length);
          // Replace the document with the new HTML
          document.open();
          document.write(data.html);
          document.close();
          // Set up event delegation again
          setupGlobalEventDelegation();
        } else {
          console.warn('No HTML content found in response');
          document.body.innerHTML = '<div style="color: red; padding: 20px; text-align: center;"><h3>Error</h3><p>No HTML content received from server</p><button onclick="window.location.reload()">Retry</button></div>';
        }
      } catch (error) {
        console.error('Error processing click:', error);
        document.body.innerHTML = `<div style="color: red; padding: 20px; text-align: center;"><h3>Error</h3><p>Error communicating with server: ${error}</p><button onclick="window.location.reload()">Retry</button></div>`;
      } finally {
        // Remove the loading div if it exists
        if (document.body.contains(loadingDiv)) {
          document.body.removeChild(loadingDiv);
        }
      }
    });
  }, 500);
}

async function callBackend(
  endpoint: string,
  method: string = "GET",
  body?: any
) {
  showLoading(true); // Show loading indicator
  try {
    console.log(`Making ${method} request to ${endpoint}`, body);

    const options: RequestInit = {
      method: method,
      headers: {},
    };
    if (body) {
      options.headers = { "Content-Type": "application/json" };
      options.body = JSON.stringify(body);
    }

    const response = await fetch(endpoint, options);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const responseData = await response.json();
    console.log('Response received:', responseData);

    // Check if the HTML property exists
    if (responseData && responseData.html) {
      console.log('HTML content found in response, length:', responseData.html.length);
    } else {
      console.warn('No HTML content found in response:', responseData);
    }

    return responseData;
  } catch (error) {
    console.error("Error calling backend:", error);
    renderError(
      `Error communicating with server: ${error}`
    );
    return null; // Indicate failure
  } finally {
    // Ensure loading is hidden even if there's an error before rendering
    // showLoading(false); // Already handled in renderContent or error case
  }
}

// --- Event Listeners ---
// No login button event listeners needed - authentication is handled automatically

// --- Initial Load Logic ---
// Automatically start the authentication flow or load inbox if already authenticated
console.log("Initial setup complete. Will check authentication status when DOM is loaded...");

// Function to automatically start the authentication process
function startAuthentication() {
  console.log("Starting authentication process automatically");
  // Store a flag to indicate we're in the authentication process
  sessionStorage.setItem('authenticationStarted', 'true');
  // Redirect to the backend endpoint that starts the Google OAuth flow
  window.location.href = "/auth/google";
}

// Function to check authentication and take appropriate action
function checkAuthenticationAndAct() {
  // Check if user just completed authentication
  if (checkIfJustAuthenticated() && isFirstLoad) {
    console.log("Detected user just authenticated, will load inbox");
    isFirstLoad = false;
    loadInbox();
  } else if (!checkIfJustAuthenticated() && isFirstLoad) {
    // Check if we've already started authentication to prevent redirect loops
    if (sessionStorage.getItem('authenticationStarted') !== 'true') {
      console.log("No authentication detected, starting authentication process");
      startAuthentication();
    } else {
      console.log("Authentication process already started, waiting for completion");
      // Clear the flag after a while to prevent getting stuck
      setTimeout(() => {
        sessionStorage.removeItem('authenticationStarted');
      }, 60000); // Clear after 1 minute
    }
  }
}

// Wait for the DOM to be fully loaded before checking authentication
document.addEventListener('DOMContentLoaded', () => {
  console.log("DOM fully loaded, checking authentication status");
  // Give a small delay to ensure everything is ready
  setTimeout(checkAuthenticationAndAct, 500);
});

// If DOMContentLoaded already fired, run immediately
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  console.log("DOM already loaded, checking authentication status immediately");
  setTimeout(checkAuthenticationAndAct, 500);
}
