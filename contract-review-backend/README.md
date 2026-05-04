# Contract Review Backend

This is an isolated backend for the **second feature: Contract Review (Document Analysis)**.

It is intentionally separated from [chatbot-backend](../chatbot-backend) so both features can evolve independently without code collisions.

## Structure

- `main.py` - FastAPI app bootstrap
- `routes/contract_review.py` - analysis endpoints
- `services/document_parser.py` - file parsing (PDF/DOCX/TXT)
- `services/review_engine.py` - native contract-level risk engine
- `services/clause_extraction.py` - clause splitting logic
- `services/indian_rules.py` - Indian legal rule checks (friend code adapted)
- `services/ml_classifier.py` - optional ML clause classifier (fallback heuristic if ML deps absent)
- `services/legacy_adapter.py` - optional adapter for `copy_of_contract_review.py`
- `middlewares/exception_handlers.py` - global exception handling
- `models/schemas.py` - response models
- `legacy/copy_of_contract_review.py` - place your existing single-file logic here

## Run

```bash
cd /home/aditya/Downloads/JURY-AI-main/contract-review-backend
/home/aditya/Downloads/JURY-AI-main/.venv/bin/pip install -r requirements.txt
chmod +x start.sh
./start.sh
```

If you get `externally-managed-environment`, use the project virtual environment (`.venv`) and avoid system `pip`.

Service URL: `http://localhost:8001`

## Evaluation & quality checks

Run syntax checks for core files:

```bash
cd /home/aditya/Downloads/JURY-AI-main/contract-review-backend
make compile
```

Run evaluation on labeled dataset (sample included):

```bash
cd /home/aditya/Downloads/JURY-AI-main/contract-review-backend
make eval
```

Generate and evaluate a larger 120-case dataset:

```bash
cd /home/aditya/Downloads/JURY-AI-main/contract-review-backend
make eval-large
```

Default inputs/outputs:
- dataset: `scripts/eval_dataset.sample.json`
- report: `scripts/eval_report.json`
- large generated dataset: `scripts/eval_dataset.120.json`
- large report: `scripts/eval_report.120.json`

Override at runtime:

```bash
make eval DATASET=scripts/my_eval_dataset.json REPORT=scripts/my_eval_report.json
```

## API

- `GET /health`
- `POST /contract-review/analyze`
  - form field `contract_text` (optional)
  - file field `file` (optional)
  - one of them is required
  - returns contract-level risk + clause-level analysis (`clause_results`)

## ML primary classifier

Clause classification now runs in ML-first mode when a trained model is available. If the ML model is missing or fails to load, the service falls back to the current native architecture (heuristics + Indian rules + native risk engine).

To enable a trained model, point `CONTRACT_REVIEW_MODEL_PATH` at a directory containing either a Hugging Face model or a saved sklearn pipeline (`sklearn_pipeline.joblib`).

For CPU-only training on this machine, use the sklearn training script:

```bash
python scripts/train_risk_classifier_sklearn.py --dataset data/kaggle/all_reshaped_clauses.csv --label-map scripts/risk_label_map.legal_contract.json --output-dir models/risk_classifier_sklearn
```

To enable transformer-based clause classification on a machine with GPU/fast model access:

1. Install optional deps:
  - `/home/aditya/Downloads/JURY-AI-main/.venv/bin/pip install torch==2.4.1 --index-url https://download.pytorch.org/whl/cpu`
  - `/home/aditya/Downloads/JURY-AI-main/.venv/bin/pip install transformers==4.44.2 tokenizers==0.19.1 safetensors==0.4.5`
2. Optionally set env vars:
    - `CONTRACT_REVIEW_MODEL_NAME` (default: `nlpaueb/legal-bert-base-uncased`)
    - `CONTRACT_REVIEW_MODEL_PATH` (local fine-tuned model directory; overrides model name)
  - `USE_LEGACY_CONTRACT_REVIEW` (default: `false`; set to `true` only for legacy adapter fallback)

Training instructions are available in [TRAINING.md](TRAINING.md).

## Legacy migration

If your old code is in `copy_of_contract_review.py`, place it in `legacy/` with:

```python
def analyze_contract(text: str) -> dict:
    return {
        "summary": "...",
        "document_type": "contract",
        "risk_level": "low|medium|high",
        "risk_score": 0,
        "key_clauses_found": [],
        "missing_clauses": [],
        "suggestions": []
    }
```

The backend will auto-load it and use it before falling back to the native engine.
