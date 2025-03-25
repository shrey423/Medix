from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import numpy as np
import pickle
from collections import Counter
import os

# Initialize the FastAPI app
app = FastAPI()

origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load the label encoder and feature names
with open('label_encoder.pkl', 'rb') as f:
    le = pickle.load(f)
with open('feature_names.pkl', 'rb') as f:
    feature_names = pickle.load(f)

# Load datasets for merging results
doc_data = pd.read_csv("Doctor_Versus_Disease.csv", encoding='latin1', names=['Disease', 'Specialist'])
des_data = pd.read_csv("Disease_Description.csv")

# Update specialist for Tuberculosis
doc_data['Specialist'] = np.where((doc_data['Disease'] == 'Tuberculosis'), 'Pulmonologist', doc_data['Specialist'])

# Load models
models = {}
model_names = ['Logistic Regression', 'Decision Tree', 'Random Forest', 'SVM', 'NaiveBayes', 'K-Nearest Neighbors']
for model_name in model_names:
    with open(f'{model_name}.pkl', 'rb') as f:
        models[model_name] = pickle.load(f)

# Define the request model
class SymptomsRequest(BaseModel):
    symptoms: list

# Define function to predict disease based on symptoms
def predict_disease(symptoms):
    test_data = {col: 1 if col in symptoms else 0 for col in feature_names}
    test_df = pd.DataFrame(test_data, index=[0])

    predicted = []
    for model_name, model in models.items():
        predict_disease = model.predict(test_df)
        predict_disease = le.inverse_transform(predict_disease)
        predicted.extend(predict_disease)
    
    disease_counts = Counter(predicted)
    percentage_per_disease = {disease: (count / 6) * 100 for disease, count in disease_counts.items()}
    result_df = pd.DataFrame({"Disease": list(percentage_per_disease.keys()),
                              "Chances": list(percentage_per_disease.values())})
    result_df = result_df.merge(doc_data, on='Disease', how='left')
    result_df = result_df.merge(des_data, on='Disease', how='left')
    return result_df

# Define the route for prediction
@app.post("/predict")
def predict(request: SymptomsRequest):
    result = predict_disease(request.symptoms)
    return result.to_dict(orient='records')

# Health check endpoint
@app.get("/health")
def health_check():
    return {"status": "healthy"}

# Run the application
if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
