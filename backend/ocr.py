import pytesseract
from PIL import Image
import os

# If you are on Windows, you might need to point to your Tesseract path:
# pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

def get_raw_text(file_path: str) -> str:
    """
    Takes a file path, opens the image, and returns the raw string of text.
    """
    try:
        # Open the image using PIL
        image = Image.open(file_path)
        
        # Use Tesseract to extract text
        raw_text = pytesseract.image_to_string(image)
        
        return raw_text
    except Exception as e:
        print(f"OCR Error: {e}")
        return ""