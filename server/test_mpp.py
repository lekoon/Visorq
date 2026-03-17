import os
import sys
from mpp_to_ppt import MppToPptConverter

def test_conversion(mpp_file_path):
    if not os.path.exists(mpp_file_path):
        print(f"Error: File {mpp_file_path} not found.")
        return

    output_dir = "test_results"
    os.makedirs(output_dir, exist_ok=True)
    
    print(f"--- Starting Conversion ---")
    print(f"Input: {mpp_file_path}")
    
    try:
        converter = MppToPptConverter(mpp_file_path, output_dir)
        result_path = converter.convert()
        print(f"--- Success ---")
        print(f"Output PPT: {result_path}")
        print(f"Note: Ensure MS Project and PowerPoint are installed on this machine.")
    except Exception as e:
        print(f"--- Failed ---")
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python test_mpp.py <path_to_your_project.mpp>")
    else:
        test_conversion(sys.argv[1])
        
# Instructions to run:
# 1. pip install -r requirements.txt
# 2. python test_mpp.py example.mpp
