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

Default inputs/outputs:
- dataset: `scripts/eval_dataset.sample.json`
- report: `scripts/eval_report.json`

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

## Optional ML classifier

By default, clause classification runs in heuristic mode and is fully runnable with current requirements.

To enable transformer-based clause classification:

1. Install optional deps:
  - `/home/aditya/Downloads/JURY-AI-main/.venv/bin/pip install torch==2.4.1 --index-url https://download.pytorch.org/whl/cpu`
  - `/home/aditya/Downloads/JURY-AI-main/.venv/bin/pip install transformers==4.44.2 tokenizers==0.19.1 safetensors==0.4.5`
2. Optionally set env vars:
  - `CONTRACT_REVIEW_MODEL_NAME` (default: `distilbert-base-uncased-finetuned-sst-2-english`)
  - `CONTRACT_REVIEW_MODEL_PATH` (local fine-tuned model directory; overrides model name)
  - `USE_LEGACY_CONTRACT_REVIEW` (default: `false`; set to `true` only for legacy adapter fallback)

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
