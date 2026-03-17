import os
import shutil
import uuid
from fastapi import FastAPI, UploadFile, File, BackgroundTasks, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from mpp_to_ppt import MppToPptConverter

app = FastAPI(title="Project Tools API")

# Enable CORS for frontend interaction
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "temp_uploads"
OUTPUT_DIR = "temp_outputs"

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)

def cleanup_files(*paths):
    for path in paths:
        try:
            if os.path.exists(path):
                os.remove(path)
        except Exception as e:
            print(f"Error cleaning up {path}: {e}")

@app.post("/api/tools/mpp-to-ppt")
async def mpp_to_ppt(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    if not file.filename.endswith(".mpp"):
        raise HTTPException(status_code=400, detail="Only .mpp files are supported.")
    
    file_id = str(uuid.uuid4())
    mpp_filename = f"{file_id}.mpp"
    mpp_path = os.path.join(UPLOAD_DIR, mpp_filename)
    
    # Save uploaded file
    with open(mpp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    try:
        # Convert
        converter = MppToPptConverter(mpp_path, OUTPUT_DIR)
        ppt_path = converter.convert()
        
        # Schedule cleanup
        background_tasks.add_task(cleanup_files, mpp_path, ppt_path)
        
        return FileResponse(
            ppt_path, 
            filename=file.filename.replace(".mpp", ".pptx"),
            media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation"
        )
        
    except Exception as e:
        # Ensure cleanup on failure
        cleanup_files(mpp_path)
        print(f"Conversion error: {e}")
        raise HTTPException(status_code=500, detail=f"Conversion failed: {str(e)}")

@app.get("/health")
async def health():
    return {"status": "ok"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
