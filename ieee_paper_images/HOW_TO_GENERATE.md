# How to Generate All Paper Assets

This guide walks you through generating all visual assets for the JURI AI IEEE paper.

## Prerequisites

### Install Required Software

**Python Libraries:**
```bash
pip install matplotlib numpy pandas
```

**PlantUML (choose one):**

**Option A: VS Code Extension (Recommended)**
1. Open VS Code
2. Install "PlantUML" extension by jebbs
3. Install Java (required by PlantUML): `sudo apt install default-jre`

**Option B: Command Line**
```bash
# Ubuntu/Debian
sudo apt-get install plantuml default-jre

# macOS
brew install plantuml
```

**Option C: Online (No Installation)**
- Use http://www.plantuml.com/plantuml/

## Step-by-Step Guide

### Step 1: Generate Performance Charts

```bash
# Navigate to the images directory
cd /home/aditya/Downloads/JURY-AI-main/ieee_paper_images

# Run the chart generator
python generate_performance_charts.py
```

**Expected Output:**
```
============================================================
  JURI AI Performance Chart Generator
============================================================

Generating charts...
------------------------------------------------------------
✓ Saved: model_performance_comparison.png
✓ Saved: rag_performance_comparison.png
✓ Saved: per_class_f1_scores.png
✓ Saved: baseline_model_comparison.png
✓ Saved: system_scalability.png
✓ Saved: user_satisfaction.png
------------------------------------------------------------

✓ All charts generated successfully in: /home/aditya/.../ieee_paper_images
```

**Generated Files:**
- `model_performance_comparison.png` (300 DPI)
- `rag_performance_comparison.png` (300 DPI)
- `per_class_f1_scores.png` (300 DPI)
- `baseline_model_comparison.png` (300 DPI)
- `system_scalability.png` (300 DPI)
- `user_satisfaction.png` (300 DPI)

### Step 2: Render PlantUML Diagrams

**Method A: VS Code Extension**

1. Open `system_architecture.puml` in VS Code
2. Press `Alt+D` to preview
3. Right-click on preview → "Export Current Diagram"
4. Choose format: PNG
5. Choose location: same folder
6. Repeat for `workflow_methodology.puml`

**Method B: Command Line**

```bash
# Generate PNG from PlantUML files
plantuml system_architecture.puml
plantuml workflow_methodology.puml

# Or generate all at once
plantuml *.puml
```

**Method C: Online**

1. Go to http://www.plantuml.com/plantuml/
2. Open `system_architecture.puml` in a text editor
3. Copy entire content
4. Paste into PlantUML online editor
5. Click "Submit"
6. Download PNG
7. Repeat for `workflow_methodology.puml`

**Generated Files:**
- `system_architecture.png`
- `workflow_methodology.png`

### Step 3: Verify All Assets

Run this check:

```bash
cd ieee_paper_images
ls -lh *.png

# You should see 8 PNG files:
# 1. model_performance_comparison.png
# 2. rag_performance_comparison.png
# 3. per_class_f1_scores.png
# 4. baseline_model_comparison.png
# 5. system_scalability.png
# 6. user_satisfaction.png
# 7. system_architecture.png
# 8. workflow_methodology.png
```

### Step 4: Review Image Quality

Open each PNG file and verify:
- ✅ Text is crisp and readable
- ✅ Colors are distinct and professional
- ✅ Labels are not cut off
- ✅ Resolution is sufficient (300 DPI)

```bash
# Check DPI of images (optional)
identify -verbose model_performance_comparison.png | grep Resolution
# Should show: Resolution: 300x300
```

## Integrating Images into Paper

### LaTeX/IEEE Template

If using LaTeX (recommended for IEEE papers):

```latex
\begin{figure}[htbp]
\centerline{\includegraphics[width=\columnwidth]{ieee_paper_images/system_architecture.png}}
\caption{High-level System Architecture of JURI AI showing the three-tier design with React frontend, Node.js middleware, and FastAPI AI backend.}
\label{fig:architecture}
\end{figure}
```

### Word Document

1. Place cursor where you want the image
2. Insert → Pictures → select PNG file
3. Resize to fit column width (3.5 inches for IEEE two-column)
4. Add caption: References → Insert Caption
5. Format: "Fig. 1. Description..."

### Markdown (for preview)

```markdown
![System Architecture](ieee_paper_images/system_architecture.png)
*Fig. 1. High-level System Architecture of JURI AI.*
```

## Troubleshooting

### Issue: matplotlib not found

```bash
# Install matplotlib
pip install matplotlib

# Or with conda
conda install matplotlib
```

### Issue: PlantUML not rendering

**Check Java installation:**
```bash
java -version
# Should show Java version

# If not installed
sudo apt install default-jre
```

**Check PlantUML:**
```bash
plantuml -version
# Should show PlantUML version
```

### Issue: Images look blurry in paper

**Solution:**
- Ensure 300 DPI resolution (already set in script)
- Don't resize images beyond original dimensions
- Use vector format if possible (PDF instead of PNG)

**Generate PDF versions:**
```python
# Edit generate_performance_charts.py
# Change all instances of:
plt.savefig(output_dir / 'filename.png', dpi=300)
# To:
plt.savefig(output_dir / 'filename.pdf', format='pdf')
```

### Issue: PlantUML online timeout

**Solution:**
- Simplify diagram by removing some elements
- Use local PlantUML installation instead
- Split large diagrams into multiple smaller ones

## File Size Considerations

**PNG Files:**
- Charts: ~200-500 KB each
- Diagrams: ~100-300 KB each
- Total: ~2-4 MB for all images

**PDF Files (if needed):**
- Charts: ~50-150 KB each (smaller, vector-based)
- Diagrams: ~30-100 KB each
- Total: ~500 KB - 1.5 MB (much smaller!)

**For submission:**
- IEEE accepts both PNG and PDF
- PDF is preferred for diagrams (scalable)
- PNG is fine for charts at 300 DPI

## Quality Checklist

Before finalizing, verify:

**Charts:**
- [ ] All bars/lines clearly visible
- [ ] Labels readable at small size
- [ ] Legend present and clear
- [ ] Axis labels present
- [ ] Title descriptive
- [ ] Color scheme professional
- [ ] Data values shown
- [ ] 300 DPI resolution

**Diagrams:**
- [ ] All components labeled
- [ ] Arrows show data flow
- [ ] Layering is clear
- [ ] Text is readable
- [ ] No overlapping elements
- [ ] Professional appearance
- [ ] Consistent styling

**Integration:**
- [ ] All figures referenced in text
- [ ] Figure numbers sequential
- [ ] Captions descriptive
- [ ] Image files organized
- [ ] Proper file naming
- [ ] Copyright/attribution if needed

## Final Steps

1. **Create a figures folder in your paper directory:**
   ```bash
   mkdir -p paper_submission/figures
   cp ieee_paper_images/*.png paper_submission/figures/
   ```

2. **Rename for clarity (optional):**
   ```bash
   cd paper_submission/figures
   mv model_performance_comparison.png fig3_model_performance.png
   mv rag_performance_comparison.png fig4_rag_performance.png
   # ... etc
   ```

3. **Create a figure list document:**
   ```
   Fig. 1: system_architecture.png - System Architecture
   Fig. 2: workflow_methodology.png - Workflow Diagram
   Fig. 3: model_performance_comparison.png - Model Performance
   Fig. 4: rag_performance_comparison.png - RAG Performance
   Fig. 5: per_class_f1_scores.png - Per-Class F1 Scores
   Fig. 6: baseline_model_comparison.png - Baseline Comparison
   Fig. 7: system_scalability.png - Scalability Analysis
   Fig. 8: user_satisfaction.png - User Satisfaction Metrics
   ```

4. **Archive for submission:**
   ```bash
   cd paper_submission
   zip -r juri_ai_paper_figures.zip figures/
   ```

## Getting Help

**For Python/matplotlib issues:**
- Stack Overflow: https://stackoverflow.com/questions/tagged/matplotlib
- Matplotlib docs: https://matplotlib.org/stable/users/index.html

**For PlantUML issues:**
- PlantUML docs: https://plantuml.com/
- Online forum: https://forum.plantuml.net/

**For IEEE formatting:**
- IEEE Author Center: https://www.ieee.org/publications/authors/
- Template gallery: https://template-selector.ieee.org/

## Quick Commands Reference

```bash
# Generate all performance charts
python generate_performance_charts.py

# Generate PlantUML diagrams
plantuml *.puml

# Check image resolution
identify -verbose image.png | grep Resolution

# Convert PNG to PDF (if needed)
convert -density 300 image.png image.pdf

# Compress PNG (reduce file size)
pngquant --quality 80-90 image.png

# View all images
eog *.png  # Linux
open *.png # macOS
```

## Success Criteria

You're done when:
- ✅ 8 PNG files generated (6 charts + 2 diagrams)
- ✅ All images are 300 DPI or higher
- ✅ Text in images is clearly readable
- ✅ Images integrated into paper with captions
- ✅ Figure numbers match text references
- ✅ File sizes reasonable (<500 KB each)
- ✅ Images look professional in paper preview
- ✅ Ready for IEEE submission

---

**Need help?** Contact: adityajare@example.com

**Estimated time:** 10-15 minutes (first time), 2-3 minutes (subsequent runs)

**Last updated:** November 12, 2025
