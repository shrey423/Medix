import pandas as pd
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import SVC
from sklearn.naive_bayes import GaussianNB
from sklearn.neighbors import KNeighborsClassifier
from sklearn.metrics import accuracy_score
import pickle

# Load the datasets
train_data = pd.read_csv("training.csv")
test_data = pd.read_csv("testing.csv")

# --- Data Preprocessing ---

# 1. Handle Missing Values
# Check for missing values in training and test data
print("Missing values in training data:\n", train_data.isnull().sum())
print("Missing values in test data:\n", test_data.isnull().sum())

# If missing values exist, handle them (e.g., replace NaN with 0)
# Uncomment the following lines if needed:
# train_data = train_data.fillna(0)  # 0 means absence of symptom
# test_data = test_data.fillna(0)

# 2. Separate features and target
X_train = train_data.drop(columns=['prognosis'])
y_train = train_data['prognosis']
X_test = test_data.drop(columns=['prognosis'])
y_test = test_data['prognosis']

# 3. Encode the target variable (disease names) into numerical labels
le = LabelEncoder()
y_train_encoded = le.fit_transform(y_train)
y_test_encoded = le.transform(y_test)

# Save the label encoder for later use
with open('label_encoder.pkl', 'wb') as f:
    pickle.dump(le, f)

# 4. Optional: Feature Scaling (useful for SVM and KNN)
# Since features are binary, scaling may not be required, but included for completeness
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# Save the scaler (optional, uncomment if needed)
# with open('scaler.pkl', 'wb') as f:
#     pickle.dump(scaler, f)

# Save the feature names (symptom names) for reference
feature_names = X_train.columns.tolist()
with open('feature_names.pkl', 'wb') as f:
    pickle.dump(feature_names, f)

# Define the machine learning models
models = {
    'Logistic Regression': LogisticRegression(max_iter=1000),
    'Decision Tree': DecisionTreeClassifier(),
    'Random Forest': RandomForestClassifier(),
    'SVM': SVC(probability=True),
    'NaiveBayes': GaussianNB(),
    'K-Nearest Neighbors': KNeighborsClassifier()
}

# Train, evaluate, and save each model
for model_name, model in models.items():
    # Use scaled data for SVM and KNN, unscaled for others
    if model_name in ['SVM', 'K-Nearest Neighbors']:
        model.fit(X_train_scaled, y_train_encoded)
        y_pred = model.predict(X_test_scaled)
    else:
        model.fit(X_train, y_train_encoded)
        y_pred = model.predict(X_test)
    
    # Evaluate the model
    accuracy = accuracy_score(y_test_encoded, y_pred)
    print(f"{model_name} Accuracy: {accuracy:.4f}")
    
    # Save the trained model
    with open(f'{model_name}.pkl', 'wb') as f:
        pickle.dump(model, f)

print("All models have been trained and saved successfully.")