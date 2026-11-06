import tensorflow as tf
import numpy as np
import json
from pathlib import Path

# Project paths
PROJECT_DIR = Path(__file__).resolve().parent.parent

MODEL_PATH = PROJECT_DIR / "models" / "banana_sense_ai_final.keras"
CLASS_PATH = PROJECT_DIR / "models" / "class_names.json"

# Load class names
with open(CLASS_PATH, "r") as file:
    CLASS_NAMES = json.load(file)["class_names"]

# Load trained model
model = tf.keras.models.load_model(MODEL_PATH)


def predict_ripeness(image_path):

    image_path = Path(image_path)

    if not image_path.is_file():
        raise FileNotFoundError(f"Image not found: {image_path}")

    # Read image
    image = tf.io.read_file(str(image_path))

    # Decode image
    image = tf.io.decode_image(
        image,
        channels=3,
        expand_animations=False
    )

    image.set_shape([None, None, 3])

    # Resize image
    image = tf.image.resize(image, [128, 128])

    # Normalize pixel values
    image = image / 255.0

    # Add batch dimension
    image = tf.expand_dims(image, axis=0)

    # Model prediction
    predictions = model.predict(image, verbose=0)

    predicted_index = int(np.argmax(predictions[0]))

    predicted_class = CLASS_NAMES[predicted_index]

    confidence = float(predictions[0][predicted_index] * 100)

    return {
        "predicted_class": predicted_class,
        "confidence": round(confidence, 2)
    }