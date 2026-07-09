"""
Health report parsing service.

Takes raw text (either OCR output from pytesseract, or plain text for
testing) and extracts test name / result / unit / reference range rows
using pattern matching. Then flags values outside the reference range.

This intentionally does NOT attempt a medical diagnosis — it only
surfaces which values are outside range and suggests this may correlate
with a general Ayurvedic pattern, with a strong disclaimer.
"""

import re
from PIL import Image
import pytesseract

ROW_PATTERN = re.compile(
    r"^(?P<test>[A-Za-z0-9 /\(\)]+?)\s{2,}"
    r"(?P<result>[\d.,]+)\s+"
    r"(?P<unit>[A-Za-z/%µ]+)\s+"
    r"(?P<ref_range>[\d.<>\-\s]+)$"
)

DISCLAIMER = (
    "This is general traditional wellness information based on your report "
    "values, not a medical diagnosis. Please discuss these results with a "
    "qualified doctor, especially for any values significantly out of range."
)


def extract_text_from_image(image_path: str) -> str:
    """OCR an uploaded report image using free, local Tesseract."""
    image = Image.open(image_path)
    return pytesseract.image_to_string(image)


def parse_report_text(raw_text: str) -> dict:
    """
    Parses raw report text (from OCR or plain text) into structured rows,
    and flags which values fall outside their reference range.
    """
    rows = []
    for line in raw_text.splitlines():
        match = ROW_PATTERN.match(line.strip())
        if not match:
            continue

        test_name = match.group("test").strip()
        result_str = match.group("result").replace(",", "")
        unit = match.group("unit").strip()
        ref_range = match.group("ref_range").strip()

        try:
            result_value = float(result_str)
        except ValueError:
            continue

        flag = _check_out_of_range(result_value, ref_range)

        rows.append(
            {
                "test_name": test_name,
                "result": result_value,
                "unit": unit,
                "reference_range": ref_range,
                "flag": flag,
            }
        )

    return {
        "parsed_rows": rows,
        "disclaimer": DISCLAIMER,
    }


def _check_out_of_range(value: float, ref_range: str) -> str:
    """
    Very simple range check. Handles formats like:
      "12.0 - 15.5"   -> between
      "< 200"         -> less-than ceiling
      "> 40"          -> greater-than floor
    Returns "low", "high", "normal", or "unknown".
    """
    ref_range = ref_range.strip()

    less_than = re.match(r"<\s*([\d.]+)", ref_range)
    greater_than = re.match(r">\s*([\d.]+)", ref_range)
    between = re.match(r"([\d.]+)\s*-\s*([\d.]+)", ref_range)

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


# Example usage against one of the dummy sample reports:
if __name__ == "__main__":
    with open(
        "../../ml/datasets/reports/sample_reports/sample_report_1_cbc.txt"
    ) as f:
        text = f.read()

    result = parse_report_text(text)
    for row in result["parsed_rows"]:
        print(row)
