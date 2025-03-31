
import genAI from "../config/gemini.js";

export const chatWithAI = async (req, res) => {
    const { message, history } = req.body; // Receive history from frontend
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });

        const chat = model.startChat({
            history: history || [], // Use history if available, else start fresh
            generationConfig: {
                temperature: 0.7, // Adjust for randomness in responses
                maxOutputTokens: 500,
            },
        });

        const result = await chat.sendMessage(message);
        const responseText = result.response.text();

        res.json({ response: responseText });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};