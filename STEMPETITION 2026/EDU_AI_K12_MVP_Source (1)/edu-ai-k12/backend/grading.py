import math


def format_assessment(data):
    def nonempty(value):
        if not isinstance(value, str) or not value.strip():
            raise ValueError("missing feedback")
        return value.strip()

    def number(value):
        return type(value) in (int, float) and math.isfinite(value)

    if not isinstance(data, dict) or not isinstance(data.get("criteria"), list):
        raise ValueError("missing criteria")
    assessment = {key: nonempty(data.get(key)) for key in ("summary", "strengths", "next_step")}
    rows = []
    lines = [assessment["summary"]]
    earned_total = max_total = 0
    complete = True
    for row in data["criteria"]:
        if not isinstance(row, dict) or "maximum" not in row or "earned" not in row:
            raise ValueError("invalid criterion")
        title, feedback = nonempty(row.get("title")), nonempty(row.get("feedback"))
        earned, maximum = row["earned"], row["maximum"]
        if maximum is None:
            if earned is not None:
                raise ValueError("unexpected score")
        else:
            if not number(maximum) or maximum <= 0:
                raise ValueError("invalid weight")
            max_total += maximum
            if earned is None:
                complete = False
            elif not number(earned) or not 0 <= earned <= maximum:
                raise ValueError("invalid score")
            else:
                earned_total += earned
        rows.append(dict(title=title, feedback=feedback, earned=earned, maximum=maximum))
        score = f" ({earned:g}/{maximum:g})" if earned is not None else ""
        lines.append(f"{title}{score}: {feedback}")
    total = round(10 * earned_total / max_total, 2) if complete and max_total else None
    assessment.update(criteria=rows, total=total)
    if total is not None:
        lines.append(f"Tổng điểm: {total:g}/10")
    lines.extend(["Điểm làm tốt: " + assessment["strengths"], "Cần bổ sung: " + assessment["next_step"]])
    return assessment, "\n\n".join(lines)
