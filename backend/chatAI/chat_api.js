const {
  GoogleGenerativeAI,
  HarmBlockThreshold,
  HarmCategory,
} = require("@google/generative-ai");
require("dotenv").config();
const logger = require("../config/logger"); // Assuming logger is available

const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
];

const initializeModel = (apiKey, modelName) => {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: modelName,
      safetySettings,
    });
    return model;
  } catch (err) {
    logger.error(`Failed to initialize model: ${err.message}`);
    return null;
  }
};

const primaryModel = initializeModel(process.env.API_KEY, process.env.MODEL_NAME);
const backupModel = initializeModel(process.env.API_KEY2, process.env.MODEL_NAME2);

const ifFail = async (input) => {
  try {
    logger.warn("Primary model failed. Attempting backup...");
    if (!backupModel) throw new Error("Backup model not initialized");
    const result = await backupModel.generateContent(input);
    const response = await result.response;
    const text = response.text();
    return text;
  } catch (err) {
    logger.error(`Backup model also failed: ${err.message}`);
    return "Sorry, the system is currently unavailable. Please try again later.";
  }
};

async function run(input) {
  try {
    if (!primaryModel) throw new Error("Primary model not initialized");
    const result = await primaryModel.generateContent(input);
    const response = await result.response;
    const text = response.text();
    return text;
  } catch (err) {
    logger.error(`Primary model failed: ${err.message}`);
    return await ifFail(input);
  }
}

module.exports = run;
