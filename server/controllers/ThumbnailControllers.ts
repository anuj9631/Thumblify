import Thumbnail from "../models/Thumbnail.js";
import { Request, Response } from "express";
import ai from "../config/ai.js";
import path from "node:path";
import fs from "fs";
import { v2 as cloudinary } from "cloudinary";

/* -------------------- PROMPTS -------------------- */

const stylePrompts = {
  "Bold & Graphic": "eye-catching thumbnail, bold typography, vibrant colors, expressive facial reaction, dramatic lighting, high contrast, click-worthy composition",
  "Tech/Futuristic": "futuristic thumbnail, sleek modern design, glowing accents, cyber-tech aesthetic, sharp lighting",
  "Minimalist": "minimalist thumbnail, clean layout, simple shapes, limited color palette, modern flat design",
  "Photorealistic": "photorealistic thumbnail, natural lighting, DSLR-style photography, shallow depth of field",
  "Illustrated": "illustrated thumbnail, stylized characters, bold outlines, vibrant colors, vector art style",
};

const colorSchemeDescriptions = {
  Vibrant: "vibrant energetic colors with high contrast",
  Sunset: "warm sunset tones with orange and purple hues",
  Forest: "natural green and earthy tones",
  Neon: "neon glow effects with cyberpunk lighting",
  Purple: "purple-dominant modern palette",
  Monochrome: "black and white high contrast aesthetic",
  Ocean: "cool blue and teal tones",
  Pastel: "soft pastel colors with gentle tones",
};

/* -------------------- GENERATE THUMBNAIL -------------------- */

export const generateThumbnail = async (req: Request, res: Response) => {
  let thumbnail: any;

  try {
    const { userId } = req.session;
    const { title, prompt: user_prompt, style, aspect_ratio, color_scheme, text_overlay } = req.body;

    // 1. Create DB record
    thumbnail = await Thumbnail.create({
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

    // 2. INITIALIZE MODEL (This was the missing piece)
    // Using imagen-3.0-generate-001 for high-quality thumbnails
    const model = ai.getGenerativeModel({ model: "imagen-3.0-generate-001" });

    let prompt = `Create a ${stylePrompts[style as keyof typeof stylePrompts] || "bold"} thumbnail for "${title}". `;
    if (color_scheme) prompt += `Use ${colorSchemeDescriptions[color_scheme as keyof typeof colorSchemeDescriptions]}. `;
    if (user_prompt) prompt += `Additional details: ${user_prompt}. `;
    prompt += "Make it bold, professional, visually stunning, and optimized for high click-through rate.";

    // 3. CALL GENERATE
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseModalities: ["IMAGE"],
        imageConfig: {
          aspectRatio: aspect_ratio || "16:9",
        },
      },
    });

    const response = await result.response;
    const part = response.candidates?.[0]?.content?.parts?.[0];

    if (!part?.inlineData?.data) {
      throw new Error("No image data returned from AI. Check your API key permissions.");
    }

    const imageBuffer = Buffer.from(part.inlineData.data, "base64");

    // 4. Save locally
    const imagesDir = path.join(process.cwd(), "images");
    if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });

    const filename = `thumbnail-${Date.now()}.png`;
    const filepath = path.join(imagesDir, filename);
    fs.writeFileSync(filepath, imageBuffer);

    // 5. Upload to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(filepath, {
      resource_type: "image",
      folder: "thumblify",
    });

    // 6. Update DB
    thumbnail.image_url = uploadResult.secure_url;
    thumbnail.isGenerating = false;
    await thumbnail.save();

    // 7. Cleanup
    if (fs.existsSync(filepath)) fs.unlinkSync(filepath);

    return res.json({ message: "Thumbnail generated successfully", thumbnail });

  } catch (error: any) {
    console.error("GENERATION_ERROR:", error);

    if (thumbnail) {
      thumbnail.isGenerating = false;
      await thumbnail.save();
    }

    if (error.status === 429 || error.message?.includes("quota")) {
      return res.status(429).json({ message: "AI quota exceeded. Please wait a minute and try again." });
    }

    return res.status(500).json({ message: error.message || "Thumbnail generation failed" });
  }
};

/* -------------------- DELETE THUMBNAIL -------------------- */

export const deleteThumbnail = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { userId } = req.session;

    const deleted = await Thumbnail.findOneAndDelete({ _id: id, userId });
    
    if (!deleted) return res.status(404).json({ message: "Thumbnail not found" });

    return res.json({ message: "Thumbnail deleted successfully" });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};