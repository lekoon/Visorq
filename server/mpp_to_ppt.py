import os
import uuid
import datetime
import win32com.client
from win32com.client import constants
import pythoncom
from config import CONFIG

# MSO Constants (defined manually if gencache fails)
msoShapeRectangle = 1
msoConnectorElbow = 3
msoArrowheadTriangle = 2
msoFalse = 0
msoTrue = -1

class MppToPptConverter:
    def __init__(self, mpp_path, output_dir):
        self.mpp_path = mpp_path
        self.output_dir = output_dir
        self.filename = f"{uuid.uuid4()}.pptx"
        self.output_path = os.path.join(output_dir, self.filename)
        
        self.prj_app = None
        self.ppt_app = None
        self.project = None
        self.presentation = None
        
    def _safe_release(self):
        """Ensure COM objects are released."""
        try:
            if self.project:
                self.project.Close(msoFalse)
            if self.prj_app:
                self.prj_app.Quit()
        except:
            pass
            
        try:
            if self.presentation:
                # self.presentation.Close() # Handled by saving
                pass
            if self.ppt_app:
                # self.ppt_app.Quit()
                pass
        except:
            pass
            
        self.project = None
        self.prj_app = None
        self.presentation = None
        self.ppt_app = None
        pythoncom.CoUninitialize()

    def convert(self):
        pythoncom.CoInitialize()
        try:
            return self._execute_conversion()
        finally:
            self._safe_release()

    def _execute_conversion(self):
        # 1. Open MS Project
        self.prj_app = win32com.client.Dispatch("MSProject.Application")
        self.prj_app.Visible = False
        self.prj_app.FileOpen(self.mpp_path)
        self.project = self.prj_app.ActiveProject
        
        # 2. Extract Data
        tasks = []
        prj_start = self.project.ProjectStart
        prj_finish = self.project.ProjectFinish
        total_days = (prj_finish - prj_start).days + 1
        
        # We use a map to store task ID -> (Top, Left, Width) for connectors
        task_shapes_map = {}

        # 3. Open PowerPoint
        self.ppt_app = win32com.client.Dispatch("PowerPoint.Application")
        # self.ppt_app.Visible = True # For debugging
        self.presentation = self.ppt_app.Presentations.Add()
        
        # Page Setup (A4 Landscape)
        # Width/Height can be set, but let's use the default or explicitly set
        self.presentation.PageSetup.SlideWidth = CONFIG["ppt_width"]
        self.presentation.PageSetup.SlideHeight = CONFIG["ppt_height"]
        
        slide = self.presentation.Slides.Add(1, 12) # 12 = ppLayoutBlank
        
        # 4. Draw Header
        self._draw_header(slide, prj_start, prj_finish)
        
        # 5. Draw Tasks
        idx = 0
        for task in self.project.Tasks:
            if task is None: continue
            if task.Summary: continue # Skip summary tasks as requested, or can be toggled
            
            task_data = {
                "id": task.ID,
                "name": task.Name,
                "start": task.Start,
                "finish": task.Finish,
                "percent_complete": task.PercentComplete,
                "level": task.OutlineLevel,
                "predecessors": task.Predecessors
            }
            
            # Position calculations
            top = CONFIG["start_top"] + idx * CONFIG["row_height"]
            left_offset = (task_data["start"] - prj_start).days * CONFIG["pixels_per_day"]
            left = CONFIG["left_margin"] + left_offset
            width = max(5, (task_data["finish"] - task_data["start"]).days * CONFIG["pixels_per_day"])
            height = CONFIG["row_height"] * CONFIG["bar_height_ratio"]
            
            # Add Task Label
            label = slide.Shapes.AddTextbox(1, 10, top, CONFIG["left_margin"] - 20, height)
            label.TextFrame.TextRange.Text = task_data["name"]
            label.TextFrame.TextRange.Font.Size = 10
            
            # Add Bar
            color = self._get_color(task_data["level"])
            bar = slide.Shapes.AddShape(msoShapeRectangle, left, top, width, height)
            bar.Fill.ForeColor.RGB = color
            bar.Line.Visible = msoFalse
            
            # Progress Overlay
            if task_data["percent_complete"] > 0:
                prog_width = width * (task_data["percent_complete"] / 100.0)
                prog_bar = slide.Shapes.AddShape(msoShapeRectangle, left, top, prog_width, height)
                prog_bar.Fill.ForeColor.RGB = CONFIG["colors"]["progress"]
                prog_bar.Fill.Transparency = 0.5
                prog_bar.Line.Visible = msoFalse
            
            # Store for connectors
            task_shapes_map[task_data["id"]] = {
                "top": top,
                "bottom": top + height,
                "left": left,
                "right": left + width,
                "center_y": top + height / 2
            }
            
            tasks.append(task_data)
            idx += 1

        # 6. Draw Connectors
        for task in tasks:
            if not task["predecessors"]: continue
            
            # Split predecessors (comma separated IDs potentially)
            preds = [p.strip() for p in str(task["predecessors"]).split(",") if p.strip()]
            curr_pos = task_shapes_map.get(task["id"])
            
            for pred_id_str in preds:
                # Predecessors can have FS, SS, etc. Simplification: extract numbers
                import re
                pred_id_match = re.search(r'\d+', pred_id_str)
                if not pred_id_match: continue
                pred_id = int(pred_id_match.group())
                
                pred_pos = task_shapes_map.get(pred_id)
                if pred_pos and curr_pos:
                    # Draw connector from Pred end to Current start
                    try:
                        conn = slide.Shapes.AddConnector(msoConnectorElbow, 
                                                         pred_pos["right"], pred_pos["center_y"], 
                                                         curr_pos["left"], curr_pos["center_y"])
                        conn.ConnectorFormat.BeginConnect(slide.Shapes(slide.Shapes.Count-1), 4) # This is tricky in COM, usually AddConnector is enough
                        conn.Line.EndArrowheadStyle = msoArrowheadTriangle
                        conn.Line.ForeColor.RGB = CONFIG["colors"]["connector"]
                    except:
                        pass # Silently fail for complex connectors in this simple version

        # 7. Save
        self.presentation.SaveAs(self.output_path)
        return self.output_path

    def _draw_header(self, slide, start_date, end_date):
        # Draw a simple timeline header
        total_days = (end_date - start_date).days + 1
        width = total_days * CONFIG["pixels_per_day"]
        
        header_rect = slide.Shapes.AddShape(msoShapeRectangle, CONFIG["left_margin"], 20, width, CONFIG["header_height"])
        header_rect.Fill.ForeColor.RGB = 0xEEEEEE
        header_rect.Line.ForeColor.RGB = 0xCCCCCC
        
        # Add date markers (each month or week)
        current = start_date
        while current <= end_date:
            offset = (current - start_date).days * CONFIG["pixels_per_day"]
            # Simplified: just show date every week
            txt = slide.Shapes.AddTextbox(1, CONFIG["left_margin"] + offset, 25, 50, 20)
            txt.TextFrame.TextRange.Text = current.strftime("%m/%d")
            txt.TextFrame.TextRange.Font.Size = 8
            current += datetime.timedelta(days=7)

    def _get_color(self, level):
        colors = CONFIG["colors"]
        if level == 1: return colors["level_1"]
        elif level == 2: return colors["level_2"]
        elif level == 3: return colors["level_3"]
        return colors["default"]

# Test script usage
if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        mpp = sys.argv[1]
        out_dir = os.path.dirname(mpp)
        converter = MppToPptConverter(mpp, out_dir)
        print(f"Converting {mpp}...")
        res = converter.convert()
        print(f"Saved to {res}")
    else:
        print("Usage: python mpp_to_ppt.py <path_to_mpp>")
