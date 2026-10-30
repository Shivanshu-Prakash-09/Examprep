"""
Convert Syllabus_Year_Sem_Subject_Wise.pdf (text extracted with `pdftotext -layout`)
into database/seed/subjects.json.

Usage:
    pdftotext -layout Syllabus_Year_Sem_Subject_Wise.pdf syllabus.txt
    python3 scripts/parse_syllabus_pdf.py syllabus.txt database/seed/subjects.json

Subjects marked "Syllabus not available" or "No syllabus text" are skipped;
teachers add them later from the admin panel.
"""
import json
import re
import sys

RE_BRANCH = re.compile(r"^(CSE|IT|ECE|EEE) - ")
RE_YEAR = re.compile(r"^Year (\d)$")
RE_SEM = re.compile(r"^Semester (\d) \(")
RE_SUBJECT = re.compile(r"^(\d+)\. (.+) \((\d+) credits?\)$")
RE_UNIT = re.compile(r"^\s+Unit (I{1,3}|IV|V):\s*(.*)$")
RE_FOOTER = re.compile(r"Syllabus - Semester-wise by Branch \| Page \d+")


def parse(path):
    subjects, branch, year, sem, cur, unit_key = [], None, None, None, None, None
    for raw in open(path, encoding="utf-8"):
        line = raw.rstrip("\n").replace("\f", "")
        if not line.strip() or RE_FOOTER.search(line):
            continue
        if m := RE_BRANCH.match(line):
            branch = m.group(1); continue
        if m := RE_YEAR.match(line):
            year = int(m.group(1)); continue
        if m := RE_SEM.match(line):
            sem = int(m.group(1)); continue
        if m := RE_SUBJECT.match(line):
            cur = {"branch": branch, "year": year, "semester": sem,
                   "name": m.group(2).strip(), "credits": int(m.group(3)),
                   "units": {}, "note": ""}
            subjects.append(cur); unit_key = None; continue
        if cur is None:
            continue
        text = line.strip()
        if m := RE_UNIT.match(line):
            unit_key = m.group(1)
            cur["units"][unit_key] = m.group(2).strip()
        elif text.startswith("Note:"):
            cur["note"] = text[5:].strip(); unit_key = None
        elif text.startswith(("Syllabus not available", "No syllabus text")):
            cur["missing"] = True
        elif unit_key:
            cur["units"][unit_key] += " " + text
    kept = [s for s in subjects if s["units"] and not s.get("missing")]
    for s in kept:
        s.pop("missing", None)
    return subjects, kept


if __name__ == "__main__":
    src, dst = sys.argv[1], sys.argv[2]
    allsub, kept = parse(src)
    with open(dst, "w", encoding="utf-8") as f:
        json.dump(kept, f, indent=1, ensure_ascii=False)
    print(f"parsed {len(allsub)} subjects, kept {len(kept)} with syllabus -> {dst}")
