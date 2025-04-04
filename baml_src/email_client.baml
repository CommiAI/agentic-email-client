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
function SimulateEmailClient(user_action: string, information: string, context: string) -> (GetEmailListInput | GetEmailDetailsInput | HTMLContent)[] {
  client GeminiClient 

  prompt #"
    {{ _.role("system") }}
    You are an agentic email client that simulates the behavior of a real email client.
    As an email client, your job is to simulate the backend and the frontend of the email client.
    You will receive a user interaction and your final output should be a HTML that shows the user what they are supposed to see in the email client.

    {{ ctx.output_format }} 

    {{ _.role("user") }}
    
    User Interaction:
    {{ user_action }}

    Information:
    {{ information }}
    
    Previous Context:
    {{ context }}
    
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
    context #"
      
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
      "subject": "Important Project Update",
      "from": "Project Manager \u003Cpm@company.com\u003E",
      "date": "Mon, 31 Mar 2025 10:15:22 GMT",
      "snippet": "Hello team, I wanted to update you on the progress of our current project. We've made significant strides in the past week, and I'd like to schedule a meeting to discuss our next steps. Please review the"
    },
    {
      "id": "195dbd5d10573abd",
      "subject": "Invitation: Company Picnic",
      "from": "HR Department \u003Chr@company.com\u003E",
      "date": "Sun, 30 Mar 2025 14:45:00 -0700",
      "snippet": "Dear Employees, We are excited to announce our annual company picnic! This year's event will be held on Saturday, April 12th, at Sunny Park. We have planned a day full of fun activities, delicious food, and"
    },
    "#
    context #"
      
    "#
  }
}

test AfterEmailClick {
  functions [SimulateEmailClient]
  args {
    user_action #"
      User clicked on the email with subject "Quarterly Team Meeting - Agenda and Updates"
    "#
    information #"
      {
        "id": "195dbdf6464e71d0",
        "subject": "Quarterly Team Meeting - Agenda and Updates",
        "from": "Team Lead <teamlead@company.com>",
        "to": "team@company.com",
        "date": "Mon, 31 Mar 2025 09:30:00 GMT",
        "body": "Dear Team,\n\nI hope this email finds you well. Our quarterly team meeting is scheduled for next week, and I wanted to share the agenda and some important updates.\n\nAgenda:\n1. Q1 Performance Review\n2. Upcoming Projects Overview\n3. Team Building Activity Announcement\n4. Q&A Session\n\nPlease come prepared with any questions or topics you'd like to discuss. If you have any specific items you want to add to the agenda, please let me know by EOD tomorrow.\n\nLooking forward to our productive session!\n\nBest regards,\nYour Team Lead",
        "snippet": "Dear Team, I hope this email finds you well. Our quarterly team meeting is scheduled for next week, and I wanted to share the agenda and some important updates."
      }
    "#
    context #" 
    Information: {"id":"195dbdf6464e71d0","subject":"Important Update: New Project Management Tool","from":"IT Department <it@company.com>","to":"all-employees@company.com","date":"Mon, 15 Apr 2025 09:00:00 -0700","body":"Dear Colleagues,\r\n\r\nWe are excited to announce the implementation of a new project management tool, effective May 1, 2025. This tool will streamline our workflow and improve collaboration across departments.\r\n\r\nKey Points:\r\n\r\n1. Launch Date: May 1, 2025\r\n2. Mandatory Training: April 20-30, 2025\r\n3. Features: Task tracking, time management, team collaboration\r\n4. Benefits: Increased productivity, better resource allocation\r\n\r\nPlease note that all employees are required to complete the online training course by April 30. You will receive a separate email with login credentials for the training platform.\r\n\r\nIf you have any questions or concerns, please don't hesitate to reach out to the IT support team.\r\n\r\nBest regards,\r\nIT Department","snippet":"Dear Colleagues, We are excited to announce the implementation of a new project management tool, effective May 1, 2025. This tool will streamline our workflow and improve collaboration across departments."}
    HTML Generated: <html><body><h1>Email Details</h1><p><strong>Subject:</strong> Quarterly Team Meeting - Agenda and Updates</p><p><strong>From:</strong> Team Lead &lt;teamlead@company.com&gt;</p><p><strong>To:</strong> team@company.com</p><p><strong>Date:</strong> Mon, 31 Mar 2025 09:30:00 GMT</p><p><strong>Body:</strong></p><pre>Dear Team,

    I hope this email finds you well. Our quarterly team meeting is scheduled for next week, and I wanted to share the agenda and some important updates.

    Agenda:
    1. Q1 Performance Review
    2. Upcoming Projects Overview
    3. Team Building Activity Announcement
    4. Q&A Session

    Please come prepared with any questions or topics you'd like to discuss. If you have any specific items you want to add to the agenda, please let me know by EOD tomorrow.

    Looking forward to our productive session!

    Best regards,
    Your Team Lead</pre></body></html>
    "#
  }
}

