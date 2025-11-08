// Helper function to convert file to a base64 string and format for the API
const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
};

export const analyzeResume = async (file: File) => {
  // Dynamically import the Gemini library only when the function is called.
  const { GoogleGenAI, Type } = await import('@google/genai');

  // Define the JSON schema for the expected response inside the function
  const schema = {
    type: Type.OBJECT,
    properties: {
      candidateName: {
        type: Type.STRING,
        description: "The full name of the candidate.",
      },
      role: {
        type: Type.STRING,
        description: "The most recent or target job title or role of the candidate.",
      },
      yearsOfExperience: {
        type: Type.NUMBER,
        description: "The total number of years of professional experience. Calculate it from the dates provided. If not clear, provide an estimate.",
      },
      skills: {
        type: Type.ARRAY,
        description: "A list of key technical skills, programming languages, and frameworks mentioned in the resume.",
        items: {
          type: Type.STRING,
        },
      },
    },
    required: ["candidateName", "role", "yearsOfExperience", "skills"],
  };
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  try {
    const imagePart = await fileToGenerativePart(file);
    const textPart = {
      text: `Analyze the content of this resume and extract the candidate's full name, their most recent or target role, their total years of professional experience as a number, and a list of their key technical skills. Provide the output in a structured JSON format that adheres to the provided schema.`,
    };
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [textPart, imagePart] },
        config: {
            responseMimeType: "application/json",
            responseSchema: schema,
        },
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText);
  } catch (error) {
    console.error("Error analyzing resume with Gemini API:", error);
    throw new Error("Failed to analyze resume. Please try again.");
  }
};