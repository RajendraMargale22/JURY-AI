VENV_PY := /home/aditya/Downloads/JURY-AI-main/.venv/bin/python
PYTHON ?= $(if $(wildcard $(VENV_PY)),$(VENV_PY),python3)
DATASET ?= scripts/eval_dataset.sample.json
REPORT ?= scripts/eval_report.json
LARGE_DATASET ?= scripts/eval_dataset.120.json
LARGE_REPORT ?= scripts/eval_report.120.json

.PHONY: compile eval gen-dataset eval-large

compile:
	$(PYTHON) -m py_compile routes/contract_review.py scripts/evaluate_contract_review.py tests/test_api_contract_review.py

eval:
	$(PYTHON) scripts/evaluate_contract_review.py --dataset $(DATASET) --out $(REPORT)

gen-dataset:
	$(PYTHON) scripts/generate_eval_dataset.py --out $(LARGE_DATASET)

eval-large: gen-dataset
	$(PYTHON) scripts/evaluate_contract_review.py --dataset $(LARGE_DATASET) --out $(LARGE_REPORT)
