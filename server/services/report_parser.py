"""
Health report parsing service.

Takes raw text (from a hosted OCR API) and extracts test name / result /
unit / reference range rows. Real-world OCR output from scanned lab
reports rarely keeps a test's name, value, unit, and reference range on
one line -- each piece usually lands on its own line, with the true
reference range often sitting far away in a separate "Bio. Ref. Interval"
style section. This parser is line-sequence aware to handle that, rather
than assuming a single-line layout.

This intentionally does NOT attempt a medical diagnosis -- it only
surfaces which values are outside range and suggests this may correlate
with a general Ayurvedic pattern, with a strong disclaimer.
"""

import os
import re

import requests

DISCLAIMER = (
    "This is general traditional wellness information based on your report "
    "values, not a medical diagnosis. Please discuss these results with a "
    "qualified doctor, especially for any values significantly out of range."
)

OCR_SPACE_API_URL = "https://api.ocr.space/parse/image"
OCR_SPACE_API_KEY = os.environ.get("OCR_SPACE_API_KEY", "helloworld")

NUMBER_ONLY = re.compile(r"^[\d,]{1,6}\.?\d{0,3}$")
# Not anchored to the whole line anymore -- real reports often put the
# range alongside other text on the same line (e.g. "70 - 100 mg/dL" or
# "Normal: 70-100"), so we search for the pattern within the line rather
# than requiring the entire line to be just the range.
RANGE_LINE = re.compile(r"(\d+\.?\d*)\s*(?:-|–|to)\s*(\d+\.?\d*)")
LESS_GREATER_LINE = re.compile(r"[<>]\s*=?\s*(\d+\.?\d*)")
UNIT_LINE = re.compile(r"^[A-Za-zµ%/]{1,12}$")

STOPWORDS = {
    "test name", "results", "result", "units", "unit", "reference range",
    "ref range", "ref. range", "bio. ref. interval", "interpretation",
    "status", "normal", "note", "value", "values", "test description",
    "reference interval", "biological reference interval",
}


def _is_stopword(line: str) -> bool:
    return line.strip().lower().rstrip(":") in STOPWORDS


def extract_text_from_image(file_path: str) -> str:
    """
    OCR an uploaded report (image or PDF) using the OCR.space hosted API.
    Works for both images and PDFs -- no local Tesseract or Poppler binary
    required, which matters since Render's native environment doesn't
    allow installing either.
    """
    with open(file_path, "rb") as f:
        response = requests.post(
            OCR_SPACE_API_URL,
            files={"file": f},
            data={
                "apikey": OCR_SPACE_API_KEY,
                "language": "eng",
                "OCREngine": 2,
                "scale": True,
            },
            timeout=30,
        )
    response.raise_for_status()
    result = response.json()

    if result.get("IsErroredOnProcessing"):
        error_msg = result.get("ErrorMessage") or ["Unknown OCR error"]
        raise RuntimeError(f"OCR.space error: {error_msg}")

    parsed_results = result.get("ParsedResults") or []
    return "\n".join(r.get("ParsedText", "") for r in parsed_results)


def parse_report_text(raw_text: str) -> dict:
    """
    Parses raw OCR text into structured rows and flags out-of-range values.

    Strategy: walk the lines looking for a line that is just a number
    (a result value). Its test name is the nearest preceding non-stopword
    text line (that doesn't itself look like a bare unit, e.g. a leftover
    "mg/dL" line from the previous row); its unit is the line right after
    it, if it looks like a unit; its reference range is searched for in
    the next few lines. If no range is found nearby, a second pass looks
    for a "Bio. Ref. Interval" style section near the end of the report
    and assigns ranges from there in order, which is how many Indian lab
    reports (e.g. Dr Lal PathLabs, Redcliffe) lay out the true reference
    range away from the individual result rows.
    """
    lines = [l.strip() for l in raw_text.splitlines() if l.strip()]
    n = len(lines)
    rows = []
    used_range_idx = set()

    for i, line in enumerate(lines):
        clean = line.replace(",", "")
        if not NUMBER_ONLY.match(clean):
            continue
        try:
            result_value = float(clean)
        except ValueError:
            continue

        test_name = None
        for j in range(i - 1, max(i - 4, -1), -1):
            cand = lines[j]
            if _is_stopword(cand) or NUMBER_ONLY.match(cand):
                continue
            # Skip lines that are themselves just a bare unit (e.g. a
            # leftover "mg/dL" from the previous row) -- a real test
            # name won't look like a unit on its own.
            if UNIT_LINE.match(cand):
                continue
            if re.search(r"[A-Za-z]", cand) and 2 <= len(cand) <= 60:
                test_name = cand.strip(" :-")
                break
        if not test_name:
            continue

        unit = ""
        search_start = i + 1
        if search_start < n and UNIT_LINE.match(lines[search_start]):
            unit = lines[search_start]
            search_start += 1

        ref_range = None
        for k in range(search_start, min(search_start + 4, n)):
            if k in used_range_idx:
                continue
            range_match = RANGE_LINE.search(lines[k])
            lg_match = LESS_GREATER_LINE.search(lines[k])
            if range_match:
                ref_range = range_match.group(0)
                used_range_idx.add(k)
                break
            if lg_match:
                ref_range = lg_match.group(0)
                used_range_idx.add(k)
                break

        flag = _check_out_of_range(result_value, ref_range) if ref_range else "unknown"

        rows.append({
            "test_name": test_name,
            "result": result_value,
            "unit": unit,
            "reference_range": ref_range or "not detected",
            "flag": flag,
        })

    # Fallback: assign ranges from a "Bio. Ref. Interval" style section
    # to any rows that couldn't find one nearby, matched in order.
    unknown_indices = [idx for idx, r in enumerate(rows) if r["flag"] == "unknown"]
    if unknown_indices:
        header_idx = None
        for idx, line in enumerate(lines):
            if re.search(
                r"(?i)bio\.?\s*ref\.?\s*interval|reference\s*range|reference\s*interval",
                line,
            ):
                header_idx = idx
        if header_idx is not None:
            collected = []
            idx = header_idx + 1
            while idx < n and RANGE_LINE.match(lines[idx]):
                collected.append(lines[idx])
                idx += 1
            if len(collected) == len(unknown_indices):
                for pos, row_idx in enumerate(unknown_indices):
                    rows[row_idx]["reference_range"] = collected[pos]
                    rows[row_idx]["flag"] = _check_out_of_range(
                        rows[row_idx]["result"], collected[pos]
                    )

    return {
        "parsed_rows": rows,
        "disclaimer": DISCLAIMER,
    }


def _check_out_of_range(value: float, ref_range: str) -> str:
    ref_range = ref_range.strip()

    less_than = re.match(r"<\s*=?\s*([\d.]+)", ref_range)
    greater_than = re.match(r">\s*=?\s*([\d.]+)", ref_range)
    between = re.match(r"([\d.]+)\s*(?:-|–|to)\s*([\d.]+)", ref_range)

    if less_than:
        ceiling = float(less_than.group(1))
        return "high" if value >= ceiling else "normal"

    if greater_than:
        floor = float(greater_than.group(1))
        return "low" if value <= floor else "normal"

    if between:
        low, high = float(between.group(1)), float(between.group(2))
        if value < low:
            return "low"
        if value > high:
            return "high"
        return "normal"

    return "unknown"


if __name__ == "__main__":
    with open(
        "../../ml/datasets/reports/sample_reports/sample_report_1_cbc.txt"
    ) as f:
        text = f.read()

    result = parse_report_text(text)
    for row in result["parsed_rows"]:
        print(row)