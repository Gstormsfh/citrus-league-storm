# model_trainer.py

import pandas as pd
import numpy as np
from xgboost import XGBClassifier  # Upgraded to XGBoost for better accuracy
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
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
    
    # NEW FEATURES:
    # Shot type: Categorical feature (wrist, snap, slap, backhand, tip-in, etc.)
    shot_types = ['wrist', 'snap', 'slap', 'backhand', 'tip-in', 'deflected', 'wrap-around']
    shot_type = np.random.choice(shot_types, size=n_shots, p=[0.35, 0.25, 0.15, 0.10, 0.08, 0.05, 0.02])
    
    # Power play: Binary feature (1=power play, 0=even strength or shorthanded)
    # Power plays increase goal probability
    is_power_play = np.random.choice([0, 1], size=n_shots, p=[0.75, 0.25])
    
    # Score differential: Range from -5 to +5 (negative = trailing, positive = leading)
    # Teams trailing are more aggressive, teams leading may be more conservative
    score_differential = np.random.choice(range(-5, 6), size=n_shots)
    
    # 2. TARGET (y): The actual outcome (Goal=1, No Goal=0)
    # Goal probability is based on all features
    # This is a highly simplified proxy for the real complex probability
    base_prob = (
        (90 - distance) / 100 +           # Distance factor
        (angle / 150) +                    # Angle factor
        (is_rebound * 0.15) +              # Rebound bonus
        (is_power_play * 0.10) +           # Power play bonus
        (np.abs(score_differential) * 0.02) +  # Trailing/leading teams more aggressive
        (np.random.normal(0, 0.05, n_shots))  # Random noise
    )
    
    # Shot type modifiers (some shot types are more effective)
    shot_type_modifiers = {
        'wrist': 0.02,
        'snap': 0.03,
        'slap': 0.01,
        'backhand': -0.01,
        'tip-in': 0.05,
        'deflected': 0.04,
        'wrap-around': 0.02
    }
    for i, st in enumerate(shot_type):
        base_prob[i] += shot_type_modifiers[st]
    
    # Clip probabilities to valid range [0, 1]
    base_prob = np.clip(base_prob, 0, 1)
    
    # Generate the binary outcome based on the probability
    is_goal = np.random.rand(n_shots) < base_prob
    
    df = pd.DataFrame({
        'distance': distance,
        'angle': angle,
        'is_rebound': is_rebound,
        'shot_type': shot_type,
        'is_power_play': is_power_play,
        'score_differential': score_differential,
        'is_goal': is_goal.astype(int) # 0 or 1
    })
    return df

# --- TRAINING AND SAVING THE MODEL ---

# 1. Load Data
print("Generating synthetic training data...")
df_shots = create_dummy_xg_data(n_shots=5000)  # Increased sample size for XGBoost
print(f"Generated {len(df_shots)} shot records")

# 2. Encode categorical features (shot_type)
print("Encoding categorical features...")
label_encoder = LabelEncoder()
df_shots['shot_type_encoded'] = label_encoder.fit_transform(df_shots['shot_type'])

# Save the label encoder for use in prediction
joblib.dump(label_encoder, 'shot_type_encoder.joblib')
print(f"Shot types: {list(label_encoder.classes_)}")

# 3. Define Features (X) and Target (y)
# Updated feature list with new features
MODEL_FEATURES = ['distance', 'angle', 'is_rebound', 'shot_type_encoded', 'is_power_play', 'score_differential']
X = df_shots[MODEL_FEATURES]
y = df_shots['is_goal']

print(f"Features: {MODEL_FEATURES}")
print(f"Target distribution: {y.value_counts().to_dict()}")

# 4. Train Model (Using XGBoost for state-of-the-art accuracy)
print("\nTraining XGBoost Classifier...")
model = XGBClassifier(
    use_label_encoder=False,
    eval_metric='logloss',
    random_state=42,
    n_estimators=100,
    max_depth=6,
    learning_rate=0.1
)
model.fit(X, y)
print("Training Complete.")

# Print feature importance
print("\nFeature Importance:")
feature_importance = pd.DataFrame({
    'feature': MODEL_FEATURES,
    'importance': model.feature_importances_
}).sort_values('importance', ascending=False)
print(feature_importance.to_string(index=False))

# 5. Save the Model and Feature List
# The model will be saved as 'xg_model.joblib' for reuse in the data_acquisition script.
model_filename = 'xg_model.joblib'
joblib.dump(model, model_filename)
print(f"\nModel successfully saved as {model_filename}")

# Save the feature list for reference
features_filename = 'model_features.joblib'
joblib.dump(MODEL_FEATURES, features_filename)
print(f"Feature list saved as {features_filename}")
print(f"\n✅ Model training complete! Ready for deployment.")

