"""Generate a deterministic, GB-scale CSV of original synthetic aptitude records.

Formula references point to IndiaBIX formula pages. Question wording and numeric
values are newly generated; this script does not copy their question bank.
"""
import argparse
from decimal import Decimal
from pathlib import Path


TOPICS = (
    "Percentages", "Ratio and Proportion", "Profit and Loss", "Average",
    "Simple Interest", "Compound Interest", "Time and Work", "Probability",
    "Data Interpretation", "Number Series",
)

SOURCES = {
    "Percentages": "https://www.indiabix.com/aptitude/percentage/formulas",
    "Ratio and Proportion": "https://www.indiabix.com/aptitude/ratio-and-proportion/formulas",
    "Profit and Loss": "https://www.indiabix.com/aptitude/profit-and-loss/formulas",
    "Average": "https://www.indiabix.com/aptitude/average/formulas",
    "Simple Interest": "https://www.indiabix.com/aptitude/simple-interest/formulas",
    "Compound Interest": "https://www.indiabix.com/aptitude/compound-interest/formulas",
    "Time and Work": "https://www.indiabix.com/aptitude/time-and-work/formulas",
    "Probability": "https://www.indiabix.com/aptitude/probability/formulas",
    "Data Interpretation": "https://www.indiabix.com/aptitude/percentage/formulas",
    "Number Series": "https://www.indiabix.com/aptitude/odd-man-out-and-series/072002",
}


def number(value) -> str:
    return format(Decimal(str(value)).quantize(Decimal("0.01")).normalize(), "f")


def csv_cell(value: object) -> bytes:
    text = str(value)
    if any(char in text for char in ',"\r\n'):
        text = '"' + text.replace('"', '""') + '"'
    return text.encode("utf-8")


def csv_line(fields) -> bytes:
    return b",".join(csv_cell(field) for field in fields) + b"\n"


def record(index: int) -> list[str]:
    topic = TOPICS[index % len(TOPICS)]
    sample = index // len(TOPICS)
    level = ("Easy", "Medium", "Hard")[sample % 3]
    if topic == "Percentages":
        base, rate = 400 + sample % 60 * 25, 5 + sample % 10 * 5
        answer = Decimal(base) * (100 + rate) / 100
        formula = "New value = Original value x (1 + rate/100)"
        source = f"Original value {base}; increase {rate}%"
        question = f"A product costs {base} units and its price increases by {rate}%. What is the new price?"
        explanation = f"{base} x (1 + {rate}/100) = {number(answer)}."
        unit = "units"
    elif topic == "Ratio and Proportion":
        a, b = 2 + sample % 4, 3 + sample % 5
        total = (a + b) * (4 + sample % 20)
        answer = total * a // (a + b)
        formula = "Share = Total x (ratio part / sum of ratio parts)"
        source = f"Ratio {a}:{b}; total {total}"
        question = f"A total of {total} items is divided in the ratio {a}:{b}. How many items are in the first share?"
        explanation = f"First share = {total} x {a}/({a}+{b}) = {answer}."
        unit = "items"
    elif topic == "Profit and Loss":
        cost, rate = 250 + sample % 100 * 25, 5 + sample % 10 * 5
        answer = Decimal(cost) * (100 + rate) / 100
        formula = "Gain% = (Selling price - Cost price) / Cost price x 100"
        source = f"Cost price {cost}; gain {rate}%"
        question = f"An item costs {cost} units and is sold at a gain of {rate}%. Find its selling price."
        explanation = f"Selling price = {cost} x (100 + {rate})/100 = {number(answer)}."
        unit = "units"
    elif topic == "Average":
        vals = [50 + (sample * 7 + j * 11) % 51 for j in range(4)]
        answer = Decimal(sum(vals)) / len(vals)
        formula = "Average = Sum of observations / Number of observations"
        source = f"Observations {vals}"
        question = f"What is the average of {', '.join(map(str, vals))}?"
        explanation = f"({ ' + '.join(map(str, vals)) }) / {len(vals)} = {number(answer)}."
        unit = "points"
    elif topic == "Simple Interest":
        principal, rate, years = 1000 + sample % 100 * 250, 4 + sample % 9, 1 + sample % 5
        answer = Decimal(principal * rate * years) / 100
        formula = "Simple interest = Principal x Rate x Time / 100"
        source = f"Principal {principal}; annual rate {rate}%; time {years} years"
        question = f"Find the simple interest on {principal} units at {rate}% per year for {years} years."
        explanation = f"{principal} x {rate} x {years} / 100 = {number(answer)} units."
        unit = "units"
    elif topic == "Compound Interest":
        principal, rate, years = 1000 + sample % 50 * 100, 5 + sample % 6 * 5, 1 + sample % 4
        amount = Decimal(principal) * (Decimal(1) + Decimal(rate) / 100) ** years
        answer = amount - principal
        formula = "Amount = Principal x (1 + Rate/100)^Time; compound interest = Amount - Principal"
        source = f"Principal {principal}; annual rate {rate}%; time {years} years; annual compounding"
        question = f"What compound interest accrues on {principal} units at {rate}% per year for {years} years, compounded annually?"
        explanation = f"Amount = {principal} x (1 + {rate}/100)^{years} = {number(amount)}; interest = {number(answer)}."
        unit = "units"
    elif topic == "Time and Work":
        days_a, days_b = 6 + sample % 15, 10 + sample * 3 % 20
        answer = Decimal(days_a * days_b) / Decimal(days_a + days_b)
        formula = "Combined time = 1 / (1/time A + 1/time B)"
        source = f"Worker A completes work in {days_a} days; worker B in {days_b} days"
        question = f"Worker A completes a job in {days_a} days and worker B in {days_b} days. How long do they need together?"
        explanation = f"Combined daily rate = 1/{days_a} + 1/{days_b}; time = {number(answer)} days."
        unit = "days"
    elif topic == "Probability":
        sides = 6 + sample % 3 * 2
        favourable = sides // 2
        answer = Decimal(favourable) / sides
        formula = "Probability = Favourable outcomes / Total equally likely outcomes"
        source = f"Fair {sides}-sided die; event is rolling an even number"
        question = f"A fair {sides}-sided die is rolled. What is the probability of an even result?"
        explanation = f"There are {favourable} even outcomes in {sides}; probability = {favourable}/{sides} = {number(answer)}."
        unit = "probability"
    elif topic == "Data Interpretation":
        previous, rate = 120 + sample % 30 * 20, 5 + sample % 10 * 5
        current = Decimal(previous) * (100 + rate) / 100
        answer = Decimal(rate)
        formula = "Percentage change = (Current - Previous) / Previous x 100"
        source = f"Previous period sales {previous}; current period sales {number(current)}"
        question = f"Sales increased from {previous} to {number(current)} units. What was the percentage increase?"
        explanation = f"({number(current)} - {previous}) / {previous} x 100 = {number(answer)}%."
        unit = "%"
    else:
        n = 2 + sample % 1000
        sequence = [k * (k + 1) for k in range(n, n + 5)]
        answer = (n + 5) * (n + 6)
        formula = "Consecutive products: term k = k x (k + 1)"
        source = f"Number series {', '.join(map(str, sequence))}, ?"
        question = f"Find the next term in the series: {', '.join(map(str, sequence))}, __."
        explanation = f"The terms follow k x (k + 1); next term = {n + 5} x {n + 6} = {answer}."
        unit = ""

    answer_text = f"{number(answer)}{(' ' + unit) if unit and unit != '%' and unit != 'probability' else ('%' if unit == '%' else '')}"
    numeric = float(answer)
    options = [f"{number(numeric + delta)}" for delta in (-2, -1, 1)] + [number(answer)]
    if unit == "%":
        options = [f"{choice}%" for choice in options]
    elif unit not in ("", "probability"):
        options = [f"{choice} {unit}" for choice in options]
    options = options[-1:] + options[:3]
    explanation = explanation.replace(number(answer), answer_text)
    return [
        f"SYN-{index + 1:09d}", "VECTRA Synthetic Aptitude Dataset", topic, level,
        source, formula, question, " | ".join(f"{chr(65 + n)}. {choice}" for n, choice in enumerate(options)),
        answer_text, explanation, SOURCES[topic], "synthetic_formula_template_v1", "",
    ]


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--size-gb", type=float, default=5, help="Target decimal gigabytes (default: 5).")
    parser.add_argument("--output", type=Path, default=Path("data/generated/aptitude_synthetic_5gb.csv"))
    args = parser.parse_args()
    target = int(args.size_gb * 1_000_000_000)
    if target < 1024:
        parser.error("--size-gb must produce at least 1 KB.")
    args.output.parent.mkdir(parents=True, exist_ok=True)
    header = ["record_id", "dataset", "topic", "difficulty", "source_values", "formula", "question", "options", "correct_answer", "explanation", "formula_reference", "generation_method", "synthetic_padding"]
    size = 0
    last_start = 0
    last_fields = None
    with args.output.open("wb", buffering=4 * 1024 * 1024) as output:
        header_bytes = csv_line(header)
        output.write(header_bytes)
        size += len(header_bytes)
        index = 0
        while True:
            fields = record(index)
            line = csv_line(fields)
            if size + len(line) > target:
                if last_fields is None:
                    raise RuntimeError("Requested output is too small for one generated record.")
                padding = target - size
                output.seek(last_start)
                output.truncate()
                last_fields[-1] = "x" * padding
                final_line = csv_line(last_fields)
                if len(final_line) != len(csv_line(record(index - 1))) + padding:
                    raise RuntimeError("Could not size final CSV record exactly.")
                output.write(final_line)
                size = last_start + len(final_line)
                break
            last_start = size
            last_fields = fields
            output.write(line)
            size += len(line)
            index += 1
            if size // 1_000_000_000 > (size - len(line)) // 1_000_000_000:
                print(f"Generated {size / 1_000_000_000:.1f} GB ({index:,} records)", flush=True)
    print(f"Wrote {size:,} bytes ({index:,} complete synthetic records) to {args.output.resolve()}")
    print("The final row includes a short padding field so the CSV reaches the requested exact byte size.")


if __name__ == "__main__":
    main()
