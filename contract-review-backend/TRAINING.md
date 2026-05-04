# ML Training (Contract Review)

This guide trains a clause-level risk classifier (low/medium/high) for the contract review service.

On this Windows CPU-only machine, the recommended path is the local sklearn model below. It trains fast and does not need any Hugging Face downloads.

## Dataset

Recommended Kaggle dataset (clause-level labels):
- https://www.kaggle.com/datasets/changethan/legal-contract-dataset

The file used in this guide is `all_reshaped_clauses.csv`, which includes `clause_text` and `clause_type` columns.

## Setup

1. Install training dependencies:

```bash
pip install -r requirements-ml.txt
```

If you have a GPU, install the CUDA-enabled PyTorch build first, then re-run the command above.

2. Download the Kaggle dataset (requires Kaggle API token):

```bash
kaggle datasets download -d changethan/legal-contract-dataset -p data/kaggle --unzip
```

If you do not have a Kaggle token yet:

1. Create a Kaggle account and generate a new API token.
2. Save it to `%USERPROFILE%\.kaggle\kaggle.json` on Windows (create the folder if needed).
3. Confirm the CLI can authenticate:

```bash
kaggle datasets list -s legal-contract-dataset
```

## Train

Use the provided label map (edit as needed for your risk policy):

```bash
python scripts/train_risk_classifier_sklearn.py \
  --dataset data/kaggle/all_reshaped_clauses.csv \
  --text-col clause_text \
  --label-col clause_type \
  --label-map scripts/risk_label_map.legal_contract.json \
  --output-dir models/risk_classifier_sklearn
```

## Use In The API

Point the backend to the saved model directory:

```bash
set CONTRACT_REVIEW_MODEL_PATH=models/risk_classifier_sklearn
```

If the directory contains `sklearn_pipeline.joblib`, the API will load it automatically.

Then start the service as usual. The API will automatically use the trained classifier.

If the model path is missing or invalid, the API falls back to the current native contract review engine.

## Hard test (post-training)

Run a larger evaluation set to stress-check the trained model:

```bash
python scripts/generate_eval_dataset.py --out scripts/eval_dataset.120.json
python scripts/evaluate_contract_review.py --dataset scripts/eval_dataset.120.json --out scripts/eval_report.120.json
```

Optional load test against the running API:

```bash
python scripts/load_test_baseline.py
```

## Notes

- The risk label map is a starting point. Adjust it to match your internal risk taxonomy.
- For reproducible results, keep the same `--seed` and dataset split parameters.
- The evaluation script in `scripts/evaluate_contract_review.py` uses a synthetic dataset; use a real holdout set for production validation.
