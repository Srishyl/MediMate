import { useState, useEffect, useRef } from "react";

interface Message {
  text: string;
  sender: "user" | "bot";
}

interface MediMateChatProps {
  onClose?: () => void;
}

const MediMateChat: React.FC<MediMateChatProps> = ({ onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      text: "Hello! I'm MediMate, your AI-powered medical assistant. I can help you with:\n* Understanding medical conditions\n* Explaining medications and their effects\n* Providing general health information\n* Answering medical terminology questions\n\nPlease note: I am not a substitute for professional medical advice. Always consult a healthcare provider for medical concerns.",
      sender: "bot",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const apiKey = import.meta.env.VITE_GENAI_API_KEY;
  const modelName = "gemini-2.0-flash";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
  };

  const formatBotResponse = (text: string): string => {
    return text
      .split("\n")
      .map((line: string) => {
        if (line.trim().startsWith("*")) {
          return `• ${line.trim().substring(1).trim()}`;
        }
        return line;
      })
      .join("\n");
  };

  const generateGeminiResponse = async (prompt: string) => {
    setIsLoading(true);

    try {
      const medicalContext = "You are MediMate, an AI medical assistant. Your responses should be:\n" +
        "1. Professional and accurate\n" +
        "2. Include disclaimers about consulting healthcare providers\n" +
        "3. Focus on general medical information, not specific diagnoses\n" +
        "4. Use clear, non-technical language when possible\n" +
        "5. Cite sources when providing specific medical information\n\n" +
        "User query: " + prompt;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: medicalContext,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 1024,
            },
          }),
        }
      );

      const data = await response.json();

      if (data.error) {
        console.error("API Error:", data.error);
        return `Error: ${data.error.message || "Failed to get response"}`;
      }

      if (data.candidates && data.candidates[0].content.parts[0].text) {
        return formatBotResponse(data.candidates[0].content.parts[0].text);
      } else {
        console.error("Unexpected response structure:", data);
        return "I couldn't generate a response. Please try again.";
      }
    } catch (error) {
      console.error("Error calling API:", error);
      return "An error occurred. Please check your connection and try again.";
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (inputValue.trim() === "") return;

    const userMessage: Message = { text: inputValue, sender: "user" };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");

    const botResponse = await generateGeminiResponse(inputValue);
    setMessages((prev) => [...prev, { text: botResponse, sender: "bot" }]);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-xl">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-teal-600 p-4 rounded-t-lg flex justify-between items-center">
        <div className="flex items-center">
          <div className="bg-white/20 rounded-full p-2 mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white text-center">MediMate</h1>
            <p className="text-gray-200 text-sm text-center">Your AI Medical Assistant</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 focus:outline-none"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Messages Container */}
      <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
        {messages.map((message, index) => (
          <div key={index} className={`mb-4 ${message.sender === "user" ? "text-right" : "text-left"}`}>
            {/* Sender Name */}
            <p className={`text-xs font-medium mb-1 ${message.sender === "user" ? "text-gray-500" : "text-blue-600"}`}>
              {message.sender === "user" ? "You" : "MediMate"}
            </p>
            {/* Message Bubble */}
            <div
              className={`inline-block rounded-2xl px-4 py-3 max-w-xs md:max-w-sm lg:max-w-md shadow-sm ${
                message.sender === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-800 border border-gray-200"
              }`}
              style={{ whiteSpace: "pre-wrap" }}
            >
              {message.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start mb-4">
            <div className="bg-white text-gray-800 rounded-2xl shadow-sm px-4 py-3 border border-gray-200">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                <div
                  className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></div>
                <div
                  className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.4s" }}
                ></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 p-4 bg-white rounded-b-lg">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            placeholder="Ask about any medical topic..."
            className="flex-1 border border-gray-300 rounded-full px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading}
            className={`rounded-full p-3 ${
              isLoading
                ? "bg-blue-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 shadow-md`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </button>
        </form>

        {/* Status indicator */}
        <div className="flex items-center justify-center mt-3 text-xs text-gray-500">
          <div className="flex items-center">
            <div
              className={`w-2 h-2 rounded-full mr-2 ${
                apiKey ? "bg-green-500" : "bg-red-500"
              }`}
            ></div>
            <span>
              {apiKey ? "MediMate is online and ready" : "Connection error - check configuration"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MediMateChat; 