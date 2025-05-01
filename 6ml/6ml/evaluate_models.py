import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score, KFold
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix, classification_report
import pickle
import warnings
warnings.filterwarnings('ignore')

# Load datasets
print("Loading datasets...")
dis_sym_data = pd.read_csv("Processed_dataset.csv")
doc_data = pd.read_csv("Doctor_Versus_Disease.csv", encoding='latin1', names=['Disease', 'Specialist'])
des_data = pd.read_csv("Disease_Description.csv")

# Load feature names
print("Loading feature names...")
with open('feature_names.pkl', 'rb') as f:
    feature_names = pickle.load(f)

# Load the label encoder
with open('label_encoder.pkl', 'rb') as f:
    le = pickle.load(f)

# Create binary features using saved feature names
print("Processing symptoms...")
symptoms_df = pd.DataFrame(0, index=dis_sym_data.index, columns=feature_names)
for idx, row in dis_sym_data.iterrows():
    symptoms = []
    for col in dis_sym_data.columns[1:]:  # Skip Disease column
        if pd.notna(row[col]):
            symptoms.extend([s.strip() for s in str(row[col]).split(',')])
    for symptom in symptoms:
        if symptom in feature_names:
            symptoms_df.loc[idx, symptom] = 1

# Encode the Disease column
y = le.transform(dis_sym_data['Disease'])
X = symptoms_df

# Split the data with stratification
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

# Load trained models
print("\nLoading trained models...")
model_files = {
    'Logistic Regression': 'Logistic Regression.pkl',
    'Decision Tree': 'Decision Tree.pkl',
    'Random Forest': 'Random Forest.pkl',
    'SVM': 'SVM.pkl',
    'NaiveBayes': 'NaiveBayes.pkl',
    'K-Nearest Neighbors': 'K-Nearest Neighbors.pkl'
}

# Evaluate each model
results = {}
print("\nModel Evaluation Results:")
print("=" * 50)

for model_name, model_file in model_files.items():
    print(f"\nEvaluating {model_name}...")
    
    # Load the trained model
    with open(model_file, 'rb') as f:
        model = pickle.load(f)
    
    # Make predictions
    y_pred = model.predict(X_test)
    
    # Calculate metrics
    accuracy = accuracy_score(y_test, y_pred)
    precision = precision_score(y_test, y_pred, average='weighted')
    recall = recall_score(y_test, y_pred, average='weighted')
    f1 = f1_score(y_test, y_pred, average='weighted')
    
    # Perform cross-validation
    cv = KFold(n_splits=5, shuffle=True, random_state=42)
    cv_scores = cross_val_score(model, X, y, cv=cv, scoring='accuracy')
    
    results[model_name] = {
        'Accuracy': accuracy,
        'Precision': precision,
        'Recall': recall,
        'F1-Score': f1,
        'CV_Mean': cv_scores.mean(),
        'CV_Std': cv_scores.std()
    }
    
    print(f"{model_name} Results:")
    print(f"Accuracy: {accuracy:.4f}")
    print(f"Precision: {precision:.4f}")
    print(f"Recall: {recall:.4f}")
    print(f"F1-Score: {f1:.4f}")
    print(f"Cross-Validation Mean: {cv_scores.mean():.4f} (+/- {cv_scores.std() * 2:.4f})")
    
    # Print detailed classification report
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=le.classes_))

# Save results to a file
with open('model_metrics.txt', 'w') as f:
    f.write("Model Performance Metrics:\n")
    f.write("=" * 50 + "\n\n")
    for model_name, metrics in results.items():
        f.write(f"{model_name}:\n")
        for metric_name, value in metrics.items():
            f.write(f"{metric_name}: {value:.4f}\n")
        f.write("\n") 