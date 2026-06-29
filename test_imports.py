import sys
sys.path.insert(0, 'mainapp')
print("Importing dlib...")
import dlib
print("Importing face_recognition_models...")
import face_recognition_models
print("Importing sklearn.svm...")
from sklearn.svm import SVC
print("Importing src.database.db...")
import src.database.db
print("Done!")
