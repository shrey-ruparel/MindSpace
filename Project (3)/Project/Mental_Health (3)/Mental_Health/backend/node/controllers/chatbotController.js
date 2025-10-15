const { GoogleGenerativeAI } = require("@google/generative-ai");
const ChatbotLog = require('../models/ChatbotLog');
const { encrypt, decrypt } = require('../utils/encryptionUtils'); // Import encryption utilities

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash"});

exports.chatbotQuery = async (req, res) => {
    const { userId, query } = req.body;

    try {
        const chat = model.startChat({
            history: [
                {
                    role: "user",
                    parts: [{ text: "You are an expert psychological counselor for college students. Always respond with empathy, support, and confidentiality. Address issues like anxiety, depression, burnout, academic stress, sleep problems, and social isolation. Provide practical coping strategies, but do not replace professional medical advice. Encourage seeking a professional if the problem is severe. Keep responses clear, non-judgmental, and friendly." }],
                },
            ],
            generationConfig: {
                maxOutputTokens: 200,
            },
        });

        const result = await chat.sendMessage(query);
        const response = result.response;
        const text = response.text();

        // Encrypt query and response
        const encryptedQueryData = encrypt(query);
        const encryptedResponseData = encrypt(text);

        const newLog = new ChatbotLog({
            userId,
            encryptedQuery: encryptedQueryData.encryptedData,
            encryptedResponse: encryptedResponseData.encryptedData,
            iv: encryptedQueryData.iv // Use the same IV for both, or generate new one
        });
        await newLog.save();

        res.status(200).json({ response: text });

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        res.status(500).json({ message: "Error communicating with the chatbot." });
    }
};
