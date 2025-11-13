# How to Render PlantUML Diagrams

The PlantUML diagrams have been enhanced with comprehensive details. Here's how to render them into high-quality images.

## What's New

### System Architecture Diagram (`system_architecture.puml`)
Now includes:
- ✅ Complete 3-tier architecture (Client → Frontend → Backend → AI → Data)
- ✅ All components with technology names
- ✅ Load balancer and scaling components
- ✅ External services (Groq, SendGrid, Twilio, Razorpay)
- ✅ Database details (MongoDB collections, Pinecone vector DB, S3 storage)
- ✅ Connection types (HTTP, WebSocket, Database)
- ✅ Detailed annotations and notes
- ✅ Professional color scheme
- ✅ Legend with key technologies

### Workflow Methodology Diagram (`workflow_methodology.puml`)
Now includes:
- ✅ Complete end-to-end workflow with swim lanes
- ✅ Document processing pipeline
- ✅ Text chunking and embedding generation
- ✅ Query processing with RAG pipeline
- ✅ Contract analysis flow
- ✅ All technical parameters and configurations
- ✅ Decision points (if-else conditions)
- ✅ Detailed notes at each step
- ✅ Performance metrics in legend
- ✅ Color-coded sections

## Rendering Methods

### Method 1: Online Rendering (Easiest - No Installation)

**Step 1:** Go to http://www.plantuml.com/plantuml/uml/

**Step 2:** Open the `.puml` file in a text editor and copy ALL content

**Step 3:** Paste into the online editor

**Step 4:** The diagram will render automatically

**Step 5:** Download as PNG
- Right-click on diagram → "Save image as..."
- Or use the download button if available

**Advantages:**
- ✅ No installation required
- ✅ Works on any OS
- ✅ Instant preview

**Disadvantages:**
- ❌ Internet connection required
- ❌ May timeout on very large diagrams
- ❌ Less control over output format

---

### Method 2: VS Code Extension (Recommended for Development)

**Installation:**

1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X / Cmd+Shift+X)
3. Search for "PlantUML" by jebbs
4. Click "Install"
5. Install Java (required):
   ```bash
   # Ubuntu/Debian
   sudo apt install default-jre
   
   # macOS
   brew install openjdk
   
   # Check installation
   java -version
   ```

**Usage:**

1. Open the `.puml` file in VS Code
2. Press `Alt+D` (or `Option+D` on Mac) to preview
3. The diagram appears in a side panel
4. To export:
   - Right-click on the preview
   - Select "Export Current Diagram"
   - Choose format: PNG (recommended for paper)
   - Choose location to save
   - For high-quality: Select "Export with Settings" → Set DPI to 300

**Keyboard Shortcuts:**
- `Alt+D` - Preview current diagram
- `Ctrl+Shift+P` → "PlantUML: Preview Current Diagram"
- `Ctrl+Shift+P` → "PlantUML: Export Current Diagram"

**Advantages:**
- ✅ Live preview as you edit
- ✅ Multiple export formats (PNG, SVG, PDF, EPS)
- ✅ High DPI control (300+ DPI for publications)
- ✅ Integrated with your workflow

---

### Method 3: Command Line (Best for Batch Processing)

**Installation:**

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install plantuml default-jre

# macOS
brew install plantuml

# Verify installation
plantuml -version
```

**Basic Usage:**

```bash
# Navigate to the directory
cd ieee_paper_images

# Render a single diagram
plantuml system_architecture.puml

# Render all PlantUML files
plantuml *.puml

# Specify output format
plantuml -tpng system_architecture.puml    # PNG (default)
plantuml -tsvg workflow_methodology.puml   # SVG (scalable)
plantuml -tpdf system_architecture.puml    # PDF (vector)
plantuml -teps workflow_methodology.puml   # EPS (for LaTeX)
```

**High-Quality Output (300 DPI for IEEE Paper):**

```bash
# Generate high-resolution PNG
plantuml -tpng -DPLANTUML_LIMIT_SIZE=16384 system_architecture.puml

# For even higher quality, export as SVG then convert
plantuml -tsvg system_architecture.puml
# Then use inkscape or another tool to convert to 300 DPI PNG
```

**Batch Processing Script:**

Create a file `render_all.sh`:
```bash
#!/bin/bash

echo "Rendering PlantUML diagrams..."

for file in *.puml; do
    echo "Processing $file..."
    plantuml -tpng "$file"
    plantuml -tsvg "$file"
done

echo "Done! Generated PNG and SVG files."
```

Make it executable and run:
```bash
chmod +x render_all.sh
./render_all.sh
```

**Advantages:**
- ✅ Scriptable and automatable
- ✅ Batch processing multiple files
- ✅ CI/CD integration possible
- ✅ Multiple output formats

---

### Method 4: Docker (Isolated Environment)

**If you want to avoid installing Java:**

```bash
# Pull PlantUML Docker image
docker pull plantuml/plantuml

# Render diagram
docker run --rm -v $(pwd):/data plantuml/plantuml system_architecture.puml

# Render all diagrams
docker run --rm -v $(pwd):/data plantuml/plantuml *.puml
```

---

## Output Formats Comparison

| Format | Use Case | Scalability | File Size | IEEE Compatible |
|--------|----------|-------------|-----------|-----------------|
| **PNG** | General use, web | No (raster) | Medium | ✅ Yes (300+ DPI) |
| **SVG** | Web, scalable | Yes (vector) | Small | ✅ Yes |
| **PDF** | Documents | Yes (vector) | Small | ✅ Yes (preferred) |
| **EPS** | LaTeX papers | Yes (vector) | Medium | ✅ Yes (LaTeX) |

**Recommendation for IEEE Paper:**
- Use **PDF** or **SVG** for scalability
- Or **PNG at 300 DPI** for raster format

---

## Verifying Output Quality

### Check Image Resolution:
```bash
# Using ImageMagick
identify -verbose system_architecture.png | grep -i resolution

# Using exiftool
exiftool system_architecture.png | grep -i resolution
```

### Check File Size:
```bash
ls -lh *.png *.svg *.pdf
```

Expected file sizes:
- PNG (300 DPI): 500 KB - 2 MB
- SVG: 50 KB - 200 KB
- PDF: 100 KB - 500 KB

---

## Troubleshooting

### Issue: "command not found: plantuml"

**Solution:**
```bash
# Install PlantUML
sudo apt-get install plantuml

# Or download manually
wget http://sourceforge.net/projects/plantuml/files/plantuml.jar/download -O plantuml.jar
alias plantuml='java -jar plantuml.jar'
```

### Issue: "Java not found"

**Solution:**
```bash
# Install Java Runtime
sudo apt install default-jre

# Verify
java -version
```

### Issue: Diagram too large / memory error

**Solution:**
```bash
# Increase memory limit
export JAVA_OPTS="-Xmx2048m"
plantuml system_architecture.puml

# Or split diagram into smaller parts
```

### Issue: Text cut off or overlapping

**Solution:**
- Edit the `.puml` file
- Adjust `skinparam defaultFontSize` (currently 11)
- Increase padding: `skinparam padding 10`
- Adjust component sizes

### Issue: Colors not rendering correctly

**Solution:**
- Try a different theme: Change `!theme vibrant` to `!theme plain`
- Or remove theme: Delete the `!theme` line
- Use custom colors: See PlantUML color documentation

### Issue: Online editor timeout

**Solution:**
- Use local installation instead
- Or simplify the diagram (remove some notes)
- Split into multiple diagrams

---

## Optimizing for IEEE Publication

### For LaTeX (IEEE Template):

```latex
\documentclass[conference]{IEEEtran}
\usepackage{graphicx}

\begin{document}

\begin{figure}[!t]
\centering
\includegraphics[width=3.5in]{system_architecture.pdf}
\caption{Multi-Tier System Architecture of JURI AI showing the complete technology stack across client, frontend, backend, AI, and data layers with external service integrations.}
\label{fig:architecture}
\end{figure}

\begin{figure}[!t]
\centering
\includegraphics[width=3.5in]{workflow_methodology.pdf}
\caption{Complete workflow and methodology of JURI AI demonstrating the end-to-end processing pipeline from document upload through text chunking, embedding generation, RAG-based query processing, and contract analysis with risk detection.}
\label{fig:workflow}
\end{figure}

\end{document}
```

### For Word (IEEE Template):

1. Insert → Pictures → Select PDF or PNG
2. Set width to 3.5 inches (single column) or 7 inches (double column)
3. Add caption: References → Insert Caption
4. Format: "Fig. 1. Description..."
5. Update cross-references automatically

### For Markdown (Preview):

```markdown
![System Architecture](ieee_paper_images/system_architecture.png)
*Figure 1: Multi-Tier System Architecture*

![Workflow Methodology](ieee_paper_images/workflow_methodology.png)
*Figure 2: Complete Workflow and Methodology*
```

---

## Converting to High-DPI PNG (if needed)

If you rendered as SVG or PDF and need PNG at 300 DPI:

### Using ImageMagick:
```bash
# Install ImageMagick
sudo apt install imagemagick

# Convert SVG to high-DPI PNG
convert -density 300 -background white -alpha remove -alpha off \
        system_architecture.svg system_architecture_300dpi.png

# Convert PDF to high-DPI PNG
convert -density 300 system_architecture.pdf system_architecture_300dpi.png
```

### Using Inkscape:
```bash
# Install Inkscape
sudo apt install inkscape

# Convert SVG to PNG at 300 DPI
inkscape --export-type=png --export-dpi=300 \
         --export-filename=system_architecture_300dpi.png \
         system_architecture.svg
```

---

## Quick Start Commands

**Complete workflow to generate all assets:**

```bash
# Navigate to directory
cd /home/aditya/Downloads/JURY-AI-main/ieee_paper_images

# Method 1: Using PlantUML command line
plantuml -tpng *.puml
plantuml -tpdf *.puml

# Method 2: Using Docker
docker run --rm -v $(pwd):/data plantuml/plantuml *.puml

# Method 3: VS Code
# Open each .puml file → Alt+D → Export

# Verify outputs
ls -lh *.png *.pdf *.svg

# Check quality
identify -verbose system_architecture.png | grep Resolution
```

---

## Final Checklist

Before using in your paper:

- [ ] Both diagrams rendered successfully
- [ ] Image resolution is 300 DPI or vector format (PDF/SVG)
- [ ] Text is readable at small sizes
- [ ] Colors are professional and print-friendly
- [ ] File sizes are reasonable (<2 MB each)
- [ ] No text cutoff or overlap
- [ ] Legends and notes are clear
- [ ] Consistent with paper's color scheme
- [ ] Referenced correctly in paper text
- [ ] Figure captions written
- [ ] Files named appropriately for submission

---

## Generated Files

After rendering, you should have:

```
ieee_paper_images/
├── system_architecture.puml          (source)
├── system_architecture.png           (300 DPI image)
├── system_architecture.svg           (optional: scalable)
├── system_architecture.pdf           (optional: vector)
├── workflow_methodology.puml         (source)
├── workflow_methodology.png          (300 DPI image)
├── workflow_methodology.svg          (optional: scalable)
└── workflow_methodology.pdf          (optional: vector)
```

---

## Support Resources

- **PlantUML Documentation:** https://plantuml.com/
- **PlantUML Online:** http://www.plantuml.com/plantuml/
- **VS Code Extension:** https://marketplace.visualstudio.com/items?itemName=jebbs.plantuml
- **IEEE Graphics Requirements:** https://www.ieee.org/publications/authors/

---

**Success!** Your diagrams are now publication-ready for the IEEE paper! 🎉

For questions: adityajare@example.com
