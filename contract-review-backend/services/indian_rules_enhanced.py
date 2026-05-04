"""
indian_rules_enhanced.py
========================
Comprehensive Indian legal clause detection rules.
Covers: Service Agreements, Employment, Consultancy, Loan,
        Leave & Licence, Franchise, Share Purchase Agreements.

Version: 3.0 — All document types, party-name agnostic.
"""

import re
from typing import Callable, List, Optional


# ═══════════════════════════════════════════════════════════════
# SECTION 1 — KEYWORD BANKS
# ═══════════════════════════════════════════════════════════════

INDIAN_CURRENCY_TERMS = [
    "inr", "rs.", "rs ", "₹", "rupees", "rupee",
    "lakh", "lakhs", "lacs", "crore", "crores",
    "paise", "paisa", "rupees only", "only)",
]

FOREIGN_CURRENCY_TERMS = [
    "usd", "dollar", "dollars", "eur", "euro", "euros",
    "gbp", "pound", "pounds", "jpy", "yen", "cad",
    "aud", "chf", "sgd", "aed", "dirham",
]

INDIAN_CITIES_COURTS = [
    "mumbai", "delhi", "new delhi", "bangalore", "bengaluru",
    "chennai", "kolkata", "calcutta", "hyderabad", "pune",
    "ahmedabad", "surat", "jaipur", "lucknow", "kanpur",
    "nagpur", "indore", "bhopal", "visakhapatnam", "patna",
    "vadodara", "ludhiana", "agra", "nashik", "meerut",
    "coimbatore", "kochi", "cochin", "gurugram", "gurgaon",
    "noida", "faridabad", "chandigarh", "mysuru", "mysore",
    "thiruvananthapuram", "trivandrum", "bhubaneswar",
    "guwahati", "raipur", "rajkot", "amritsar", "allahabad",
    "prayagraj", "dehradun", "ranchi", "secunderabad",
    "high court of bombay", "high court of delhi",
    "high court of madras", "high court of calcutta",
    "high court of allahabad", "high court of kerala",
    "high court of gujarat", "high court of karnataka",
    "supreme court of india",
    "national company law tribunal", "nclt",
    "debt recovery tribunal", "drt",
    "income tax appellate tribunal", "itat",
    "competition commission of india", "cci",
    "real estate regulatory authority", "rera",
    "securities appellate tribunal", "sat",
]

FOREIGN_CITIES = [
    "london", "new york", "singapore", "dubai", "paris",
    "hong kong", "zurich", "geneva", "amsterdam", "frankfurt",
    "sydney", "toronto", "los angeles", "san francisco",
    "abu dhabi", "doha", "kuala lumpur", "tokyo",
]

INDIAN_ACTS = [
    "indian contract act", "indian contract act, 1872",
    "sale of goods act", "sale of goods act, 1930",
    "specific relief act", "specific relief act, 1963",
    "transfer of property act", "transfer of property act, 1882",
    "registration act", "registration act, 1908",
    "companies act", "companies act, 2013", "companies act, 1956",
    "limited liability partnership act", "llp act",
    "partnership act", "indian partnership act, 1932",
    "insolvency and bankruptcy code", "ibc", "ibc, 2016",
    "arbitration and conciliation act", "arbitration act, 1996",
    "code of civil procedure", "cpc", "cpc, 1908",
    "commercial courts act", "commercial courts act, 2015",
    "industrial disputes act", "industrial disputes act, 1947",
    "payment of wages act", "minimum wages act",
    "employees provident fund act", "epf act",
    "employees state insurance act", "esi act",
    "shops and establishments act",
    "maternity benefit act", "payment of gratuity act",
    "payment of bonus act", "contract labour act",
    "factories act", "sexual harassment of women at workplace",
    "posh act", "posh act, 2013",
    "patents act", "patents act, 1970",
    "trademarks act", "trademarks act, 1999",
    "copyright act", "copyright act, 1957",
    "information technology act", "it act", "it act, 2000",
    "digital personal data protection act", "dpdp act", "dpdpa",
    "income tax act", "income tax act, 1961",
    "goods and services tax act", "gst act",
    "foreign exchange management act", "fema", "fema, 1999",
    "foreign contribution regulation act", "fcra",
    "prevention of money laundering act", "pmla",
    "securities and exchange board of india act", "sebi act",
    "reserve bank of india act", "rbi act",
    "negotiable instruments act", "ni act", "ni act, 1881",
    "real estate regulatory authority act", "rera act",
    "stamp act", "indian stamp act", "indian stamp act, 1899",
    "maharashtra stamp act", "karnataka stamp act",
    "land acquisition act", "environment protection act",
    "consumer protection act", "consumer protection act, 2019",
    "competition act", "competition act, 2002",
    "epidemic diseases act", "disaster management act",
    "sarfaesi act", "sarfaesi act, 2002",
    "recovery of debts and bankruptcy act",
    "maharashtra rent control act", "maharashtra rent control act, 1999",
    "delhi rent control act", "tamil nadu rent control act",
    "electricity act", "electricity act, 2003",
    "foreign exchange management non-debt instruments rules",
    "fc-trs", "form fc-trs",
]

INDIAN_LEGAL_PHRASES = [
    "non-judicial stamp paper", "stamp paper", "e-stamp", "franking",
    "notarised", "notarized", "apostille",
    "registered post with acknowledgement due", "rpad",
    "aadhaar", "pan card", "pan number",
    "gstin", "gst number", "cin number", "llpin",
    "section 27", "sec. 27", "s. 27",
    "section 74", "sec. 74",
    "section 28", "sec. 28",
    "injunctive relief", "ex parte", "interim stay",
    "writ petition", "lok adalat", "consumer forum",
    "tds", "tax deducted at source", "tcs",
    "gst invoice", "tax invoice", "reverse charge mechanism",
    "input tax credit", "itc", "hsn code", "sac code",
    "neft", "rtgs", "imps", "upi",
    "demand draft", "post-dated cheque", "pdc", "nach",
    "bank guarantee", "letter of credit",
    "provident fund", "pf", "epf", "esi", "gratuity",
    "earned leave", "casual leave", "sick leave",
    "full and final settlement", "fnf", "relieving letter",
    "ctc", "cost to company", "basic salary", "hra",
    "esop", "employee stock option",
    "leave and licence", "lease deed", "security deposit",
    "maintenance charges", "society charges", "property tax",
    "khata", "encumbrance certificate", "sale deed",
    "power of attorney", "poa", "gpa", "spa",
    "occupancy certificate", "completion certificate",
    "trade secret", "proprietary information", "know-how",
    "without prejudice", "in witness whereof", "whereas",
    "mutatis mutandis", "inter alia", "prima facie",
    "bona fide", "ab initio", "force majeure",
    "pari passu", "ipso facto", "res judicata", "ultra vires",
    "sh-4", "share transfer form", "share certificate",
    "fc-trs", "fdi", "fpi", "ecb",
    "material adverse change", "mac", "mae",
    "earnout", "earn-out", "milestone payment",
    "escrow", "escrow account", "indemnity escrow",
    "conditions precedent", "closing date", "long stop date",
    "representations and warranties",
    "due diligence", "data room",
    "right of first refusal", "rofr", "rofo",
    "tag along", "drag along",
    "anti-dilution", "liquidation preference",
]

INDIAN_REGULATORY_BODIES = [
    "sebi", "securities and exchange board of india",
    "rbi", "reserve bank of india",
    "irda", "irdai",
    "trai", "telecom regulatory authority of india",
    "cci", "competition commission of india",
    "nclt", "national company law tribunal",
    "nclat",
    "enforcement directorate", "ed",
    "income tax department",
    "gst council",
    "ministry of corporate affairs", "mca",
    "registrar of companies", "roc",
    "resolution professional",
    "official liquidator",
]

STRONG_PARTY_NAMES = [
    "company", "employer", "licensor", "landlord",
    "lender", "franchisor", "buyer", "purchaser",
    "service provider", "consultant", "vendor", "owner",
    "partner 1", "managing partner", "majority partner",
    "dominant partner", "general partner",
]

WEAK_PARTY_NAMES = [
    "employee", "licensee", "tenant", "borrower",
    "franchisee", "seller", "sellers", "client",
    "contractor", "service recipient",
]

LOAN_DOCUMENT_MARKERS = [
    "borrower", "lender", "loan amount", "emi",
    "nbfc", "disbursement", "repayment schedule",
    "sarfaesi", "asset reconstruction",
    "mortgage", "penal interest",
]


# ═══════════════════════════════════════════════════════════════
# SECTION 2 — HELPERS
# ═══════════════════════════════════════════════════════════════

def _contains_any(text: str, keywords: list) -> bool:
    t = text.lower()
    return any(kw in t for kw in keywords)


def _extract_inr_amount(text: str) -> Optional[int]:
    match = re.search(
        r"(?:inr|rs\.?|₹)\s*([\d,]+(?:\s*(?:lakh|lac|crore|thousand))?)",
        text.lower()
    )
    if not match:
        return None
    raw = match.group(1).lower()
    num_str = re.sub(r"[,\s]", "", re.sub(
        r"lakh.*|lac.*|crore.*|thousand.*", "", raw)) or "0"
    try:
        num = int(num_str)
    except ValueError:
        return None
    if "crore" in raw:
        num *= 10_000_000
    elif "lakh" in raw or "lac" in raw:
        num *= 100_000
    elif "thousand" in raw:
        num *= 1_000
    return num


def _strong_party_in(text: str) -> bool:
    return _contains_any(text, STRONG_PARTY_NAMES)


def _weak_party_in(text: str) -> bool:
    return _contains_any(text, WEAK_PARTY_NAMES)


# ═══════════════════════════════════════════════════════════════
# SECTION 3 — CORE RULES (All Document Types)
# ═══════════════════════════════════════════════════════════════

def check_non_compete(clause_text: str) -> Optional[str]:
    keywords = [
        "non-compete", "non compete", "noncompete",
        "restraint of trade", "restrict",
        "cannot join competitor", "shall not engage",
        "shall not be employed", "post-employment restriction",
        "following cessation of employment",
        "after termination", "after resignation",
        "after leaving", "after the end of employment",
        "competing business", "competing entity",
        "competitor", "rival company",
        "within the territory of india", "within india",
        "within a radius", "km radius",
        "section 27", "sec. 27",
    ]
    if _contains_any(clause_text, keywords):
        return "High Risk: Potentially void under Sec. 27, Indian Contract Act"
    return None


def check_arbitration(clause_text: str) -> Optional[str]:
    arb_keywords = [
        "arbitration", "arbitrator", "arbitral tribunal",
        "sole arbitrator", "panel of arbitrators",
        "arbitral award", "seat of arbitration",
        "icc arbitration", "siac", "lcia", "diac", "uncitral",
    ]
    if not _contains_any(clause_text, arb_keywords):
        return None
    text_lower = clause_text.lower()

    if any(city in text_lower for city in FOREIGN_CITIES):
        return "Medium Risk: Arbitration seat outside India — check Arbitration and Conciliation Act 1996"

    unilateral_patterns = [
        "appointed solely by",
        "from its panel of approved arbitrators",
        "from their panel",
        "nominated solely by",
        "chosen solely by",
        "selected solely by",
        "designated solely by",
        "appointed by the company alone",
        "appointed unilaterally",
    ]
    if any(p in text_lower for p in unilateral_patterns):
        if _strong_party_in(clause_text):
            return "High Risk: Arbitrator appointed unilaterally by stronger party — violates natural justice"

    one_sided_costs = [
        "borne entirely by the franchisee",
        "borne entirely by the licensee",
        "borne entirely by the borrower",
        "borne entirely by the employee",
        "borne entirely by partners 2 and 3",
        "borne entirely by the minority partners",
        "borne by the other partners",
        "borne solely by the",
        "all costs of arbitration shall be borne by",
        "regardless of the outcome",
    ]
    if any(p in text_lower for p in one_sided_costs):
        return "High Risk: Arbitration costs entirely on weaker party — procedurally unfair"

    return None


def check_arbitration_costs_one_sided(clause_text: str) -> Optional[str]:
    text_lower = clause_text.lower()
    if not _contains_any(text_lower, ["arbitration", "arbitrator", "arbitral tribunal"]):
        return None

    cost_patterns = [
        "borne entirely by partners 2 and 3",
        "borne entirely by the minority partners",
        "borne by the other partners",
        "all costs of arbitration shall be borne by",
        "regardless of the outcome",
    ]
    if any(pattern in text_lower for pattern in cost_patterns):
        return "High Risk: Arbitration costs entirely on one side regardless of outcome are procedurally unfair"
    return None


def check_foreign_law(clause_text: str) -> Optional[str]:
    foreign_laws = [
        "new york law", "english law", "singapore law",
        "laws of england", "laws of new york",
        "laws of singapore", "laws of usa",
        "laws of united states", "delaware law",
        "cayman islands law", "uae law", "dubai law",
    ]
    if _contains_any(clause_text, foreign_laws):
        return "High Risk: Governing law outside India may be unenforceable in Indian courts"
    return None


def check_termination_period(clause_text: str) -> Optional[str]:
    if not _contains_any(clause_text, [
        "termination", "terminate", "notice period",
        "notice of termination", "without cause",
    ]):
        return None
    text_lower = clause_text.lower()
    if "notice" in text_lower:
        match = re.search(r"\b(\d+)\s*(days|months)\b", text_lower)
        if match:
            value, unit = int(match.group(1)), match.group(2)
            if value < 7 and unit == "days":
                return "Medium Risk: Termination notice period less than 7 days may be unfair"
    return None


def check_asymmetric_termination(clause_text: str) -> Optional[str]:
    if not _contains_any(clause_text, [
        "terminate", "termination", "notice period",
        "right to terminate", "may terminate",
        "dissolve", "dissolution of the partnership",
        "dissolve the partnership", "wind up the firm",
    ]):
        return None
    text_lower = clause_text.lower()

    # Day ratio asymmetry
    party_pairs = [
        ("service provider", "client"),
        ("licensor", "licensee"),
        ("landlord", "tenant"),
        ("employer", "employee"),
        ("lender", "borrower"),
        ("franchisor", "franchisee"),
        ("company", "employee"),
        ("buyer", "seller"),
        ("partner 1", "partner 2"),
        ("partner 1", "partners 2 and 3"),
        ("managing partner", "partner"),
    ]
    for strong, weak in party_pairs:
        if strong in text_lower and weak in text_lower:
            day_values = [int(v) for v in re.findall(
                r"(\d+)\s*\(?.*?\)?\s*days", text_lower)]
            if len(day_values) >= 2:
                min_d, max_d = min(day_values), max(day_values)
                if min_d > 0 and (max_d / min_d) >= 5:
                    return "High Risk: Termination notice periods are highly asymmetric between parties"

    if "without cause" in text_lower and "termination fee" in text_lower:
        return "High Risk: One-sided termination — without cause right plus fee burden on weaker party"

    liability_free = [
        "without any liability to the sellers",
        "without any liability to the seller",
        "without liability to the",
        "terminate without liability",
        "no liability upon termination",
    ]
    if any(p in text_lower for p in liability_free):
        return "High Risk: Stronger party can terminate without liability — weaker party bears all risk"

    no_exit = [
        "shall have no right to terminate",
        "no right to terminate",
        "may not terminate",
        "cannot terminate",
        "other than mutual consent",
        "seller shall not be entitled to terminate",
        "licensee shall not be entitled to terminate",
    ]
    if any(p in text_lower for p in no_exit):
        return "High Risk: One party has no termination right whatsoever — completely locked in"

    if any(
        token in text_lower
        for token in [
            "partner 1 shall be entitled to dissolve",
            "entitled to dissolve the partnership",
            "dissolve the partnership at any time",
        ]
    ) and any(token in text_lower for token in ["without notice", "without assigning any reason", "sole discretion"]):
        return "High Risk: Asymmetric dissolution right allows one partner to dissolve firm unilaterally"

    return None


def check_unilateral_capital_control(clause_text: str) -> Optional[str]:
    text_lower = clause_text.lower()
    keywords = [
        "consent of partner 1 alone",
        "consent of the managing partner alone",
        "consent of partners 2 and 3 shall not be required",
        "capital restructuring",
        "without consent of other partners",
        "sole authority over capital",
        "capital contribution",
        "introduce additional capital",
        "withdraw capital",
        "capital without consent",
    ]
    if not _contains_any(text_lower, keywords):
        return None
    if (
        "alone" in text_lower
        or "shall not be required" in text_lower
        or "sole discretion" in text_lower
        or "without consent" in text_lower
    ):
        return "High Risk: Unilateral capital control gives minority partners no effective say"
    return None


def check_independent_valuation(clause_text: str) -> Optional[str]:
    text_lower = clause_text.lower()
    keywords = [
        "appointed by partner 1",
        "appointed by the managing partner",
        "accountant appointed by",
        "valuer appointed by",
        "determination shall be final and binding",
        "final and binding on all partners",
        "no right to appoint an independent valuer",
        "no independent audit",
        "sole determination of",
        "determined by partner 1's accountant",
        "retiring partner shall have no right to appoint",
    ]
    if _contains_any(text_lower, keywords):
        return "High Risk: Valuation/accounts determined by one party appointee with no independent check"
    return None


def check_books_inspection_right(clause_text: str) -> Optional[str]:
    text_lower = clause_text.lower()
    keywords = [
        "inspect the books",
        "inspection of books",
        "books of accounts",
        "access to accounts",
        "right to inspect",
        "inspect financial records",
        "not entitled to inspect",
        "without consent to inspect",
        "books of the firm",
    ]
    if not _contains_any(text_lower, keywords):
        return None
    if (
        "not entitled to inspect" in text_lower
        or "without prior written consent" in text_lower
        or "sole discretion" in text_lower
        or "may be withheld" in text_lower
    ):
        return "High Risk: Restricting book-inspection rights may violate Partnership Act Sec. 12(d)"
    return None


def check_unlimited_borrowing(clause_text: str) -> Optional[str]:
    text_lower = clause_text.lower()
    keywords = [
        "borrow money without limit",
        "borrow without limit",
        "borrow without consent",
        "unlimited borrowing",
        "borrow any amount",
        "borrowing authority",
        "borrow on behalf of the firm",
        "incur debt without limit",
        "create liability without consent",
    ]
    if _contains_any(text_lower, keywords):
        return "High Risk: Unlimited borrowing authority without partner consent exposes all partners"

    if (
        "borrow" in text_lower
        and "without limit" in text_lower
        and ("without consent" in text_lower or "on behalf of the firm" in text_lower)
    ):
        return "High Risk: Unlimited borrowing authority without partner consent exposes all partners"
    return None


def check_subjective_expulsion(clause_text: str) -> Optional[str]:
    text_lower = clause_text.lower()
    keywords = [
        "expel",
        "expulsion",
        "removal of partner",
        "remove partner",
        "exclude partner",
        "cease to be a partner",
    ]
    if not _contains_any(text_lower, keywords):
        return None

    if (
        "sole opinion" in text_lower
        or "sole discretion" in text_lower
        or "as determined solely" in text_lower
        or "in partner 1's opinion" in text_lower
        or "without cause" in text_lower
    ):
        return "High Risk: Subjective expulsion trigger allows removal on one party's sole opinion"

    match = re.search(r"(\d+)\s*(?:\(.*?\))?\s*days", text_lower)
    if match and int(match.group(1)) <= 7:
        return "High Risk: Expulsion with very short notice may violate natural justice"
    return None


def check_profit_retention(clause_text: str) -> Optional[str]:
    text_lower = clause_text.lower()
    keywords = [
        "retain profits",
        "retain any portion",
        "retain distributable profits",
        "working capital reserve",
        "without obligation to distribute",
        "no obligation to distribute",
        "sole discretion to retain",
        "withhold profit distribution",
        "delay profit distribution",
    ]
    if _contains_any(text_lower, keywords):
        if "sole discretion" in text_lower or "without any obligation" in text_lower or "no obligation" in text_lower:
            return "Medium Risk: Profit retention at sole discretion can unfairly defer minority distributions"
    return None


def check_payment_terms(clause_text: str) -> Optional[str]:
    if not _contains_any(clause_text, [
        "payment", "invoice", "fee", "amount", "retainer",
        "consideration", "compensation", "remuneration",
        "milestone payment", "advance payment", "installment",
    ]):
        return None
    if _contains_any(clause_text, FOREIGN_CURRENCY_TERMS) and \
            not _contains_any(clause_text, INDIAN_CURRENCY_TERMS):
        return "Medium Risk: Payment in foreign currency without INR fallback — verify FEMA compliance"
    return None


def check_high_interest_penalty(clause_text: str) -> Optional[str]:
    if not _contains_any(clause_text, [
        "interest", "penal interest", "penalty interest",
        "default interest", "late payment interest",
        "compound interest", "penalty", "late fee",
        "liquidated damages", "section 74",
    ]):
        return None
    match = re.search(r"(\d{1,2}(?:\.\d+)?)\s*%", clause_text.lower())
    if match:
        rate = float(match.group(1))
        if rate >= 24:
            return "High Risk: Interest/penalty rate >= 24% — likely challengeable under ICA Sec. 74"
        if rate >= 18:
            return "Medium Risk: Interest rate >= 18% appears aggressive and may be penal"
    return None


def check_confidentiality(clause_text: str) -> Optional[str]:
    if not _contains_any(clause_text, [
        "confidential", "confidentiality", "nda",
        "non-disclosure", "trade secret",
        "proprietary information", "know-how",
    ]):
        return None
    text_lower = clause_text.lower()
    if any(w in text_lower for w in [
        "indefinitely", "perpetual", "in perpetuity",
        "forever", "unlimited period", "no time limit",
        "without any geographical limitation",
    ]):
        return "High Risk: Confidentiality obligation is indefinite in duration — overbroad"
    if any(w in text_lower for w in [
        "worldwide", "global", "without geographical limit",
        "applies worldwide", "apply worldwide",
    ]):
        return "High Risk: Confidentiality obligation is geographically unlimited — overbroad"
    return None


def check_indemnity(clause_text: str) -> Optional[str]:
    if not _contains_any(clause_text, [
        "indemnity", "indemnify", "indemnification",
        "hold harmless", "defend and indemnify",
        "save harmless", "keep indemnified",
    ]):
        return None
    text_lower = clause_text.lower()
    if ("each party" in text_lower or "mutual" in text_lower) \
            and "direct losses" in text_lower:
        return None
    negated_cap_patterns = [
        r"without\s+(any\s+)?cap", r"no\s+(liability\s+)?cap",
        r"unlimited\s+liability", r"without\s+(any\s+)?limit",
    ]
    if any(re.search(p, text_lower) for p in negated_cap_patterns):
        return "High Risk: No liability cap — unlimited indemnity exposure"
    if "unconditional" in text_lower or "irrevocable" in text_lower:
        return "High Risk: Indemnity language is unconditional/irrevocable"
    if not re.search(r"\blimit\b|\bcap\b", text_lower):
        if _contains_any(clause_text, ["indemnity", "hold harmless"]):
            return "High Risk: No liability cap mentioned — may be legally risky"
    return None


def check_force_majeure(clause_text: str) -> Optional[str]:
    if not _contains_any(clause_text, [
        "force majeure", "act of god", "beyond reasonable control",
        "epidemic", "pandemic", "natural disaster", "flood",
        "earthquake", "war", "civil unrest", "lockdown",
        "bandh", "hartal", "strike",
    ]):
        return None
    text_lower = clause_text.lower()
    one_sided = [p for p in STRONG_PARTY_NAMES
                 if f"{p} may terminate" in text_lower]
    if one_sided and "either party" not in text_lower:
        return "Medium Risk: Force majeure termination rights appear one-sided"
    return None


def check_jurisdiction(clause_text: str) -> Optional[str]:
    if not _contains_any(clause_text, [
        "jurisdiction", "court", "venue", "forum",
        "exclusive jurisdiction", "courts of", "courts at",
    ]):
        return None
    if any(city in clause_text.lower() for city in FOREIGN_CITIES):
        return "High Risk: Exclusive foreign jurisdiction — may not be enforceable under CPC Sec. 20"
    return None


def check_ip_clauses(clause_text: str) -> Optional[str]:
    if not _contains_any(clause_text, [
        "intellectual property", "ip rights", "copyright",
        "patent", "trademark", "trade mark", "moral rights",
        "source code", "work product", "invention",
        "copyright act", "patents act", "trademarks act",
        "irrevocably assigns", "assigns all",
    ]):
        return None
    text_lower = clause_text.lower()

    if any(p in text_lower for p in [
        "assigns goodwill", "assign goodwill", "goodwill generated",
        "goodwill shall vest", "no compensation for goodwill",
        "goodwill upon termination",
        "irrevocably assigns to the franchisor",
    ]):
        return "High Risk: Irrevocable goodwill assignment with zero compensation"

    if "whether or not during working hours" in text_lower:
        return "High Risk: IP claim extends to work done outside working hours — overbroad"

    sole_phrases = [
        "sole and exclusive property of the service provider",
        "sole and exclusive property of the consultant",
        "sole and exclusive property of the company",
        "sole and exclusive property of the franchisor",
        "sole and exclusive property of the licensor",
    ]
    if any(p in text_lower for p in sole_phrases):
        return "High Risk: IP ownership is heavily one-sided in favour of stronger party"

    if "irrevocably assigns" in text_lower and \
            _contains_any(clause_text, ["copyright", "patent"]):
        return "Medium Risk: Irrevocable IP assignment — verify scope under Copyright Act 1957"

    if "revocable license" in text_lower and "non-transferable" in text_lower:
        return "Medium Risk: Client/licensee rights are narrowly scoped and revocable"

    if "waives" in text_lower and "moral rights" in text_lower:
        return "Medium Risk: Moral rights waiver — enforceability uncertain under Copyright Act 1957"

    return None


def check_limit_liability(clause_text: str) -> Optional[str]:
    if not _contains_any(clause_text, [
        "limitation of liability", "limit of liability",
        "total aggregate liability", "aggregate liability",
        "maximum liability", "liability cap",
        "liability shall not exceed",
        "shall not be liable for more than",
    ]):
        return None
    text_lower = clause_text.lower()
    match = re.search(r"\b(\d+)%\b", text_lower)
    if match and int(match.group(1)) > 100:
        return "High Risk: Liability cap exceeds 100% — likely invalid"
    amount = _extract_inr_amount(text_lower)
    if amount is not None:
        if amount <= 50_000:
            return "High Risk: Liability cap extremely low — likely unconscionable"
        if amount <= 5_00_000:
            return "High Risk: Liability cap disproportionately low for a commercial contract"
    return None


def check_unilateral_amendment(clause_text: str) -> Optional[str]:
    if not _contains_any(clause_text, [
        "amend", "amendment", "modify", "modification",
        "revise", "revision", "update", "change", "vary",
        "at its sole discretion", "reserves the right to change",
        "right to amend", "revise the interest rate",
        "right to revise", "reserves the right to revise",
        "profit sharing ratio may be revised",
        "revised at any time by partner",
        "no right to object to such revision",
        "profit ratio", "sharing ratio may be changed",
    ]):
        return None
    text_lower = clause_text.lower()

    if ("amended only by" in text_lower or
            "amended solely by" in text_lower) and \
            _strong_party_in(clause_text):
        return "High Risk: Unilateral amendment right — only stronger party can modify terms"

    deemed = [
        "continued use", "continued operation",
        "continued repayment", "continued employment",
        "continued acceptance",
    ]
    if any(p in text_lower for p in deemed) and \
            "constitute acceptance" in text_lower:
        return "High Risk: Deemed acceptance of amendments via continued use — unfair under ICA"

    if "at its sole discretion" in text_lower and \
            _contains_any(clause_text, ["amend", "modify", "revise",
                                        "change", "vary"]):
        return "High Risk: Sole discretion to amend without mutual consent"

    return None


def check_indefinite_non_solicitation(clause_text: str) -> Optional[str]:
    if not _contains_any(clause_text, [
        "non-solicitation", "non solicitation", "solicit",
        "poach", "recruit", "headhunt", "induce to leave",
    ]):
        return None
    year_match = re.search(r"(\d+)\s*\(?.*?\)?\s*years",
                           clause_text.lower())
    if year_match and int(year_match.group(1)) >= 3:
        return "Medium Risk: Non-solicitation duration 3+ years may be unreasonable"
    return None


def check_misc_boilerplate(clause_text: str) -> Optional[str]:
    if _contains_any(clause_text, [
        "entire agreement", "whole agreement",
        "severability", "severable", "waiver", "no waiver",
        "counterparts", "headings", "further assurance",
        "independent contractor", "no partnership",
        "no joint venture", "no agency",
    ]):
        return "Low Risk: Standard boilerplate clause"
    return None


# ═══════════════════════════════════════════════════════════════
# SECTION 4 — INDIAN LAW SPECIFIC RULES
# ═══════════════════════════════════════════════════════════════

def check_stamp_duty(clause_text: str) -> Optional[str]:
    if _contains_any(clause_text, [
        "stamp duty", "stamp paper", "non-judicial stamp paper",
        "e-stamp", "franking", "indian stamp act",
        "maharashtra stamp act", "karnataka stamp act",
        "telangana stamp act", "duly stamped",
    ]):
        return "Low Risk: Stamp duty clause — verify correct value per applicable State Stamp Act"
    return None


def check_fema_compliance(clause_text: str) -> Optional[str]:
    if not _contains_any(clause_text, [
        "fema", "foreign exchange management act",
        "foreign exchange", "repatriation", "remittance",
        "rbi approval", "external commercial borrowing", "ecb",
        "foreign direct investment", "fdi", "nri",
        "overseas payment", "cross-border payment",
        "fc-trs", "form fc-trs",
        "foreign exchange management non-debt instruments",
    ]):
        return None
    text_lower = clause_text.lower()
    if any(p in text_lower for p in [
        "solely by the sellers", "solely by the borrower",
        "solely by the licensee", "penalty shall be borne by",
        "liability shall be borne solely",
        "non-compliance with fema",
    ]):
        return "Medium Risk: FEMA/regulatory penalties shifted entirely to weaker party"
    return "Medium Risk: Cross-border payment or foreign party — verify FEMA 1999 compliance"


def check_data_privacy(clause_text: str) -> Optional[str]:
    text_lower = clause_text.lower()
    if ("credit score" in text_lower or "cibil score" in text_lower) and \
       any(w in text_lower for w in ["not less than", "minimum",
                                     "represents", "warrants"]):
        return None
    if _contains_any(clause_text, [
        "personal data", "personal information", "data privacy",
        "data protection", "sensitive personal data",
        "digital personal data protection act", "dpdp act",
        "information technology act", "user data", "biometric data",
    ]):
        return "Medium Risk: Data privacy clause — ensure compliance with DPDP Act 2023"
    if _contains_any(clause_text, [
        "borrower's information", "financial data",
        "repayment history", "credit information",
        "without consent of the borrower",
        "without requiring consent",
        "credit bureau", "cibil", "crif", "equifax", "experian",
    ]) and _contains_any(clause_text, [
        "share", "disclose", "transfer", "provide", "transmit",
    ]):
        return "Medium Risk: Data sharing without explicit consent — verify DPDP Act 2023"
    return None


def check_labour_law_compliance(clause_text: str) -> Optional[str]:
    if _contains_any(clause_text, [
        "provident fund", "pf", "epf", "employee state insurance",
        "esi", "gratuity", "bonus", "minimum wages", "overtime",
        "working hours", "leave policy", "earned leave",
        "maternity benefit", "contract labour", "labour law",
        "industrial disputes", "retrenchment",
        "shops and establishments", "posh", "sexual harassment",
    ]):
        return "Low Risk: Employment/labour clause — verify compliance with applicable labour laws"
    return None


def check_rera_compliance(clause_text: str) -> Optional[str]:
    if _contains_any(clause_text, [
        "rera", "real estate regulatory authority",
        "real estate project", "promoter", "allotment letter",
        "possession date", "carpet area", "super built-up area",
        "completion certificate", "occupancy certificate",
        "rera registration number",
    ]):
        return "Medium Risk: Real estate clause — verify RERA registration and compliance"
    return None


def check_gst_clause(clause_text: str) -> Optional[str]:
    if _contains_any(clause_text, [
        "gst", "goods and services tax",
        "cgst", "sgst", "igst", "utgst",
        "gst invoice", "gstin", "input tax credit", "itc",
        "reverse charge", "rcm", "hsn code", "sac code",
        "inclusive of tax", "exclusive of tax",
        "plus applicable taxes",
    ]):
        return "Low Risk: GST clause — verify correct tax rate, GSTIN and place of supply"
    return None


def check_insolvency_clause(clause_text: str) -> Optional[str]:
    if _contains_any(clause_text, [
        "insolvency", "insolvent", "bankruptcy", "bankrupt",
        "winding up", "wound up", "liquidation",
        "corporate insolvency resolution process", "cirp",
        "ibc", "insolvency and bankruptcy code",
        "moratorium", "resolution professional",
        "financial creditor", "operational creditor",
        "nclt", "nclat",
    ]):
        return "High Risk: Insolvency clause — review IBC 2016 implications carefully"
    return None


def check_consumer_protection(clause_text: str) -> Optional[str]:
    if _contains_any(clause_text, [
        "consumer", "consumer protection", "consumer forum",
        "consumer court", "ncdrc", "unfair trade practice",
        "deficiency in service", "defective goods",
        "product liability",
    ]):
        return "Medium Risk: Consumer protection clause — ensure compliance with Consumer Protection Act 2019"
    return None


def check_tds_compliance(clause_text: str) -> Optional[str]:
    if _contains_any(clause_text, [
        "tds", "tax deducted at source",
        "section 194-i", "section 194i",
        "section 194", "form 16a", "form 26as",
        "tds certificate", "tax deduction", "withholding tax",
    ]):
        return "Low Risk: TDS clause — verify correct rate and timely filing under Income Tax Act 1961"
    return None


# ═══════════════════════════════════════════════════════════════
# SECTION 5 — LOAN / NBFC SPECIFIC RULES
# ═══════════════════════════════════════════════════════════════

def check_guarantee_clause(clause_text: str) -> Optional[str]:
    if not _contains_any(clause_text, [
        "personal guarantee", "corporate guarantee",
        "irrevocable guarantee", "unconditional guarantee",
        "continuing guarantee", "guarantee for repayment",
        "guarantor", "guarantee the entire",
    ]):
        return None
    text_lower = clause_text.lower()
    if "unconditional" in text_lower or "irrevocable" in text_lower:
        return "High Risk: Guarantee is unconditional/irrevocable — unlimited personal exposure"
    if "continuing guarantee" in text_lower and \
            "not be discharged" in text_lower:
        return "Medium Risk: Continuing guarantee not dischargeable by variation — overbroad"
    return None


def check_sarfaesi_notice(clause_text: str) -> Optional[str]:
    if not _contains_any(clause_text, [
        "sarfaesi", "sarfaesi act",
        "securitisation and reconstruction",
        "enforce the mortgage", "enforce security",
        "asset reconstruction", "possession of property",
        "symbolic possession",
    ]):
        return None
    text_lower = clause_text.lower()
    skip = [
        "governed by", "governing law", "laws of india including",
        "subject to the laws", "recovery of debts",
        "debt recovery tribunal",
    ]
    if any(p in text_lower for p in skip):
        return None
    if "without notice" in text_lower or \
            "without any notice" in text_lower:
        return "High Risk: SARFAESI enforcement without notice — mandatory 60-day notice required by law"
    if "assign" in text_lower or "asset reconstruction" in text_lower:
        return "Medium Risk: SARFAESI assignment clause — verify borrower rights are preserved"
    return "Medium Risk: SARFAESI enforcement clause — verify statutory notice and RBI compliance"


def check_subjective_default(clause_text: str) -> Optional[str]:
    if _contains_any(clause_text, [
        "event of default", "events of default",
        "default shall occur", "constitute a default",
        "deemed default", "constitute an event of default",
    ]) and _contains_any(clause_text, [
        "sole discretion", "at its discretion",
        "believes that", "considers that",
        "in jeopardy", "material adverse change",
        "as determined solely", "in the opinion of",
    ]):
        return "High Risk: Default trigger based on sole discretion — no objective standard"
    return None


def check_assignment_clause(clause_text: str) -> Optional[str]:
    if not _contains_any(clause_text, [
        "assign", "assignment", "transfer its rights",
        "novation", "asset reconstruction company", "arc",
    ]):
        return None
    text_lower = clause_text.lower()
    if "without the consent" in text_lower or \
            "without prior consent" in text_lower or \
            "without consent of the borrower" in text_lower or \
            "without consent of the seller" in text_lower:
        return "Medium Risk: One-sided assignment right without weaker party's consent"
    if "asset reconstruction" in text_lower:
        return "Medium Risk: Assignment to ARC under SARFAESI — verify borrower rights"
    return None


def check_waiver_of_statutory_rights(clause_text: str) -> Optional[str]:
    if _contains_any(clause_text, [
        "waives all rights", "waive all rights",
        "waives any right", "waiver of rights",
        "waives notice", "waive notice",
        "waives right to notice", "waives right to receive",
        "waives right to challenge", "relinquishes all rights",
        "no right to object",
    ]):
        return "High Risk: Waiver of statutory rights — likely void and unenforceable under ICA"
    return None


def check_unilateral_disbursement(clause_text: str) -> Optional[str]:
    if _contains_any(clause_text, [
        "withhold", "reduce", "cancel disbursement",
        "right to withhold", "cancel the loan",
        "right to cancel disbursement",
        "absolute and unconditional right",
        "without any obligation to state reasons",
    ]):
        text_lower = clause_text.lower()
        if "sole discretion" in text_lower or \
                "absolute" in text_lower or \
                "unconditional right" in text_lower:
            return "High Risk: Unilateral disbursement cancellation with no recourse for borrower"
    return None


def check_prepayment_penalty(clause_text: str) -> Optional[str]:
    if not _contains_any(clause_text, [
        "prepayment", "pre-payment", "prepay",
        "prepayment penalty", "early repayment",
        "foreclosure charge",
    ]):
        return None
    match = re.search(r"(\d+(?:\.\d+)?)\s*%", clause_text.lower())
    if match and float(match.group(1)) >= 3:
        return "Medium Risk: Prepayment penalty >= 3% — RBI guidelines restrict charges for floating rate loans"
    return None


# ═══════════════════════════════════════════════════════════════
# SECTION 6 — RENTAL / LEAVE & LICENCE RULES
# ═══════════════════════════════════════════════════════════════

def check_deposit_forfeiture(clause_text: str) -> Optional[str]:
    if not _contains_any(clause_text, [
        "forfeit", "forfeiture", "retain the deposit",
        "security deposit", "retain security",
        "withhold deposit", "entire security deposit",
    ]):
        return None
    text_lower = clause_text.lower()
    if ("sole discretion" in text_lower or
        "solely by the licensor" in text_lower or
        "solely by the landlord" in text_lower or
        "entire security deposit" in text_lower or
            "forfeit the entire" in text_lower):
        return "High Risk: Security deposit forfeiture at sole discretion — unconscionable under ICA"
    return None


def check_utility_disconnection(clause_text: str) -> Optional[str]:
    if not _contains_any(clause_text, [
        "disconnect", "disconnection", "cut off",
        "electricity", "water charges", "utility",
    ]):
        return None
    text_lower = clause_text.lower()
    if "without notice" in text_lower or \
            "without prior notice" in text_lower:
        return "High Risk: Utility disconnection without notice — may violate Electricity Act 2003"
    return None


def check_unrestricted_access(clause_text: str) -> Optional[str]:
    if not _contains_any(clause_text, [
        "inspect", "inspection", "enter and inspect",
        "right to inspect", "right of entry",
        "enter the premises", "unannounced inspection",
    ]):
        return None
    text_lower = clause_text.lower()
    if "without prior notice" in text_lower or \
            "at any time without" in text_lower or \
            "without notice" in text_lower:
        return "Medium Risk: Unrestricted access/inspection rights without notice — one-sided"
    return None


def check_rent_control_waiver(clause_text: str) -> Optional[str]:
    if _contains_any(clause_text, [
        "maharashtra rent control act",
        "rent control act", "tenancy rights",
        "shall not claim tenancy", "no tenancy rights",
        "not claim any rights under", "waives tenancy",
        "delhi rent control", "tamil nadu rent control",
        "does not create any tenancy",
    ]):
        text_lower = clause_text.lower()
        if "shall not claim" in text_lower or \
                "no tenancy" in text_lower or \
                "does not create" in text_lower:
            return "High Risk: Waiver of statutory tenancy rights — enforceability varies by state"
        return "Low Risk: Rent control clause — verify applicable State Rent Control Act"
    return None


def check_one_sided_liability_exclusion(clause_text: str) -> Optional[str]:
    if _contains_any(clause_text, [
        "licensor shall not", "landlord shall not",
        "licensor is not", "owner shall not",
        "franchisor shall not be liable",
        "lender shall not be liable",
        "company shall not be liable",
        "service provider shall not be liable",
        "partner 1 shall not", "managing partner shall not",
        "majority partner shall not", "dominant party shall not",
    ]) and _contains_any(clause_text, [
        "shall not be liable", "not liable for",
        "no liability for", "business loss",
        "business interruption", "consequential loss",
        "indirect loss", "howsoever caused",
    ]):
        return "High Risk: One-sided liability exclusion — only protects stronger party"
    return None


# ═══════════════════════════════════════════════════════════════
# SECTION 7 — FRANCHISE SPECIFIC RULES
# ═══════════════════════════════════════════════════════════════

def check_territorial_rights(clause_text: str) -> Optional[str]:
    if _contains_any(clause_text, [
        "non-exclusive", "no exclusive territory",
        "no territorial rights", "no exclusivity",
        "reserves the right to appoint other franchisees",
        "open company-owned outlets",
        "within the same city", "within the same locality",
        "within the same mall",
        "without any compensation to the franchisee",
        "no territorial protection", "no protected territory",
    ]):
        return "High Risk: No territorial exclusivity — Franchisor can compete directly in same location"
    return None


def check_renewal_rights(clause_text: str) -> Optional[str]:
    if _contains_any(clause_text, [
        "no automatic right of renewal",
        "no right of renewal",
        "renewal at franchisor's discretion",
        "renewal entirely at",
        "no right to renew", "not entitled to renewal",
        "no compensation upon non-renewal",
        "no compensation on expiry",
        "investment shall not entitle",
        "no guaranteed renewal",
    ]):
        return "High Risk: No renewal right despite significant capital investment — one-sided"
    return None


def check_fund_accountability(clause_text: str) -> Optional[str]:
    if not _contains_any(clause_text, [
        "marketing fund", "advertising fund",
        "national marketing fund", "brand fund",
        "promotional fund", "marketing contribution",
    ]):
        return None
    text_lower = clause_text.lower()
    if ("no obligation to account" in text_lower or
        "absolute discretion" in text_lower or
            "not required to account" in text_lower):
        return "Medium Risk: Marketing fund collected with no accountability obligation"
    return None


def check_supplier_lockin(clause_text: str) -> Optional[str]:
    if not _contains_any(clause_text, [
        "approved vendor", "approved supplier",
        "designated supplier", "approved vendor list",
        "mandatory supplier", "solely from suppliers approved",
        "change the approved vendor list",
    ]):
        return None
    text_lower = clause_text.lower()
    if ("without notice" in text_lower or
        "at any time" in text_lower or
            "sole discretion" in text_lower):
        return "Medium Risk: Mandatory supplier lock-in with unilateral changes — may raise Competition Act 2002 concerns"
    return "Low Risk: Approved supplier clause — verify pricing is fair and auditable"


def check_exit_fee(clause_text: str) -> Optional[str]:
    if not _contains_any(clause_text, [
        "exit fee", "early termination fee", "early exit fee",
        "termination penalty", "termination fee", "exit penalty",
        "break fee", "break-fee", "breakup fee",
        "reverse break fee", "walk away fee", "abort fee",
    ]):
        return None
    text_lower = clause_text.lower()
    weak_pay = [
        "franchisee shall pay", "licensee shall pay",
        "employee shall pay", "borrower shall pay",
        "seller shall pay", "sellers shall pay",
        "from the sellers", "from sellers",
        "entitled to claim",
    ]
    if any(p in text_lower for p in weak_pay):
        amount = _extract_inr_amount(text_lower)
        if amount and amount >= 1_00_000:
            return (f"High Risk: One-sided exit fee of ₹{amount:,.0f} "
                    f"only on weaker party — may be penal under ICA Sec. 74")
        return "High Risk: One-sided exit fee clause — only the weaker party pays to exit"
    return None


# ═══════════════════════════════════════════════════════════════
# SECTION 8 — M&A / SHARE PURCHASE AGREEMENT RULES
# ═══════════════════════════════════════════════════════════════

def check_mac_definition(clause_text: str) -> Optional[str]:
    if not _contains_any(clause_text, [
        "material adverse change", "material adverse effect",
        "mac", "mae", "material adverse",
        "adverse effect on the business",
        "adverse effect on the target",
    ]):
        return None
    text_lower = clause_text.lower()
    if any(p in text_lower for p in [
        "solely by the buyer", "determined by the buyer",
        "buyer's sole discretion", "sole opinion of the buyer",
        "as determined solely", "in the opinion of the buyer",
    ]):
        return "High Risk: Subjective MAC defined solely by Buyer — no objective standard, open to abuse"
    return None


def check_earnout_discretion(clause_text: str) -> Optional[str]:
    if not _contains_any(clause_text, [
        "earnout", "earn-out", "earn out",
        "milestone payment", "deferred consideration",
        "contingent payment", "performance payment",
        "revenue milestone", "ebitda milestone",
        "performance target",
    ]):
        return None
    text_lower = clause_text.lower()
    if any(p in text_lower for p in [
        "solely by the buyer", "final and binding",
        "buyer's determination", "buyer's assessment",
        "sole discretion", "determined by the buyer",
    ]):
        return "High Risk: Earnout/milestone determined solely by Buyer — Sellers have no recourse on deferred payments"
    return None


def check_setoff_clause(clause_text: str) -> Optional[str]:
    if not _contains_any(clause_text, [
        "set off", "set-off", "setoff", "offset",
        "deduct from", "withhold payment", "retain payment",
        "deduct against", "adjust against", "right to deduct",
    ]):
        return None
    text_lower = clause_text.lower()
    if ("without notice" in text_lower or
        "without prior notice" in text_lower or
        "without any prior notice" in text_lower or
        "without consent" in text_lower or
            "without any consent" in text_lower or
            "or consent" in text_lower):
        return "High Risk: Unilateral set-off right without notice — weaker party can lose payment without due process"
    return None


def check_asymmetric_warranties(clause_text: str) -> Optional[str]:
    if _contains_any(clause_text, [
        "makes no representations",
        "no representations or warranties",
        "makes no warranty", "no warranty whatsoever",
        "buyer makes no", "purchaser makes no",
        "no guarantee of payment", "no obligation to fund",
        "no warranty regarding ability to pay",
    ]):
        return "High Risk: One-sided warranty structure — only Sellers bound, Buyer makes no commitments"
    return None


def check_indemnity_basket(clause_text: str) -> Optional[str]:
    if _contains_any(clause_text, [
        "de minimis", "no de minimis", "no basket",
        "no threshold", "no minimum claim",
        "single rupee", "even one rupee",
        "without any threshold", "without any minimum",
    ]):
        return "Medium Risk: No de minimis indemnity threshold — even trivial claims trigger full liability"
    return None


def check_asymmetric_waiver(clause_text: str) -> Optional[str]:
    if _contains_any(clause_text, [
        "buyer may waive", "buyer can waive",
        "sole discretion waive",
        "sellers shall have no right to waive",
        "only the buyer may waive",
        "no right to waive any condition",
        "waiver at buyer's discretion",
        "purchaser may waive",
    ]):
        return "High Risk: Asymmetric waiver rights — only stronger party can waive conditions"
    return None


def check_no_termination_right(clause_text: str) -> Optional[str]:
    if _contains_any(clause_text, [
        "shall have no right to terminate",
        "no right to terminate",
        "cannot terminate", "may not terminate",
        "no termination right",
        "other than mutual consent",
        "seller shall not be entitled to terminate",
        "sellers have no right",
        "licensee shall not be entitled to terminate",
        "no right to expel", "shall have no right to expel",
        "cannot expel", "partners 2 and 3 shall have no right",
        "minority partners have no right",
    ]):
        return "High Risk: One party has no effective termination right — completely locked in"
    return None


# ═══════════════════════════════════════════════════════════════
# SECTION 9 — MASTER RULES REGISTRY
# ═══════════════════════════════════════════════════════════════

INDIAN_RULES: List[Callable[[str], Optional[str]]] = [

    # Core — all document types
    check_non_compete,
    check_arbitration,
    check_arbitration_costs_one_sided,
    check_foreign_law,
    check_termination_period,
    check_asymmetric_termination,
    check_subjective_expulsion,
    check_unilateral_capital_control,
    check_independent_valuation,
    check_books_inspection_right,
    check_unlimited_borrowing,
    check_profit_retention,
    check_payment_terms,
    check_high_interest_penalty,
    check_confidentiality,
    check_indemnity,
    check_force_majeure,
    check_jurisdiction,
    check_ip_clauses,
    check_limit_liability,
    check_unilateral_amendment,
    check_indefinite_non_solicitation,
    check_misc_boilerplate,

    # Indian law specific
    check_stamp_duty,
    check_fema_compliance,
    check_data_privacy,
    check_labour_law_compliance,
    check_rera_compliance,
    check_gst_clause,
    check_insolvency_clause,
    check_consumer_protection,
    check_tds_compliance,

    # Loan / NBFC
    check_guarantee_clause,
    check_sarfaesi_notice,
    check_subjective_default,
    check_assignment_clause,
    check_waiver_of_statutory_rights,
    check_unilateral_disbursement,
    check_prepayment_penalty,

    # Rental / Leave & Licence
    check_deposit_forfeiture,
    check_utility_disconnection,
    check_unrestricted_access,
    check_rent_control_waiver,
    check_one_sided_liability_exclusion,

    # Franchise
    check_territorial_rights,
    check_renewal_rights,
    check_fund_accountability,
    check_supplier_lockin,
    check_exit_fee,

    # M&A / SPA
    check_mac_definition,
    check_earnout_discretion,
    check_setoff_clause,
    check_asymmetric_warranties,
    check_indemnity_basket,
    check_asymmetric_waiver,
    check_no_termination_right,
]


def apply_indian_rules(clause_text: str, full_text: Optional[str] = None) -> List[str]:
    """Run all rules on a single clause. Returns list of risk notes."""
    _ = full_text  # backward-compat signature
    notes = [note for rule in INDIAN_RULES if (note := rule(clause_text)) is not None]
    return list(dict.fromkeys(notes))


# ═══════════════════════════════════════════════════════════════
# SECTION 10 — CALIBRATED SCORING ENGINE
# ═══════════════════════════════════════════════════════════════

def compute_final_risk_score(
    clauses: list,
    *,
    missing_clauses: int = 0,
    required_clauses: int = 0,
) -> dict:
    """
    Input:  list of dicts with key 'final_risk': 'high'|'medium'|'low'
    Output: { score, verdict, high, medium, low, total }

    Calibration targets:
      Safe      (0H,  0M, 45T) → 10–20   LOW
      Medium    (5H,  3M, 45T) → 40–55   MEDIUM
      High      (9H,  4M, 51T) → 68–82   HIGH
      Very High (14H, 4M, 58T) → 83–92   HIGH
    """
    total = len(clauses)
    high = sum(1 for c in clauses if (c.get("final_risk") or c.get("final_risk_level")) == "high")
    medium = sum(1 for c in clauses if (c.get("final_risk") or c.get("final_risk_level")) == "medium")
    low = total - high - medium

    missing_clauses = max(0, int(missing_clauses or 0))
    required_clauses = max(0, int(required_clauses or 0))

    if total == 0:
        return {"score": 0, "verdict": "low",
                "high": 0, "medium": 0, "low": 0, "total": 0}

    ratio_score = ((high + medium * 0.5) / total) * 42
    severity_score = min(48, high * 4.5 + medium * 1.5)
    base = 15 + (10 if (high + medium) > 0 else 0)

    if required_clauses > 0:
        missing_ratio = min(1.0, missing_clauses / required_clauses)
        missing_score = int(round(missing_ratio * 30))
    else:
        missing_score = min(30, missing_clauses * 5)

    raw = int(ratio_score + severity_score + base + missing_score)
    if raw > 88:
        raw = 88 + int((raw - 88) * 0.3)
    score = min(92, raw)

    if missing_clauses >= 4:
        verdict = "high"
    elif high >= 9 or score >= 56:
        verdict = "high"
    elif total <= 10 and high >= 3:
        verdict = "high"
    elif missing_clauses >= 3:
        verdict = "medium"
    elif high >= 4 or medium >= 6 or score >= 45:
        verdict = "medium"
    else:
        verdict = "low"

    return {"score": score, "verdict": verdict,
            "high": high, "medium": medium,
            "low": low, "total": total}


# ═══════════════════════════════════════════════════════════════
# SECTION 11 — KEYWORD ENRICHMENT UTILITY
# ═══════════════════════════════════════════════════════════════

def detect_indian_legal_keywords(clause_text: str) -> dict:
    """Returns matched keyword categories — use as ML model features."""
    t = clause_text.lower()
    return {
        "indian_currency": [k for k in INDIAN_CURRENCY_TERMS if k in t],
        "foreign_currency": [k for k in FOREIGN_CURRENCY_TERMS if k in t],
        "indian_cities_courts": [k for k in INDIAN_CITIES_COURTS if k in t],
        "foreign_cities": [k for k in FOREIGN_CITIES if k in t],
        "indian_acts": [k for k in INDIAN_ACTS if k in t],
        "legal_phrases": [k for k in INDIAN_LEGAL_PHRASES if k in t],
        "regulatory_bodies": [k for k in INDIAN_REGULATORY_BODIES if k in t],
    }


# ═══════════════════════════════════════════════════════════════
# SECTION 12 — CALIBRATION TEST SUITE
# ═══════════════════════════════════════════════════════════════

def run_calibration_test():
    """Run after any change to verify all 5 documents score correctly."""
    cases = [
        ("Consultancy (Safe)", 0, 0, 45, (10, 20), "low"),
        ("Employment (Medium)", 5, 3, 45, (38, 62), "medium"),
        ("Loan (High)", 9, 4, 51, (68, 86), "high"),
        ("Franchise (Very High)", 14, 4, 58, (83, 94), "high"),
        ("SPA (High)", 10, 3, 61, (68, 86), "high"),
    ]
    print("\n── Calibration Test ──────────────────────────────────")
    all_pass = True
    for name, h, m, t, (lo, hi), exp in cases:
        clauses = (
            [{"final_risk": "high"}] * h +
            [{"final_risk": "medium"}] * m +
            [{"final_risk": "low"}] * (t - h - m)
        )
        r = compute_final_risk_score(clauses)
        ok = (lo <= r["score"] <= hi) and (r["verdict"] == exp)
        if not ok:
            all_pass = False
        print(f"  {'✅' if ok else '❌'} {name:28s} "
              f"Score: {r['score']:3d}/100  "
              f"Verdict: {r['verdict']:6s}  "
              f"(target: {lo}–{hi} {exp})")
    print(f"\n  {'All tests passed ✅' if all_pass else 'Some tests failed ❌'}")
    print("──────────────────────────────────────────────────────\n")


if __name__ == "__main__":
    run_calibration_test()
