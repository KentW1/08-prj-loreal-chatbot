/* DOM elements */
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");

// URL for the class-hosted Cloudflare Worker.
const workerUrl = "https://wonderbot-worker.kentwilkison.workers.dev/";

// Keep a running conversation so each request includes previous messages.
const messages = [];

// Simple helper to add a message bubble to the chat window.
function addMessageToChat(role, text) {
  const messageElement = document.createElement("p");
  messageElement.className = role === "user" ? "msg user" : "msg ai";
  messageElement.textContent =
    role === "user" ? `You: ${text}` : `Assistant: ${text}`;
  chatWindow.appendChild(messageElement);

  // Keep the latest message visible.
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

// Show an initial greeting in the chat window.
addMessageToChat("assistant", "Hello! How can I help you today?");

/* Handle form submit */
chatForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  // Remove extra whitespace and ignore empty input.
  const inputText = userInput.value.trim();
  if (!inputText) {
    return;
  }

  // Add and display the user's message.
  messages.push({ role: "user", content: inputText });
  addMessageToChat("user", inputText);
  userInput.value = "";

  // Temporary loading message while waiting for the Worker response.
  const thinkingElement = document.createElement("p");
  thinkingElement.className = "msg ai";
  thinkingElement.textContent = "Assistant: Thinking...";
  chatWindow.appendChild(thinkingElement);
  chatWindow.scrollTop = chatWindow.scrollHeight;

  try {
    // Send the full conversation to the Worker.
    const response = await fetch(workerUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: messages,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Read the assistant reply from OpenAI's chat format.
    const replyText =
      data?.choices?.[0]?.message?.content ||
      "Sorry, I could not read the response.";

    // Remove loading text and show the real assistant response.
    thinkingElement.remove();
    messages.push({ role: "assistant", content: replyText });
    addMessageToChat("assistant", replyText);
  } catch (error) {
    console.error("Error:", error);
    thinkingElement.remove();
    addMessageToChat(
      "assistant",
      "Sorry, something went wrong. Please try again later.",
    );
  }
});
