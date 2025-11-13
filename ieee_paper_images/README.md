# JURI AI IEEE Paper - Visual Assets

This directory contains visual assets and diagram sources for the JURI AI IEEE research paper.

## Contents

### PlantUML Diagrams

1. **system_architecture.puml** - System architecture diagram showing the three-tier architecture
2. **workflow_methodology.puml** - Workflow diagram illustrating the AI processing pipeline

### Performance Data

3. **model_performance.csv** - CSV file with model performance metrics for visualization

### Performance Chart Generator

4. **generate_performance_charts.py** - Python script to generate all performance visualization charts

## Usage

### Rendering PlantUML Diagrams

You can render the `.puml` files into PNG images using:

**Option 1: VS Code Extension**
1. Install the "PlantUML" extension in VS Code
2. Open a `.puml` file
3. Press `Alt+D` or use Command Palette → "PlantUML: Preview Current Diagram"
4. Right-click on preview → "Export Current Diagram" → PNG

**Option 2: Online Renderer**
1. Visit http://www.plantuml.com/plantuml/
2. Copy the content of the `.puml` file
3. Paste and click "Submit"
4. Download the generated PNG

**Option 3: Command Line**
```bash
# Install PlantUML
sudo apt-get install plantuml  # Linux
brew install plantuml          # macOS

# Render diagrams
plantuml system_architecture.puml
plantuml workflow_methodology.puml
```

### Generating Performance Charts

**Requirements:**
```bash
pip install matplotlib numpy pandas
```

**Generate all charts:**
```bash
cd ieee_paper_images
python generate_performance_charts.py
```

**Output:**
The script generates 6 PNG images:
1. `model_performance_comparison.png` - Base vs Fine-tuned Legal-BERT comparison
2. `rag_performance_comparison.png` - RAG system performance across configurations
3. `per_class_f1_scores.png` - Per-class F1 scores for clause classification
4. `baseline_model_comparison.png` - Comparison with baseline ML models
5. `system_scalability.png` - Load testing results showing scalability
6. `user_satisfaction.png` - User study satisfaction metrics

All images are generated at 300 DPI, suitable for publication in IEEE papers.

## Image Specifications

- **Format**: PNG with transparent background (where applicable)
- **Resolution**: 300 DPI (publication quality)
- **Color Scheme**: Professional, colorblind-friendly palette
- **Dimensions**: Optimized for IEEE two-column format (3.5" width max)

## Integration with Paper

These images are referenced in the paper as:

- **Fig. 1**: System Architecture (`system_architecture.puml`)
- **Fig. 2**: Workflow Methodology (`workflow_methodology.puml`)
- **Fig. 3**: Model Performance Comparison (`model_performance_comparison.png`)
- **Fig. 4**: RAG Performance (`rag_performance_comparison.png`)
- **Fig. 5**: Per-Class F1 Scores (`per_class_f1_scores.png`)
- **Fig. 6**: Baseline Comparison (`baseline_model_comparison.png`)
- **Fig. 7**: System Scalability (`system_scalability.png`)
- **Fig. 8**: User Satisfaction (`user_satisfaction.png`)

## Customization

### PlantUML Themes

To change the theme of PlantUML diagrams, modify the `!theme` directive:
```plantuml
!theme vibrant      # Current
!theme bluegray     # Professional blue-gray
!theme materia      # Material design
!theme plain        # Minimal black and white
```

### Chart Colors

To customize chart colors, edit the color codes in `generate_performance_charts.py`:
```python
# Current colors (colorblind-friendly)
colors = ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6']

# IEEE standard colors
colors = ['#0072BD', '#D95319', '#EDB120', '#7E2F8E', '#77AC30']
```

## License

These visual assets are part of the JURI AI research project and are released under the MIT License.

## Contact

For questions about the diagrams or to request additional visualizations:
- Email: adityajare@example.com
- GitHub: RajendraMargale22/JURY-AI

---

**Note**: The import errors shown for matplotlib and numpy in the Python script are expected if these libraries are not installed. Run `pip install matplotlib numpy pandas` to resolve them before executing the script.
