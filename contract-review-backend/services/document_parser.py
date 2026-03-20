from pathlib import Path
import os
import re
from fastapi import UploadFile
from logger import logger


MAX_UPLOAD_BYTES = int(os.getenv("MAX_UPLOAD_BYTES", str(10 * 1024 * 1024)))  # 10 MB default
UPLOAD_SCAN_POLICY = os.getenv("UPLOAD_SCAN_POLICY", "basic").lower()

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".txt", ".md"}
ALLOWED_MIME_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
    "text/markdown",
    "application/octet-stream",  # some clients send this for txt/md
}


def _sanitize_filename(filename: str) -> str:
    base = Path(filename).name
    return re.sub(r"[^a-zA-Z0-9._-]", "_", base)


def _scan_uploaded_bytes(content: bytes, filename: str) -> None:
    if UPLOAD_SCAN_POLICY == "off":
        return

    lower_name = filename.lower()
    blocked_ext = {".exe", ".dll", ".bat", ".cmd", ".msi", ".sh", ".js", ".jar", ".ps1"}
    if any(lower_name.endswith(ext) for ext in blocked_ext):
        raise ValueError("Upload blocked by scanning policy")

    # Basic magic/header checks for executable content.
    suspicious_headers = [
        b"MZ",  # PE/EXE
        b"\x7fELF",  # Linux executable
        b"#!",  # script shebang
    ]
    if any(content.startswith(header) for header in suspicious_headers):
        raise ValueError("Upload blocked by scanning policy")

    if UPLOAD_SCAN_POLICY == "strict":
        lower_snippet = content[:4096].lower()
        if b"<script" in lower_snippet:
            raise ValueError("Upload blocked by strict scanning policy")


def extract_text_from_pdf(file_path: str) -> str:
    try:
        from pypdf import PdfReader

        reader = PdfReader(file_path)
        pages = []
        for page in reader.pages:
            pages.append(page.extract_text() or "")
        return "\n".join(pages).strip()
    except Exception as error:  # pylint: disable=broad-except
        logger.warning(f"PDF extraction failed: {error}")
        return ""


def extract_text_from_docx(file_path: str) -> str:
    try:
        from docx import Document  # python-docx

        document = Document(file_path)
        return "\n".join(p.text for p in document.paragraphs).strip()
    except Exception as error:  # pylint: disable=broad-except
        logger.warning(f"DOCX extraction failed: {error}")
        return ""


def extract_text_from_txt(file_path: str) -> str:
    try:
        return Path(file_path).read_text(encoding="utf-8", errors="ignore").strip()
    except Exception as error:  # pylint: disable=broad-except
        logger.warning(f"Text extraction failed: {error}")
        return ""


def save_upload_file(file: UploadFile, upload_dir: str = "./uploaded_contracts") -> str:
    Path(upload_dir).mkdir(parents=True, exist_ok=True)
    filename = file.filename or "uploaded_contract.txt"
    safe_name = _sanitize_filename(filename)
    extension = Path(safe_name).suffix.lower()

    if extension not in ALLOWED_EXTENSIONS:
        raise ValueError("Unsupported file type. Allowed: PDF, DOCX, TXT, MD")

    content_type = (file.content_type or "").lower()
    if content_type and content_type not in ALLOWED_MIME_TYPES:
        raise ValueError("Unsupported content type for uploaded file")

    file_path = Path(upload_dir) / safe_name

    content = file.file.read(MAX_UPLOAD_BYTES + 1)
    if len(content) > MAX_UPLOAD_BYTES:
        raise ValueError(f"File too large. Max allowed size is {MAX_UPLOAD_BYTES // (1024 * 1024)} MB")

    _scan_uploaded_bytes(content, safe_name)

    with open(file_path, "wb") as output_file:
        output_file.write(content)

    return str(file_path)


def extract_contract_text(file_path: str) -> str:
    extension = Path(file_path).suffix.lower()

    if extension == ".pdf":
        return extract_text_from_pdf(file_path)
    if extension == ".docx":
        return extract_text_from_docx(file_path)
    if extension in {".txt", ".md"}:
        return extract_text_from_txt(file_path)

    logger.warning(f"Unsupported file extension for extraction: {extension}")
    return ""
