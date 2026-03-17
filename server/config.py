# Project Tools Configuration

CONFIG = {
    # Gantt Chart Styles
    "row_height": 25,          # Height of each row in PPT (points)
    "bar_height_ratio": 0.6,    # Ratio of bar height to row height
    "start_top": 100,          # Starting Y position in PPT
    "pixels_per_day": 15,      # Horizontal scale: points per day
    "left_margin": 150,        # Left margin for task labels
    "header_height": 50,       # Height of the timeline header
    
    # Colors (RGB)
    "colors": {
        "level_1": 0x3355FF,   # Deep Blue
        "level_2": 0x66AAFF,   # Light Blue
        "level_3": 0x99CCFF,   # Sky Blue
        "default": 0xCCCCCC,   # Grey
        "progress": 0x000000,  # Black/Dark for progress overlay (semi-transparent)
        "connector": 0x555555  # Connector line color
    },
    
    # PPT Settings
    "ppt_width": 720,          # A4 Landscape approx width in points
    "ppt_height": 540,         # A4 Landscape approx height in points
}
