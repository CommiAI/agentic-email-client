// Learn more about clients at https://docs.boundaryml.com/docs/snippets/clients/overview

client<llm> GeminiClient {
  provider google-ai
  options {
    model "gemini-3.1-flash-lite-preview"
    api_key env.GOOGLE_API_KEY
    generationConfig {
      temperature 0.1
    }
  }
}

client<llm> OpenAIClient {
  provider "openai"
  options {
    api_key env.OPENAI_API_KEY
    model "gpt-4.1-mini"  // this is GPT-4.1
    temperature 0.1
  }
}

client<llm> MercuryClient {
  provider "openai"
  options {
    base_url "https://api.inceptionlabs.ai/v1"
    api_key env.INCEPTION_API_KEY
    model "mercury-2"
    temperature 0.1
  }
}

client<llm> SmolClient {
  provider fallback
  options {
    strategy [
      MercuryClient   // first choice
      GeminiClient    // fallback
    ]
  }
}


// https://docs.boundaryml.com/docs/snippets/clients/retry
retry_policy Constant {
  max_retries 3
  // Strategy is optional
  strategy {
    type constant_delay
    delay_ms 200
  }
}

retry_policy Exponential {
  max_retries 2
  // Strategy is optional
  strategy {
    type exponential_backoff
    delay_ms 300
    multiplier 1.5
    max_delay_ms 10000
  }
}