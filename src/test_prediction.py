from predict import predict_ripeness
from pathlib import Path

PROJECT_DIR = Path(__file__).resolve().parent.parent

DATASET_DIR = (
    PROJECT_DIR
    / "data"
    / "raw"
    / "Banana Ripeness Detection Dataset"
)

classes = ["Green", "Semi-ripe", "Ripe", "Overripe"]

total_correct = 0
total_tested = 0

print("=" * 55)
print("       BANANASENSE AI - MULTI-IMAGE TESTING")
print("=" * 55)

for class_name in classes:

    folder = DATASET_DIR / class_name

    images = sorted([
        p for p in folder.iterdir()
        if p.suffix.lower() in [".jpg", ".jpeg", ".png"]
    ])

    images = images[:20]

    correct = 0
    tested = 0

    for image_path in images:

        try:
            result = predict_ripeness(image_path)

            predicted = result["predicted_class"]

            tested += 1

            if predicted == class_name:
                correct += 1

        except Exception as error:
            print(f"Error with {image_path.name}: {error}")

    accuracy = (correct / tested * 100) if tested else 0

    total_correct += correct
    total_tested += tested

    print(f"\nClass: {class_name}")
    print(f"Correct: {correct}/{tested}")
    print(f"Accuracy: {accuracy:.2f}%")

overall_accuracy = (
    total_correct / total_tested * 100
    if total_tested else 0
)

print("\n" + "=" * 55)
print(f"Overall Accuracy: {overall_accuracy:.2f}%")
print(f"Total Images Tested: {total_tested}")
print("=" * 55)