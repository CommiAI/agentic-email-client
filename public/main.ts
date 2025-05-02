// main.ts

console.log("Client-side script loaded.");

/**
 * Set up event listeners and initial state
 */
document.addEventListener('DOMContentLoaded', () => {
  console.log("DOM loaded, setting up event listeners");

  // Check if authentication just completed to trigger initial inbox load
  if (sessionStorage.getItem('authenticationStarted') === 'true') {
    console.log("Authentication detected, fetching initial inbox");
    callLLMBackend("Initial inbox request");
    sessionStorage.removeItem('authenticationStarted'); // Clear the flag
  }

  // Add event listener to the "Login with Gmail" button
  const loginButton = document.getElementById("gmail-login");
  if (loginButton) {
    loginButton.addEventListener("click", startAuthentication);
    console.log("Login button event listener attached");
  } else {
    console.error("Login button not found in the DOM");
    console.log("Available elements:", document.body.innerHTML);
  }

  // Add event listener to the dynamic container
  const container = document.getElementById("dynamic-container");
  const overlay = document.getElementById("loading-overlay");

  if (container && overlay) {
    container.addEventListener("click", async (event) => {
      const target = event.target as HTMLElement;

      if (target) {
        const clickedContent = target.innerText || target.textContent || "";
        const message = `User clicked: ${clickedContent}`;
        await callLLMBackend(message); // Reuse the callLLMBackend function
      }
    });

    console.log("Click listener attached to dynamic-container and integrated with LLM call.");
  } else {
    console.error("Either container or overlay not found!");
  }
});

/**
 * Starts the authentication process with redirect
 */
function startAuthentication() {
  console.log("Login button clicked - Starting authentication with redirect");
  
  // Store a flag to indicate we're in the authentication process
  sessionStorage.setItem('authenticationStarted', 'true');
  
  // Redirect to the backend endpoint that starts the Google OAuth flow
  window.location.href = "/auth/google";
}

/**
 * Calls the LLM backend to fetch content and update the dynamic container
 * @param message - The message to send to the LLM backend
 */
async function callLLMBackend(message: string) {
  const container = document.getElementById("dynamic-container");
  const overlay = document.getElementById("loading-overlay");

  if (!container || !overlay) {
    console.error("Container or overlay not found for LLM call!");
    return;
  }

  console.log("Sending to LLM:", message);
  showLoadingDot();

  try {
    const response = await fetch("/api/llm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target: message }),
    });

    const data = await response.json();
    container.innerHTML = data.html || "No response.";
  } catch (error) {
    console.error("Error contacting LLM backend:", error);
    container.innerHTML = "Error loading content.";
  } finally {
    hideLoadingDot();
  }
}

/**
 * Handles loading visual 
 */
function showLoadingDot() {
  const overlay = document.getElementById("loading-overlay");
  if (overlay) overlay.classList.remove("hidden");
}

function hideLoadingDot() {
  const overlay = document.getElementById("loading-overlay");
  if (overlay) overlay.classList.add("hidden");
}