console.log("Client-side script loaded.");

const loginButton = document.getElementById('loginButton') as HTMLButtonElement;
const contentDiv = document.getElementById('content') as HTMLDivElement;
const loadingDiv = document.getElementById('loading') as HTMLDivElement;

// --- Helper Functions (will be expanded) ---

function showLoading(isLoading: boolean) {
    if (loadingDiv) {
        loadingDiv.style.display = isLoading ? 'block' : 'none';
    }
}

function renderContent(htmlContent: string) {
    if (contentDiv) {
        contentDiv.innerHTML = htmlContent;
        // We will add event listeners *here* or use delegation later
    }
     showLoading(false); // Hide loading indicator after rendering
}

async function callBackend(endpoint: string, method: string = 'GET', body?: any) {
    showLoading(true); // Show loading indicator
    try {
        const options: RequestInit = {
            method: method,
            headers: {},
        };
        if (body) {
            options.headers = { 'Content-Type': 'application/json' };
            options.body = JSON.stringify(body);
        }

        const response = await fetch(endpoint, options);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json(); // Assuming backend sends JSON
    } catch (error) {
        console.error('Error calling backend:', error);
        renderContent(`<p style="color: red;">Error communicating with server: ${error}</p>`);
        return null; // Indicate failure
    } finally {
         // Ensure loading is hidden even if there's an error before rendering
        // showLoading(false); // Already handled in renderContent or error case
    }
}

// --- Event Listeners ---

if (loginButton) {
    loginButton.addEventListener('click', () => {
        console.log("Login button clicked");
        // Redirect to the backend endpoint that starts the Google OAuth flow
        window.location.href = '/auth/google';
    });
} else {
    console.error("Login button not found");
}

// --- Initial Load Logic (Placeholder) ---
// We need a way to know if the user is logged in.
// For now, we just show the default message in HTML.
// Later, after login, we'll trigger the first call to the LLM here.
console.log("Initial setup complete. Waiting for login.");

// Placeholder for handling clicks within the #content div (event delegation)
if (contentDiv) {
    contentDiv.addEventListener('click', (event) => {
        const target = event.target as HTMLElement;
        // Example: Check if a specific element was clicked
        // const action = target.closest('[data-action]')?.getAttribute('data-action');
        // const emailId = target.closest('[data-email-id]')?.getAttribute('data-email-id');

        // if (action === 'view-email' && emailId) {
        //     console.log(`Action: ${action}, ID: ${emailId}`);
        //     // Prevent default link behavior if it's an <a> tag
        //     event.preventDefault();
        //     // TODO: Construct prompt and call backend for viewing email
        //     // const currentUI = contentDiv.innerHTML;
        //     // callBackend('/api/llm', 'POST', { prompt: `View email ${emailId}`, currentUI });
        // }
         console.log("Click detected inside content area. Target:", target); // Log clicks for now
    });
}