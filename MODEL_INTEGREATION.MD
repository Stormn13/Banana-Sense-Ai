# BananaSense AI - ML Model Integration Guide

## 1. Project Overview

BananaSense AI is an AI-powered banana ripeness
classification system.

The trained CNN model classifies banana images
into four ripeness categories.

## 2. Model Information

- Model: Improved CNN V2
- Architecture: Custom Convolutional Neural Network
- Framework: TensorFlow / Keras
- Input Image Size: 128 x 128 x 3
- Number of Classes: 4
- Test Accuracy: 94.31%

## 3. Supported Classes

The model output order is:

0. Green
1. Overripe
2. Ripe
3. Semi-ripe

## 4. Model Location

models/banana_sense_ai_final.keras

## 5. Prediction Module

File: src/predict.py

Function:

predict_ripeness(image_path)

Input:
- Image file path

Output:

{
    "predicted_class": "Ripe",
    "confidence": 98.20
}

Confidence is returned as a percentage.

## 6. Image Preprocessing

Images must undergo the following preprocessing:

1. Read the uploaded image.
2. Decode it into RGB format.
3. Resize it to 128 x 128 pixels.
4. Normalize pixel values to the range [0, 1].
5. Pass the image to the trained CNN model.

## 7. Backend Integration Workflow

1. User uploads a banana image.
2. Backend receives the image.
3. Backend calls predict_ripeness().
4. Model returns the predicted ripeness class.
5. Backend receives the confidence score.
6. Backend calculates the shelf-life estimate
   using its separate predefined rules.
7. Frontend displays the results.

## 8. Important Notes

- Use the supplied prediction function.
- Maintain the exact class-label order.
- Do not apply MobileNetV2 preprocessing.
- The model expects normalized images in [0, 1].
- Shelf-life estimation is separate from CNN prediction.