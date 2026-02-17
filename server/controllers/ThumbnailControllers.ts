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

const stylePrompts = {
  "Bold & Graphic":
    "eye-catching thumbnail, bold typography, vibrant colors, expressive facial reaction, dramatic lighting, high contrast, click-worthy composition, professional style",
  "Tech/Futuristic":
    "futuristic thumbnail, sleek modern design, digital UI elements, glowing accents, holographic effects, cyber-tech aesthetic, sharp lighting, high-tech atmosphere",
  Minimalist:
    "minimalist thumbnail, clean layout, simple shapes, limited color palette, plenty of negative space, modern flat design, clear focal point",
  Photorealistic:
    "photorealistic thumbnail, ultra-realistic lighting, natural skin tones, candid moment, DSLR-style photography, lifestyle realism, shallow depth of field",
  Illustrated:
    "illustrated thumbnail, custom digital illustration, stylized characters, bold outlines, vibrant colors, creative cartoon or vector art style",
};

const colorSchemeDescriptions = {
  Vibrant:
    "vibrant and energetic colors, high saturation, bold contrasts, eye-catching palette",
  Sunset:
    "warm sunset tones, orange pink and purple hues, soft gradients, cinematic glow",
  Forest:
    "natural green tones, earthy colors, calm and organic palette, fresh atmosphere",
  Neon:
    "neon glow effects, electric blues and pinks, cyberpunk lighting, high contrast glow",
  Purple:
    "purple-dominant color palette, magenta and violet tones, modern and stylish mood",
  Monochrome:
    "black and white color scheme, high contrast, dramatic lighting, timeless aesthetic",
  Ocean: "cool blue and teal tones, aquatic color palette, fresh and clean atmosphere",
  Pastel:
    "soft pastel colors, low saturation, gentle tones, calm and friendly aesthetic",
};

export const generateThumbnail = async (req: Request, res: Response) => {
  try {
    const { userId } = req.session as any;

    const {
      title,
      prompt: user_prompt,
      style,
      aspect_ratio,
      color_scheme,
      text_overlay,
    } = req.body;

    const thumbnail = await Thumbnail.create({
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

    const model = "gemini-3-pro-image-preview";

    const generationConfig: GenerateContentConfig = {
      maxOutputTokens: 32768,
      temperature: 1,
      topP: 0.95,
      responseModalities: ["IMAGE"],
      imageConfig: {
        aspectRatio: aspect_ratio || "16:9",
        imageSize: "1K",
      },
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.OFF },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.OFF },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.OFF },
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.OFF },
      ],
    };

    let prompt = `Create a ${
      stylePrompts[style as keyof typeof stylePrompts]
    } for: "${title}". `;

    if (color_scheme) {
      prompt += `Use a ${
        colorSchemeDescriptions[color_scheme as keyof typeof colorSchemeDescriptions]
      } color scheme. `;
    }

    if (user_prompt) {
      prompt += `Additional details: ${user_prompt}. `;
    }

    prompt += `The thumbnail should be ${aspect_ratio}, visually stunning, and designed to maximize click-through rate. Make it bold, professional, and impossible to ignore.`;

    // generate image
    const response: any = await ai.models.generateContent({
      model,
      contents: [prompt],
      config: generationConfig,
    });

    if (!response?.candidates?.[0]?.content?.parts) {
      throw new Error("Unexpected response from AI");
    }

    const parts = response.candidates[0].content.parts;

    let finalBuffer: Buffer | null = null;

    for (const part of parts) {
      if (part.inlineData) {
        finalBuffer = Buffer.from(part.inlineData.data, "base64");
      }
    }

    if (!finalBuffer) {
      throw new Error("No image data received");
    }

    // ensure images folder exists
    const dir = "images";
    fs.mkdirSync(dir, { recursive: true });

    const filename = `final-output-${Date.now()}.png`;
    const filepath = path.join(dir, filename);

    fs.writeFileSync(filepath, finalBuffer);

    // upload to cloudinary (USE FILEPATH)
    const uploadResult = await cloudinary.uploader.upload(filepath, {
      resource_type: "image",
    });

    thumbnail.image_url = uploadResult.secure_url;
    thumbnail.isGenerating = false;
    await thumbnail.save();

    res.json({
      message: "Thumbnail Generated",
      thumbnail,
    });

    // delete local file
    fs.unlinkSync(filepath);
  } catch (error: any) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

// delete thumbnail
export const deleteThumbnail = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { userId } = req.session as any;

    await Thumbnail.findOneAndDelete({ _id: id, userId });

    res.json({ message: "Thumbnail deleted successfully" });
  } catch (error: any) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};
