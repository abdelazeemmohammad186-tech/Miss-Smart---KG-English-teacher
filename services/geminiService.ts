
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Grade, TeachingMode, Unit, TeacherScript } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateLessonScript = async (
  grade: Grade,
  unit: Unit,
  mode: TeachingMode
): Promise<TeacherScript> => {
  const isEnglishOnly = mode === TeachingMode.ENGLISH_ONLY;

  const prompt = isEnglishOnly 
    ? `
    You are "Miss Smart", a cheerful, intelligent, and very kind English teacher for Egyptian KG children in a Language School (Lycée).
    EXPLAIN EVERYTHING IN SIMPLE, CLEAR ENGLISH ONLY.
    Follow the official Egyptian curriculum:
    Unit: ${unit.title}
    Vocabulary: ${unit.vocabulary.join(", ")}
    Phonics: ${unit.phonics.join(", ")}
    Math: ${unit.math.join(", ")}
    ${unit.structure ? `Structure: ${unit.structure.join(", ")}` : ''}
    ${unit.skills ? `Life Skills: ${unit.skills.join(", ")}` : ''}

    Teaching Instructions:
    1. Call the child sweet names like "My Little Star", "Champion", or "Sweetie".
    2. Use simple but funny examples suitable for language school kids.
    3. Focus on teaching the "Structure" phrases clearly (e.g., "I can...", "I have...").
    4. In "Phonics", emphasize letter sounds clearly.
    5. Output JSON ONLY.
    `
    : `
    أنتِ الآن "ميس سمارت" (Miss Smart)، معلمة مصرية دمها خفيف جداً، شاطرة، ورقيقة.
    التزمي تمااااماً بمحتوى المنهج الرسمي المصري التالي:
    الدرس: ${unit.title}
    الكلمات المطلوبة: ${unit.vocabulary.join(", ")}
    الصوتيات (Phonics): ${unit.phonics.join(", ")}
    الرياضيات (Math): ${unit.math.join(", ")}
    ${unit.structure ? `القواعد (Structure): ${unit.structure.join(", ")}` : ''}
    ${unit.skills ? `الهارات (Life Skills): ${unit.skills.join(", ")}` : ''}

    تعليمات الشرح:
    1. نادِ الطفل بأسماء مضحكة (يا سكرة، يا بطل ميس سمارت).
    2. استخدمي أمثلة مصرية مضحكة.
    3. ركزي في فقرة الـ Structure على الجمل المطلوبة في المنهج (مثل "I can..." أو "I have...").
    4. في فقرة الـ Phonics، انطقي الكلمات بوضوح مع صوت الحرف.
    5. المخرجات JSON فقط.
    `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          warmUp: { type: Type.STRING, description: isEnglishOnly ? "Funny introduction in English" : "مقدمة مرحة عن موضوع الوحدة بالعربي" },
          vocabulary: { type: Type.STRING, description: isEnglishOnly ? "Explanation of words in simple English" : "شرح الكلمات الأساسية بأسلوب مضحك بالعربي" },
          pronunciation: { type: Type.STRING, description: isEnglishOnly ? "Structure practice in English" : "تدريب على جمل الـ Structure المطلوبة بالعربي" },
          phonics: { type: Type.STRING, description: isEnglishOnly ? "Phonics practice in English" : "تدريب على أصوات الحروف والكلمات المرتبطة بها بالعربي" },
          song: { type: Type.STRING, description: "A very short and funny song in English" },
          activity: { type: Type.STRING, description: isEnglishOnly ? "Quick mental activity in English" : "لعبة أو نشاط ذهني سريع للطفل بالعربي" },
          revision: { type: Type.STRING, description: isEnglishOnly ? "Summary and encouragement in English" : "ملخص سريع وتشجيع حار بالعربي" }
        },
        required: ["warmUp", "vocabulary", "pronunciation", "phonics", "song", "activity", "revision"]
      }
    }
  });

  return JSON.parse(response.text || "{}");
};

export const generateSpeech = async (text: string, mode: TeachingMode): Promise<string> => {
  const isEnglishOnly = mode === TeachingMode.ENGLISH_ONLY;
  const prompt = isEnglishOnly
    ? `Say this text in a cheerful, clear, and very kind British/International English teacher voice (Miss Smart). Use an encouraging tone: ${text}`
    : `انطقي هذا النص بصوت ميس سمارت المصرية الرقيقة والمرحة. التزمي بنطق الكلمات الإنجليزية بلكنة صحيحة تماماً والنص العربي بلكنة مصرية لطيفة: ${text}`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) throw new Error("No audio generated");
  return base64Audio;
};
