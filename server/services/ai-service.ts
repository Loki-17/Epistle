import { GoogleGenerativeAI } from "@google/generative-ai";
import { HfInference } from "@huggingface/inference";

const GOOGLE_API_KEY = "AIzaSyCOfS-pVUmC73ohLuu-NF2KlDOJ9hX5MSY";
const HUGGING_FACE_API_KEY = "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";

// Initialize APIs
const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
const hf = new HfInference(HUGGING_FACE_API_KEY);

export async function generateContent(prompt: string): Promise<string> {
  try {
    console.log("Generating content for prompt:", prompt.substring(0, 100) + "...");
    
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const result = await model.generateContent(`
      As a professional content writer, help expand on this blog content:
      "${prompt}"
      
      Please provide a well-structured, engaging continuation that maintains the same tone and style.
      Focus on adding value and maintaining professional language.
      The response should be in markdown format for better readability.
      Keep the response concise but informative.
      Do not include any HTML tags or special formatting characters.
    `);

    const response = await result.response;
    const text = response.text();
    console.log("Generated content length:", text.length);
    return text;
  } catch (error) {
    console.error("Error generating content:", error);
    if (error instanceof Error) {
      console.error("Error details:", error.message);
      console.error("Error stack:", error.stack);
    }
    throw new Error(`Failed to generate content: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function transcribeAudio(audioBuffer: Buffer): Promise<string> {
  try {
    console.log("Starting audio transcription...");
    console.log("Audio buffer size:", audioBuffer.length);
    
    // Convert audio buffer to base64
    const base64Audio = audioBuffer.toString('base64');
    console.log("Converted audio to base64, length:", base64Audio.length);
    
    // Use Hugging Face's automatic speech recognition model
    const transcription = await hf.automaticSpeechRecognition({
      model: "openai/whisper-large-v3",
      data: base64Audio,
      parameters: {
        language: "en",
        task: "transcribe",
        return_timestamps: false,
      },
    });

    console.log("Transcription completed successfully");
    console.log("Transcription length:", transcription.text.length);
    return transcription.text;
  } catch (error) {
    console.error("Error transcribing audio:", error);
    if (error instanceof Error) {
      console.error("Error details:", error.message);
      console.error("Error stack:", error.stack);
    }
    throw new Error(`Failed to transcribe audio: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
} 