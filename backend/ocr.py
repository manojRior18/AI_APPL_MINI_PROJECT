import pytesseract
from PIL import Image
import os
import io
import cv2
import numpy as np

# --- 1. PRE-PROCESSING ENGINE (The Secret Sauce) ---
def preprocess_image(image_path):
    """
    Industry-standard preprocessing for OCR:
    Grayscale -> Noise Removal -> Thresholding (Binarization)
    """
    # Read image using OpenCV
    img = cv2.imread(image_path)
    if img is None:
        return None

    # 1. Grayscale
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # 2. Rescaling (Make the text 2x larger for better detection)
    gray = cv2.resize(gray, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)

    # 3. Denoising (Remove small dots/scratches)
    denoised = cv2.medianBlur(gray, 3)

    # 4. Adaptive Thresholding (Makes it strictly Black & White)
    # This handles invoices with shadows or colored backgrounds perfectly
    thresh = cv2.adaptiveThreshold(
        denoised, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2
    )

    return thresh

# --- 2. MAIN OCR FUNCTIONS ---

def get_raw_text(file_path: str) -> str:
    ext = os.path.splitext(file_path)[1].lower()
    if ext == ".pdf":
        return _ocr_pdf(file_path)
    return _ocr_image(file_path)

def _ocr_image(file_path: str) -> str:
    """Run Tesseract with optimized config and preprocessing."""
    try:
        processed_img = preprocess_image(file_path)
        if processed_img is None:
            return ""

        # --psm 3: Fully automatic page segmentation (Best for Invoices)
        # --oem 3: Default OCR engine mode
        custom_config = r'--oem 3 --psm 3'
        
        text = pytesseract.image_to_string(processed_img, config=custom_config)
        return text
    except Exception as e:
        print(f"[OCR] Image error: {e}")
        return ""

def _ocr_pdf(file_path: str) -> str:
    """Enhanced PDF OCR with 300 DPI and Layout awareness."""
    try:
        from pdf2image import convert_from_path
        # Use 300 DPI - Industry Standard for OCR
        pages = convert_from_path(file_path, dpi=300)
        all_text = []
        
        for i, page in enumerate(pages):
            # Save page temporarily to use OpenCV preprocessing
            temp_page_path = f"temp_page_{i}.png"
            page.save(temp_page_path, "PNG")
            
            text = _ocr_image(temp_page_path)
            all_text.append(text)
            
            os.remove(temp_page_path) # Clean up
            
        return "\n".join(all_text)
    except Exception as e:
        print(f"[OCR] PDF error: {e}")
        return ""

def get_raw_text_from_bytes(file_bytes: bytes, filename: str) -> str:
    """Handles raw bytes from FastAPI UploadFile."""
    temp_path = f"temp_{filename}"
    with open(temp_path, "wb") as f:
        f.write(file_bytes)
    
    result = get_raw_text(temp_path)
    os.remove(temp_path)
    return result