import Thumbnail from "../models/Thumbnail.js";
import { Request, Response } from "express";
import {
  GenerateContentConfig,
  HarmBlockThreshold,
  HarmCategory,
} from "@google/genai";
import ai from "../config/ai.js";
import path from "node:path";
import fs from "fs";
import { v2 as cloudinary } from "cloudinary";

// --- FIX: Configure Cloudinary explicitly so it doesn't crash ---
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const stylePrompts = {
  "Bold & Graphic": "eye-catching thumbnail, bold typography, vibrant colors, expressive facial reaction, dramatic lighting, high contrast, click-worthy composition, professional style",
  "Tech/Futuristic": "futuristic thumbnail, sleek modern design, digital UI elements, glowing accents, holographic effects, cyber-tech aesthetic, sharp lighting, high-tech atmosphere",
  "Minimalist": "minimalist thumbnail, clean layout, simple shapes, limited color palette, plenty of negative space, modern flat design, clear focal point",
  "Photorealistic": "photorealistic thumbnail, ultra-realistic lighting, natural skin tones, candid moment, DSLR-style photography, lifestyle realism, shallow depth of field",
  "Illustrated": "illustrated thumbnail, custom digital illustration, stylized characters, bold outlines, vibrant colors, creative cartoon or vector art style",
};

const colorSchemeDescriptions = {
  Vibrant: "vibrant and energetic colors, high saturation, bold contrasts, eye-catching palette",
  Sunset: "warm sunset tones, orange pink and purple hues, soft gradients, cinematic glow",
  Forest: "natural green tones, earthy colors, calm and organic palette, fresh atmosphere",
  Neon: "neon glow effects, electric blues and pinks, cyberpunk lighting, high contrast glow",
  Purple: "purple-dominant color palette, magenta and violet tones, modern and stylish mood",
  Monochrome: "black and white color scheme, high contrast, dramatic lighting, timeless aesthetic",
  Ocean: "cool blue and teal tones, aquatic color palette, fresh and clean atmosphere",
  Pastel: "soft pastel colors, low saturation, gentle tones, calm and friendly aesthetic",
};

export const generateThumbnail = async (req: Request, res: Response) => {
  let thumbnailRecord: any = null;

  try {
    const { userId } = req.session as any;

    if (!userId) {
      return res.status(401).json({ message: "No active session. Please login." });
    }

    const {
      title,
      prompt: user_prompt,
      style,
      aspect_ratio,
      color_scheme,
      text_overlay,
    } = req.body;

    // Create DB Record
    thumbnailRecord = await Thumbnail.create({
      userId,
      title,
      prompt_used: user_prompt,
      user_prompt,
      style,
      aspect_ratio,
      color_scheme,
      text_overlay,
      isGenerating: true,
    });

    // You can try changing this model name if 'gemini-3-pro' is not found
    // Common alternatives: "gemini-1.5-pro" or "imagen-3.0-generate-001"
    const model = "gemini-2.5-flash-preview-image"; 

    const generationConfig: GenerateContentConfig = {
      maxOutputTokens: 8192,
      temperature: 1,
      topP: 0.95,
      responseModalities: ["IMAGE"],
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.OFF },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.OFF },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.OFF },
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.OFF },
      ],
    };

    // Construct Prompt
    let prompt = `Create a ${stylePrompts[style as keyof typeof stylePrompts] || "professional"} thumbnail for: "${title}".`;
    if (color_scheme) prompt += ` Use a ${colorSchemeDescriptions[color_scheme as keyof typeof colorSchemeDescriptions]} color scheme.`;
    if (user_prompt) prompt += ` Additional details: ${user_prompt}.`;
    prompt += ` The thumbnail should be ${aspect_ratio || "16:9"}, visually stunning, and designed to maximize click-through rate.`;

    // Call AI
    const response: any = await ai.models.generateContent({
      model,
      contents: [prompt],
      config: generationConfig,
    });

    if (!response?.candidates?.[0]?.content?.parts) {
      throw new Error("Unexpected Gemini response");
    }

    const parts = response.candidates[0].content.parts;
    let finalBuffer: Buffer | null = null;

    for (const part of parts) {
      if (part.inlineData?.data) {
        finalBuffer = Buffer.from(part.inlineData.data, "base64");
      }
    }

    if (!finalBuffer) throw new Error("Image generation failed");

    // Save File locally
    const filename = `final-output-${Date.now()}.png`;
    const filepath = path.join("images", filename);
    if (!fs.existsSync("images")) fs.mkdirSync("images");
    fs.writeFileSync(filepath, finalBuffer);

    // Upload to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(filepath, {
      resource_type: "image",
    });

    // Update DB
    thumbnailRecord.image_url = uploadResult.secure_url;
    thumbnailRecord.isGenerating = false;
    await thumbnailRecord.save();

    // Cleanup
    if (fs.existsSync(filepath)) fs.unlinkSync(filepath);

    res.json({ message: "Thumbnail generated", thumbnail: thumbnailRecord });

  } catch (error: any) {
    console.error("GENERATION ERROR:", error);
    
    if (thumbnailRecord) {
      await Thumbnail.findByIdAndUpdate(thumbnailRecord._id, { isGenerating: false });
    }

    res.status(500).json({ message: error.message });
  }
};

export const deleteThumbnail = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { userId } = req.session as any;

    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    await Thumbnail.findOneAndDelete({ _id: id, userId });

    res.json({ message: "Thumbnail deleted successfully" });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};