
// import genAI from "../config/gemini.js";

// export const chatWithAI = async (req, res) => {
//     const { message, history } = req.body; // Receive history from frontend
//     try {
//         const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });

//         const chat = model.startChat({
//             history: history || [], // Use history if available, else start fresh
//             generationConfig: {
//                 temperature: 0.7, // Adjust for randomness in responses
//                 maxOutputTokens: 500,
//             },
//         });

//         const result = await chat.sendMessage(message);
//         const responseText = result.response.text();

//         res.json({ response: responseText });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ error: error.message });
//     }
// };

import genAI from "../config/gemini.js";

let chatSession = null;

const chatWithAI = async (req, res) => {
  try {
    const { message, history, mode } = req.body;

    console.log("Received message:", message, "Mode:", mode);

    const model = genAI.getGenerativeModel({ model: "models/gemini-1.5-pro-latest" });

    if (!chatSession) {
      chatSession = await model.startChat({
        history: history || [],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 500,
        },
      });
    }

    // 📌 Improved Prompt Templates  
    const teachingPrompt = `
You are a professional English language tutor. Your job is to carefully correct any grammar, spelling, or phrasing mistakes in the user's message.

**Rules:**
- Correct the user's message clearly.
- Provide a short, friendly explanation if needed.
- Encourage the user to keep practicing.

**Format:**
Corrected Message: "[corrected message]"

Reply: "[friendly reply encouraging them]"

User's message: "${message}"
`;

    const normalPrompt = `
You are a helpful, polite AI assistant. Always respond to the user's question clearly, concisely, and in a friendly tone. 
If you're unsure of an answer, politely let the user know.

User's message: "${message}"
`;

    let prompt = mode === "teaching" ? teachingPrompt : normalPrompt;

    const result = await chatSession.sendMessage(prompt);
    const response = await result.response.text();

    res.json({ response });
  } catch (error) {
    console.error("Chat Error:", error);
    res.status(500).json({ error: "Failed to get AI response" });
  }
};

export default chatWithAI;

