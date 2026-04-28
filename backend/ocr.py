import os
import io
import logging
from paddleocr import PaddleOCR
from pdf2image import convert_from_path

# Configure logger to reduce verbosity
logging.getLogger("ppocr").setLevel(logging.WARNING)

# Initialize PaddleOCR globally so it doesn't reload models every time
# use_angle_cls=True allows detecting text in images with slightly rotated text
ocr_engine = PaddleOCR(use_angle_cls=True, lang='en', show_log=False)

def extract_text(file_path: str) -> dict:
    """
    Extract text using PaddleOCR exclusively.
    Returns:
        dict: {"text": str, "blocks": list, "pages": int, "engine": "paddle"}
    """
    print(f"[OCR] Engine: PaddleOCR for {file_path}")
    ext = os.path.splitext(file_path)[1].lower()
    
    if ext == ".pdf":
        return _ocr_pdf(file_path)
    return _ocr_image(file_path)

def _ocr_image(file_path: str) -> dict:
    """Run PaddleOCR on a single image file."""
    try:
        # PaddleOCR takes the file path directly
        result = ocr_engine.ocr(file_path, cls=True)
        
        text_lines = []
        blocks = []
        
        # Result is a list of lists
        if result and result[0]:
            for line in result[0]:
                box = line[0]
                text = line[1][0]
                confidence = line[1][1]
                
                text_lines.append(text)
                blocks.append({
                    "box": box,
                    "text": text,
                    "confidence": confidence
                })
                
        return {
            "text": "\n".join(text_lines),
            "blocks": blocks,
            "pages": 1,
            "engine": "paddle"
        }
    except Exception as e:
        print(f"[OCR] Image error: {e}")
        return {"text": "", "blocks": [], "pages": 0, "engine": "paddle"}

def _ocr_pdf(file_path: str) -> dict:
    """Enhanced PDF OCR with 200 DPI for PaddleOCR."""
    try:
        # Use 200 DPI
        pages = convert_from_path(file_path, dpi=200)
        
        all_text = []
        all_blocks = []
        
        for i, page in enumerate(pages):
            temp_page_path = f"temp_page_{i}.png"
            page.save(temp_page_path, "PNG")
            
            page_result = _ocr_image(temp_page_path)
            
            if page_result["text"]:
                all_text.append(page_result["text"])
            if page_result["blocks"]:
                all_blocks.extend(page_result["blocks"])
                
            if os.path.exists(temp_page_path):
                os.remove(temp_page_path)
                
        return {
            "text": "\n".join(all_text),
            "blocks": all_blocks,
            "pages": len(pages),
            "engine": "paddle"
        }
    except Exception as e:
        print(f"[OCR] PDF error: {e}")
        return {"text": "", "blocks": [], "pages": 0, "engine": "paddle"}

def get_raw_text_from_bytes(file_bytes: bytes, filename: str) -> str:
    """Handles raw bytes from FastAPI UploadFile."""
    temp_path = f"temp_{filename}"
    with open(temp_path, "wb") as f:
        f.write(file_bytes)
    
    result = extract_text(temp_path)
    if os.path.exists(temp_path):
        os.remove(temp_path)
    return result["text"]