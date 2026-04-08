VENV_PY := /home/aditya/Downloads/JURY-AI-main/.venv/bin/python
PYTHON ?= $(if $(wildcard $(VENV_PY)),$(VENV_PY),python3)
DATASET ?= scripts/eval_dataset.sample.json
REPORT ?= scripts/eval_report.json

.PHONY: compile eval

compile:
	$(PYTHON) -m py_compile routes/contract_review.py scripts/evaluate_contract_review.py tests/test_api_contract_review.py

eval:
	$(PYTHON) scripts/evaluate_contract_review.py --dataset $(DATASET) --out $(REPORT)
