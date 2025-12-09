# model_trainer.py

import pandas as pd
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
import joblib # The preferred tool for saving models

def create_dummy_xg_data(n_shots=1000):
    """Creates synthetic data simulating hockey shots for model training."""
    np.random.seed(42)
    
    # 1. FEATURES (X): The inputs the model uses to predict a goal
    # Distance: Closer shots (10-80 ft) are more likely to be goals
    distance = np.random.uniform(low=10, high=80, size=n_shots)
    # Angle: Higher angles (closer to center) are better
    angle = np.random.uniform(low=5, high=70, size=n_shots)
    # Rebound: Binary feature (1=rebound, more likely to be a goal)
    is_rebound = np.random.choice([0, 1], size=n_shots, p=[0.9, 0.1])
    
    # 2. TARGET (y): The actual outcome (Goal=1, No Goal=0)
    # Goal probability is based on distance, angle, and rebound
    # This is a highly simplified proxy for the real complex probability
    base_prob = (90 - distance) / 100 + (angle / 150) + (is_rebound * 0.15)
    
    # Generate the binary outcome based on the probability
    is_goal = np.random.rand(n_shots) < base_prob
    
    df = pd.DataFrame({
        'distance': distance,
        'angle': angle,
        'is_rebound': is_rebound,
        'is_goal': is_goal.astype(int) # 0 or 1
    })
    return df

# --- TRAINING AND SAVING THE MODEL ---

# 1. Load Data
df_shots = create_dummy_xg_data()

# 2. Define Features (X) and Target (y)
X = df_shots[['distance', 'angle', 'is_rebound']]
y = df_shots['is_goal']

# 3. Train Model (Using Logistic Regression for simplicity)
print("Training Logistic Regression Model...")
model = LogisticRegression(solver='liblinear', random_state=42)
model.fit(X, y)
print("Training Complete.")

# 4. Save the Model
# The model will be saved as 'xg_model.joblib' for reuse in the data_acquisition script.
model_filename = 'xg_model.joblib'
joblib.dump(model, model_filename)
print(f"Model successfully saved as {model_filename}")

