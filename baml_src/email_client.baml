// Defining a data model.
class GetEmailListInput {
  class_name "GetEmailListInput" @alias("Tool")
  maxResults int @description("The maximum number of email threads/messages to get.")
}

class GetEmailDetailsInput {
  class_name "GetEmailDetailsInput" @alias("Tool") 
  id string @description("The ID of the email thread/message to retrieve details for.")
}

class HTMLContent {
  class_name "HTMLContent" @alias("Output")
  content string @description("The HTML content to be displayed in the email client.")
}

// Create a function to simulate an email client.
function SimulateEmailClient(user_action: string, information: string) -> (GetEmailListInput | GetEmailDetailsInput | HTMLContent)[] {
  client GeminiClient 

  prompt #"
    {{ _.role("system") }}
    You are an agentic email client that simulates the behavior of a real email client.
    As an email client, your job is to simulate the backend and the frontend of the email client.
    You will receive a user interaction and your final output should be a HTML that shows the user what they are supposed to see in the email client.

    {{ ctx.output_format }} 

    {{ _.role("user") }}
    
    {{ user_action }}

    {{ information }}
    
  "#
}

// Test the function with a sample resume. Open the VSCode playground to run this.
test AfterAuthentication {
  functions [SimulateEmailClient]
  args {
    user_action #"
      User just finished authenticating with the email client. Show the inbox.
    "#
    information #"
      
    "#
  }
}

test AfterEmailList {
  functions [SimulateEmailClient]
  args {
    user_action #"
    "#
    information #"
      {
      "id": "195dbdf6464e71d0",
      "subject": "Security alert",
      "from": "Google \u003Cno-reply@accounts.google.com\u003E",
      "date": "Fri, 28 Mar 2025 08:30:04 GMT",
      "snippet": "A new sign-in on Windows commiyoazelia@gmail.com We noticed a new sign-in to your Google Account on a Windows device. If this was you, you don&#39;t need to do anything. If not, we&#39;ll help you"
    },
    {
      "id": "195dbd5d10573abd",
      "subject": "Recent changes to your Steam account",
      "from": "Steam Support \u003Cnoreply@steampowered.com\u003E",
      "date": "Fri, 28 Mar 2025 01:19:37 -0700",
      "snippet": "Steam Dear trag3dymurphylaw, The email address associated with your Steam account has been successfully changed. We are sending this notice to ensure the privacy and security of your Steam account. If"
    },
    "#
  }
}

test AfterEmailClick {
  functions [SimulateEmailClient]
  args {
    user_action #"
      User clicked on email with id 195dbdf6464e71d0.
    "#
    information #"

    "#
  }
}

