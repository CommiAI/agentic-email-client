// Defining a data model.

class Message {
  role "user" | "assistant"
  content string
}

class GetEmailListInput {
  class_name "GetEmailListInput" @alias("Tool")
  maxResults int @description("The maximum number of email threads/messages to get.")
}

class GetEmailDetailsInput {
  class_name "GetEmailDetailsInput" @alias("Tool")
  id string @description("The ID of the email thread/message to retrieve details for.")
}

class SendEmailInput {
  class_name "SendEmailInput" @alias("Tool")
  to string @description("The recipient email address.")
  subject string @description("The subject of the email.")
  body string @description("The body content of the email.")
}

class DeleteEmailInput {
  class_name "DeleteEmailInput" @alias("Tool")
  id string @description("The ID of the email thread/message to delete.")
}

class HTMLContent {
  class_name "HTMLContent" @alias("Output")
  content string @description("The HTML content to be displayed in the email client.")
}

template_string PrintMessages(messages: Message[]) #"
  {% for m in messages %}
    {{ _.role(m.role) }}
    {{ m.content }}
  {% endfor %}
"#

// Create a function to simulate an email client.
// Uses List output format due to Gemini somehow performs better with List output instead of Single output.
function SimulateEmailClient(messages: Message[]) -> GetEmailListInput | GetEmailDetailsInput | SendEmailInput | DeleteEmailInput | HTMLContent{
  client GeminiClient

  prompt #"
    {{ _.role("system") }}
    You are an agentic email client that simulates the behavior of a real email client by simulating the backend and the frontend of the email client.
    
    This is how you should operate:
    <OPERATION>
    1. You will receive a user interaction.
    2. You should decide what would happen based on the user interaction, such as navigation, functionality, etc.
    3. You can execute tools to get the information needed to proceed the user interaction.
    4. You will generate a HTML that shows the user what they are supposed to see in the email client.
    </OPERATION>

    When generating HTML to show to the user, you should follow these rules:
    <RULES>
    1. The HTML generated should not have any actual functionality, such as onclick, href, etc.
    2. The HTML generated is just a representation of what the user should see in the email client, while the actual functionality is handled the agentic email client.
    3. The HTML generated should include all the basic functionality placeholders of an email client, such as navigation, sending emails, deleting emails, etc.
    </RULES>

    {{ PrintMessages(messages) }}

    {{ _.role("user") }}

    Decide the next action

    {{ ctx.output_format }}
  "#
}

// Test the function with a sample resume. Open the VSCode playground to run this.
test AfterAuthentication {
  functions [SimulateEmailClient]
  args {
    messages [
      {
        role "user"
        content #"
          User just finished authenticating with the email client. Show the inbox.
        "#
      }
    ]
  }
}

test AfterEmailList {
  functions [SimulateEmailClient]
  args {
    messages [
      {
        role "user"
        content #"
          User just finished authenticating with the email client. Show the inbox.
        "#
      },
      {
        role "assistant"
        content #"
          - **Subject:** Important Project Update  
            **From:** Project Manager <pm@company.com>  
            **Date:** Mon, 31 Mar 2025 10:15:22 GMT  
            **Snippet:** Hello team, I wanted to update you on the progress of our current project. We've made significant strides in the past week, and I'd like to schedule a meeting to discuss our next steps. Please review the...

          - **Subject:** Invitation: Company Picnic  
            **From:** HR Department <hr@company.com>  
            **Date:** Sun, 30 Mar 2025 14:45:00 -0700  
            **Snippet:** Dear Employees, We are excited to announce our annual company picnic! This year's event will be held on Saturday, April 12th, at Sunny Park. We have planned a day full of fun activities, delicious food, and...
        "#
      }
    ] 
  }
}