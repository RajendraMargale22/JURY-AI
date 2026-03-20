import re
from typing import Callable, List, Optional


FOREIGN_LOCATION_MARKERS = ["london", "new york", "singapore", "dubai", "paris", "hong kong"]

LOAN_ONLY_KEYWORDS = [
    "borrower",
    "lender",
    "loan amount",
    "emi",
    "nbfc",
    "disbursement",
    "repayment",
    "mortgage",
    "sarfaesi",
    "asset reconstruction",
]


def _contains_any(text: str, phrases: List[str]) -> bool:
    text_lower = text.lower()
    return any(phrase in text_lower for phrase in phrases)


def is_loan_document(full_text: str) -> bool:
    text_lower = full_text.lower()
    score = sum(1 for keyword in LOAN_ONLY_KEYWORDS if keyword in text_lower)
    return score >= 3


def check_non_compete(clause_text: str) -> Optional[str]:
    keywords = [
        "non-compete",
        "non compete",
        "post-employment restriction",
        "cannot join competitor",
        "restraint of trade",
        "direct competitor",
        "competes with",
    ]
    text_lower = clause_text.lower()
    if _contains_any(clause_text, keywords):
        if any(token in text_lower for token in ["following cessation", "after employment", "post-employment", "following termination"]):
            return "High Risk: Post-employment non-compete may be void under Sec. 27, Indian Contract Act"
        return "High Risk: Potentially void under Sec. 27, Indian Contract Act"
    return None


def check_arbitration(clause_text: str) -> Optional[str]:
    text_lower = clause_text.lower()
    if "arbitration" not in text_lower and "arbitrator" not in text_lower:
        return None

    unilateral_patterns = [
        "appointed solely by the company",
        "appointed solely by company",
        "appointed by the company",
        "solely by the employer",
        "sole discretion of the company",
        "appointed solely by the licensor",
        "appointed solely by the landlord",
        "appointed solely by the lender",
        "appointed solely by the franchisor",
        "appointed solely by franchisor",
        "from its panel of approved arbitrators",
        "from franchisor's panel",
        "appointed unilaterally",
    ]
    if any(token in text_lower for token in unilateral_patterns):
        return "High Risk: Arbitrator appointment appears unilateral and may be challengeable"

    if any(
        token in text_lower
        for token in [
            "borne entirely by the licensee",
            "borne entirely by the borrower",
            "borne solely by the licensee",
            "borne solely by the borrower",
            "borne entirely by the franchisee",
            "borne solely by the franchisee",
            "costs borne by franchisee",
            "costs of arbitration shall be borne entirely",
            "all costs of arbitration shall be borne by the franchisee",
        ]
    ):
        return "High Risk: Arbitration costs allocated entirely to one party appear procedurally unfair"

    # Flag only if explicit foreign seat/venue context is present.
    if any(marker in text_lower for marker in FOREIGN_LOCATION_MARKERS):
        return "Medium Risk: Arbitration location appears outside India, check Arbitration Act 1996"
    return None


def check_foreign_law(clause_text: str) -> Optional[str]:
    foreign_laws = ["new york law", "english law", "singapore law", "laws of england", "laws of delaware"]
    if _contains_any(clause_text, foreign_laws):
        return "High Risk: Governing law outside India may be unenforceable under Indian courts"
    return None


def check_termination_period(clause_text: str) -> Optional[str]:
    text_lower = clause_text.lower()
    if "termination" in text_lower and "notice" in text_lower:
        match = re.search(r"\b(\d+)\s*(days|months)\b", text_lower)
        if match:
            days_or_months = int(match.group(1))
            if days_or_months < 7 and match.group(2) == "days":
                return "Medium Risk: Termination notice period less than 7 days may be unfair"
    return None


def check_payment_terms(clause_text: str) -> Optional[str]:
    text_lower = clause_text.lower()
    if not any(word in text_lower for word in ["payment", "invoice", "fee", "amount", "retainer"]):
        return None

    has_inr = ("inr" in text_lower) or ("rs." in text_lower) or ("₹" in clause_text)
    has_foreign_currency = any(cur in text_lower for cur in ["usd", "dollar", "eur", "euro", "gbp", "pound"])

    # Reduce noise: only flag where foreign currency looks mandatory/exclusive.
    foreign_mandatory = any(token in text_lower for token in ["only", "exclusively", "solely", "must be paid in"])
    if has_foreign_currency and not has_inr and foreign_mandatory:
        return "Medium Risk: Payment appears denominated in foreign currency without INR fallback"
    return None


def check_confidentiality(clause_text: str) -> Optional[str]:
    text_lower = clause_text.lower()
    if "confidential" in text_lower or "nda" in text_lower:
        if (
            "indefinitely" in text_lower
            or "without any geographical limitation" in text_lower
            or "in perpetuity" in text_lower
            or "forever" in text_lower
            or "worldwide" in text_lower
            or "global" in text_lower
        ):
            return "High Risk: Confidentiality duration/scope appears overbroad (indefinite or unlimited geography)"
    return None


def check_indemnity(clause_text: str) -> Optional[str]:
    keywords = [
        "indemnity",
        "liability",
        "hold harmless",
        "personal guarantee",
        "irrevocable guarantee",
        "unconditional guarantee",
        "continuing guarantee",
        "corporate guarantee",
        "bank guarantee",
    ]
    if _contains_any(clause_text, keywords):
        text_lower = clause_text.lower()

        # Balanced carve-out: mutual indemnity tied to direct losses/breach/negligence
        if (
            ("each party" in text_lower or "mutual" in text_lower)
            and (
                "direct losses" in text_lower
                or "negligence" in text_lower
                or "willful misconduct" in text_lower
                or "third-party claims" in text_lower
            )
        ):
            return None

        negated_cap_patterns = [
            r"without\s+(any\s+)?cap",
            r"no\s+(liability\s+)?cap",
            r"unlimited\s+liability",
            r"without\s+(any\s+)?limit",
            r"no\s+limit",
        ]

        if any(re.search(pattern, text_lower) for pattern in negated_cap_patterns):
            return "High Risk: No liability cap mentioned; may be legally risky"

        if "guarantee" in text_lower and ("unconditional" in text_lower or "irrevocable" in text_lower):
            return "High Risk: Guarantee language appears unconditional/irrevocable"

        if "unconditional" in text_lower or "irrevocable" in text_lower:
            return "High Risk: Indemnity language appears unconditional/irrevocable"

        if "guarantee" in text_lower and any(token in text_lower for token in ["unconditional", "irrevocable", "entire loan amount", "entire outstanding amount"]):
            return "High Risk: Personal/corporate guarantee appears unconditional and overbroad"

        # Reduce false positives: missing cap alone is not enough unless one-sided or broad damage scope appears.
        has_cap = re.search(r"\blimit\b|\bcap\b", text_lower) is not None
        one_sided = any(token in text_lower for token in ["consultant shall", "vendor shall", "only consultant", "only service provider"])
        broad_damage_scope = any(token in text_lower for token in ["indirect", "consequential", "punitive", "any and all losses"])
        if (not has_cap) and (one_sided or broad_damage_scope):
            return "High Risk: No liability cap mentioned; may be legally risky"
    return None


def check_force_majeure(clause_text: str) -> Optional[str]:
    text_lower = clause_text.lower()
    if "force majeure" not in text_lower:
        return None

    # Flag only if force majeure relief/termination appears one-sided.
    if (
        any(token in text_lower for token in ["service provider may terminate", "company may terminate", "vendor may terminate"])
        and ("either party" not in text_lower)
    ):
        return "Medium Risk: Force majeure termination rights appear one-sided"
    return None


def check_jurisdiction(clause_text: str) -> Optional[str]:
    keywords = ["jurisdiction", "court", "venue"]
    if any(word in clause_text.lower() for word in keywords):
        if any(country in clause_text.lower() for country in FOREIGN_LOCATION_MARKERS):
            return "High Risk: Exclusive foreign jurisdiction may not be enforceable under CPC Sec. 20"
    return None


def check_ip_clauses(clause_text: str) -> Optional[str]:
    text_lower = clause_text.lower()

    # Franchise/brand goodwill transfers may appear outside explicit IP keyword sections.
    if "goodwill" in text_lower:
        if any(
            token in text_lower
            for token in [
                "assigns goodwill",
                "assign goodwill",
                "goodwill generated",
                "goodwill shall vest",
                "goodwill belongs to franchisor",
                "no compensation for goodwill",
                "goodwill upon termination",
                "irrevocably assigns",
            ]
        ):
            return "High Risk: Irrevocable goodwill assignment with zero compensation appears one-sided"

    keywords = ["intellectual property", "copyright", "patent", "trademark", "ip rights"]
    if any(word in text_lower for word in keywords):
        if (
            "sole and exclusive property of the service provider" in text_lower
            or "sole and exclusive property of the consultant" in text_lower
            or "sole and exclusive property of the company" in text_lower
            or "sole and exclusive property of the employer" in text_lower
            or "all past, present, and future intellectual property" in text_lower
            or "whether or not during working hours" in text_lower
        ):
            return "High Risk: IP ownership/assignment appears heavily one-sided"
        if "revocable license" in text_lower and "non-transferable" in text_lower:
            return "Medium Risk: Client rights in deliverables are narrowly scoped/revocable"
        if "waive" in text_lower and "moral rights" in text_lower:
            return "Medium Risk: Moral rights waiver may be difficult to enforce in full under Copyright Act"
    return None


def check_limit_liability(clause_text: str) -> Optional[str]:
    text_lower = clause_text.lower()
    if "limitation of liability" in text_lower or "total aggregate liability" in text_lower or "total liability" in text_lower:
        match = re.search(r"\b(\d+)%\b", text_lower)
        if match and int(match.group(1)) > 100:
            return "High Risk: Limitation of liability exceeds 100%, may be invalid"

        # Detect very low absolute caps e.g. INR 10,000 in high-value service contracts.
        inr_match = re.search(r"(?:inr|rs\.?|₹)\s*([\d,]+)", text_lower)
        if inr_match:
            amount = int(inr_match.group(1).replace(",", ""))
            if amount <= 50000:
                return "High Risk: Liability cap appears disproportionately low and may be unfair/unconscionable"
            if amount <= 500000:
                return "High Risk: Liability cap appears disproportionately low for a commercial contract"
    return None


def check_mac_definition(clause_text: str) -> Optional[str]:
    text_lower = clause_text.lower()
    mac_keywords = [
        "material adverse change",
        "material adverse effect",
        "mac",
        "mae",
        "material adverse",
        "materially adverse",
        "adverse effect on the business",
        "adverse effect on the target",
    ]
    if not _contains_any(text_lower, mac_keywords):
        return None

    subjective_markers = [
        "solely by the buyer",
        "determined by the buyer",
        "buyer's sole discretion",
        "sole opinion of the buyer",
        "as determined solely",
        "as determined by buyer",
    ]
    if _contains_any(text_lower, subjective_markers):
        return "High Risk: Subjective MAC trigger determined solely by Buyer lacks objective standard"
    return None


def check_earnout_discretion(clause_text: str) -> Optional[str]:
    text_lower = clause_text.lower()
    earnout_keywords = [
        "earnout",
        "earn-out",
        "earn out",
        "milestone payment",
        "deferred consideration",
        "contingent payment",
        "performance payment",
        "revenue milestone",
        "ebitda",
        "performance target",
    ]
    if not _contains_any(text_lower, earnout_keywords):
        return None

    if any(
        token in text_lower
        for token in [
            "solely by the buyer",
            "buyer's determination",
            "buyer's assessment",
            "final and binding",
            "sole discretion",
            "as determined by buyer",
        ]
    ):
        return "High Risk: Earnout/milestone determination appears unilateral and final with no seller recourse"
    return None


def check_setoff_clause(clause_text: str) -> Optional[str]:
    text_lower = clause_text.lower()
    setoff_keywords = [
        "set off",
        "set-off",
        "setoff",
        "offset",
        "deduct from",
        "withhold payment",
        "retain payment",
        "deduct against",
        "adjust against",
        "right to deduct",
    ]
    if not _contains_any(text_lower, setoff_keywords):
        return None

    if any(
        token in text_lower
        for token in [
            "without notice",
            "without prior notice",
            "without consent",
            "without any consent",
            "without prior consent",
            "unilaterally",
        ]
    ):
        return "High Risk: Unilateral set-off/right to deduct without notice or consent appears procedurally unfair"
    return "Medium Risk: Set-off/right to deduct exists; verify notice, dispute process and objective standards"


def check_asymmetric_warranties(clause_text: str) -> Optional[str]:
    text_lower = clause_text.lower()
    if not any(token in text_lower for token in ["representation", "warranty", "warranties"]):
        return None

    if any(
        token in text_lower
        for token in [
            "buyer makes no representations",
            "buyer makes no representation",
            "buyer makes no warranties",
            "buyer makes no warranty",
            "no representations or warranties whatsoever",
            "no warranty whatsoever",
            "no obligation to fund",
            "no warranty regarding ability to pay",
        ]
    ):
        return "High Risk: One-sided warranty structure where Buyer disclaims core payment/funding commitments"
    return None


def check_indemnity_basket(clause_text: str) -> Optional[str]:
    text_lower = clause_text.lower()
    if "indemn" not in text_lower and "loss" not in text_lower:
        return None

    if any(
        token in text_lower
        for token in [
            "no de minimis",
            "de minimis threshold",
            "no basket",
            "no threshold",
            "no minimum claim",
            "single rupee",
            "even a single rupee",
            "without any threshold",
            "without any minimum",
        ]
    ):
        return "Medium Risk: No de minimis/basket threshold means even trivial claims can trigger full indemnity"
    return None


def check_asymmetric_waiver(clause_text: str) -> Optional[str]:
    text_lower = clause_text.lower()
    if "waive" not in text_lower and "waiver" not in text_lower:
        return None

    if any(
        token in text_lower
        for token in [
            "buyer may in its sole discretion waive",
            "buyer may waive any condition",
            "only the buyer may waive",
            "waiver at buyer's discretion",
            "sellers shall have no right to waive",
            "no right to waive any condition",
        ]
    ):
        return "High Risk: Asymmetric waiver rights allow only Buyer to relax conditions precedent"
    return None


def check_fema_compliance(clause_text: str) -> Optional[str]:
    text_lower = clause_text.lower()
    fema_keywords = [
        "fema",
        "foreign exchange management",
        "fc-trs",
        "rbi",
        "non-debt instruments",
    ]
    if not _contains_any(text_lower, fema_keywords):
        return None

    if any(
        token in text_lower
        for token in [
            "penalty",
            "interest",
            "liability",
            "borne solely",
            "solely by the sellers",
            "shall be borne solely by",
        ]
    ) and any(token in text_lower for token in ["solely", "only", "entirely"]):
        return "Medium Risk: FEMA/regulatory penalties are shifted entirely to one side"

    return "Low Risk: FEMA/RBI compliance clause detected; verify FC-TRS timelines and responsibility split"


def check_no_termination_right(clause_text: str) -> Optional[str]:
    text_lower = clause_text.lower()
    if "terminate" not in text_lower and "termination" not in text_lower:
        return None

    if any(
        token in text_lower
        for token in [
            "shall have no right to terminate",
            "no right to terminate",
            "cannot terminate",
            "may not terminate",
            "no termination right",
            "other than mutual consent",
            "seller shall not be entitled to terminate",
            "sellers shall have no right to terminate",
        ]
    ):
        return "High Risk: One party has no effective termination right except mutual consent"
    return None


def check_high_interest_penalty(clause_text: str) -> Optional[str]:
    text_lower = clause_text.lower()
    if "interest" in text_lower:
        percent_match = re.search(r"(\d{1,2}(?:\.\d+)?)\s*%", text_lower)
        if percent_match:
            rate = float(percent_match.group(1))
            if rate >= 24:
                return "High Risk: Penal interest rate is very high (24% or above)"
            if rate >= 18:
                return "Medium Risk: Interest rate appears aggressive and may be challenged as penal"
    return None


def check_asymmetric_termination(clause_text: str) -> Optional[str]:
    text_lower = clause_text.lower()
    if "terminate" not in text_lower and "termination" not in text_lower:
        return None

    # Heuristic for one-sided language
    provider_markers = [
        "service provider may terminate",
        "company may terminate",
        "vendor may terminate",
        "employer may terminate",
        "licensor may terminate",
        "licensor shall be entitled to terminate",
        "landlord may terminate",
        "landlord shall be entitled to terminate",
        "lender may terminate",
        "franchisor may terminate",
    ]
    counterparty_markers = [
        "client may terminate",
        "consultant may terminate",
        "customer may terminate",
        "employee may terminate",
        "licensee may terminate",
        "tenant may terminate",
        "borrower may terminate",
        "franchisee may terminate",
    ]
    if any(marker in text_lower for marker in provider_markers) and any(marker in text_lower for marker in counterparty_markers):
        # Compare all day values if present
        day_values = [int(v) for v in re.findall(r"(\d+)\s*\(?.*?\)?\s*days", text_lower)]
        if len(day_values) >= 2:
            min_days = min(day_values)
            max_days = max(day_values)
            if min_days > 0 and (max_days / min_days) >= 3:
                return "High Risk: Termination rights are highly asymmetric between parties"
            if min_days > 0 and (max_days / min_days) >= 2:
                return "Medium Risk: Termination notice obligations appear asymmetric"

    if ("licensor" in text_lower and "licensee" in text_lower and "notice" in text_lower):
        day_values = [int(v) for v in re.findall(r"(\d+)\s*\(?.*?\)?\s*days", text_lower)]
        if len(day_values) >= 2:
            min_days = min(day_values)
            max_days = max(day_values)
            if min_days > 0 and (max_days / min_days) >= 3:
                return "High Risk: Termination rights are highly asymmetric between parties"

    if "employee" in text_lower and "company" in text_lower and "notice" in text_lower:
        day_values = [int(v) for v in re.findall(r"(\d+)\s*\(?.*?\)?\s*days", text_lower)]
        if len(day_values) >= 2:
            min_days = min(day_values)
            max_days = max(day_values)
            if min_days > 0 and (max_days / min_days) >= 3:
                return "High Risk: Termination notice obligations appear one-sided (employee vs company)"

    if any(token in text_lower for token in ["without notice", "without compensation"]) and "company may terminate" in text_lower:
        return "High Risk: Termination without notice/compensation appears one-sided"

    if any(token in text_lower for token in ["immediately", "without notice"]) and any(
        marker in text_lower for marker in ["franchisor may terminate", "licensor may terminate", "lender may terminate", "company may terminate"]
    ):
        return "High Risk: Immediate one-sided termination right without notice"

    if "without cause" in text_lower and "termination fee" in text_lower:
        return "High Risk: Termination terms may be one-sided (without cause + fee burden)"

    if any(
        token in text_lower
        for token in [
            "without any liability to the sellers",
            "without liability to the sellers",
            "without any liability to the seller",
            "no liability upon termination",
            "terminate without liability",
            "walk away without liability",
        ]
    ) and any(marker in text_lower for marker in ["buyer may", "company may", "lender may", "franchisor may"]):
        return "High Risk: One-sided right to terminate without liability shifts all downside to counterparty"
    return None


def check_unilateral_amendment(clause_text: str) -> Optional[str]:
    text_lower = clause_text.lower()
    if "amended only by" in text_lower and ("service provider" in text_lower or "company" in text_lower):
        return "High Risk: Unilateral amendment right is one-sided and risky"
    if "continued use" in text_lower and "constitute acceptance" in text_lower:
        return "Medium Risk: Deemed acceptance mechanism may be considered unfair"
    if "continued employment" in text_lower and "constitute acceptance" in text_lower:
        return "Medium Risk: Deemed acceptance via continued employment may be unfair"
    if ("amend" in text_lower or "modify" in text_lower) and "sole discretion" in text_lower:
        return "High Risk: Sole discretion amendment right without bilateral consent"
    if any(token in text_lower for token in ["revise the interest rate", "right to revise", "reserves the right to revise", "revise interest rate at any time"]):
        return "High Risk: Unilateral interest-rate revision right is one-sided"
    if any(token in text_lower for token in ["continued repayment shall constitute acceptance", "continued repayment constitutes acceptance", "continued acceptance"]):
        return "High Risk: Deemed acceptance tied to continued repayment is unfair"
    if any(token in text_lower for token in ["continued operation", "continued operation of the outlet shall constitute acceptance"]):
        return "High Risk: Deemed acceptance via continued operations is unfair"
    return None


def check_overtime_without_compensation(clause_text: str) -> Optional[str]:
    text_lower = clause_text.lower()
    if any(token in text_lower for token in ["overtime", "beyond standard hours", "public holidays", "sundays"]):
        if any(token in text_lower for token in ["without any additional overtime compensation", "without overtime compensation", "without additional compensation"]):
            return "Medium Risk: Overtime/holiday work without additional compensation may violate labour norms"
    return None


def check_final_settlement_withholding(clause_text: str) -> Optional[str]:
    text_lower = clause_text.lower()
    if "withhold" in text_lower and any(token in text_lower for token in ["final settlement", "salary", "dues"]):
        return "Medium Risk: Withholding final settlement can be challenged under wage/labour laws"
    return None


def check_subjective_default(clause_text: str) -> Optional[str]:
    text_lower = clause_text.lower()
    default_keywords = [
        "event of default",
        "events of default",
        "default shall occur",
        "constitute a default",
        "deemed default",
    ]
    subjective_triggers = [
        "sole discretion",
        "at its discretion",
        "believes that",
        "considers that",
        "in jeopardy",
        "at risk",
        "material adverse change",
        "as determined by the lender",
        "as determined solely",
    ]
    if _contains_any(text_lower, default_keywords) and _contains_any(text_lower, subjective_triggers):
        return "High Risk: Default trigger based on lender's sole discretion lacks objective standard"
    return None


def check_sarfaesi_notice(clause_text: str) -> Optional[str]:
    text_lower = clause_text.lower()
    sarfaesi_keywords = [
        "sarfaesi",
        "sarfaesi act",
        "securitisation and reconstruction",
        "enforce the mortgage",
        "enforce security",
        "asset reconstruction",
        "possession of property",
        "symbolic possession",
        "debt recovery tribunal",
        "drt",
        "recovery of debts",
    ]
    if not _contains_any(text_lower, sarfaesi_keywords):
        return None
    if "without any notice" in text_lower or "without notice" in text_lower:
        return "High Risk: SARFAESI enforcement without notice is likely non-compliant (60-day notice required)"
    return "Medium Risk: SARFAESI enforcement clause detected; verify statutory notice and RBI compliance"


def check_assignment_clause(clause_text: str) -> Optional[str]:
    text_lower = clause_text.lower()
    keywords = [
        "assign",
        "assignment",
        "transfer its rights",
        "novation",
        "delegate",
        "asset reconstruction company",
        "arc",
    ]
    if not _contains_any(text_lower, keywords):
        return None
    if "without the consent" in text_lower or "without prior consent" in text_lower:
        return "Medium Risk: One-sided assignment right without borrower consent"
    if "asset reconstruction" in text_lower or "arc" in text_lower:
        return "Medium Risk: Assignment to ARC should preserve borrower rights and disclosures"
    return None


def check_data_privacy(clause_text: str) -> Optional[str]:
    text_lower = clause_text.lower()
    keywords = [
        "personal data",
        "borrower's information",
        "financial data",
        "repayment history",
        "credit information",
        "share information",
        "disclose information",
        "credit bureau",
        "cibil",
        "crif",
        "equifax",
        "experian",
        "rbi",
    ]
    if not _contains_any(text_lower, keywords):
        return None
    if "without consent of the borrower" in text_lower or "without requiring consent" in text_lower or "sole discretion" in text_lower:
        return "Medium Risk: Data sharing without explicit borrower consent may conflict with DPDP principles"
    return "Low Risk: Data-sharing clause present; verify purpose limitation and lawful basis"


def check_waiver_of_statutory_rights(clause_text: str) -> Optional[str]:
    text_lower = clause_text.lower()
    keywords = [
        "waives all rights",
        "waive all rights",
        "waives any right",
        "waiver of rights",
        "waives notice",
        "waive notice",
        "waives right to notice",
        "waives right to receive",
        "waives right to challenge",
        "relinquishes all rights",
        "no right to object",
    ]
    if _contains_any(text_lower, keywords):
        return "High Risk: Waiver of statutory rights may be void or unenforceable"
    return None


def check_unilateral_disbursement_control(clause_text: str) -> Optional[str]:
    text_lower = clause_text.lower()
    if any(token in text_lower for token in ["withhold", "reduce", "cancel disbursement", "disbursement"]) and "sole discretion" in text_lower:
        if any(token in text_lower for token in ["without any obligation", "without reasons", "without recourse", "absolute and unconditional right"]):
            return "High Risk: Unilateral disbursement cancellation/right with no recourse"
    return None


def check_deposit_forfeiture(clause_text: str) -> Optional[str]:
    text_lower = clause_text.lower()
    keywords = [
        "forfeit",
        "forfeiture",
        "retain the deposit",
        "security deposit",
        "retain security",
        "withhold deposit",
        "deduct from deposit",
    ]
    if not _contains_any(text_lower, keywords):
        return None

    if (
        "no interest" in text_lower and "security deposit" in text_lower
    ):
        return "Medium Risk: No interest on security deposit may be one-sided"

    if any(
        token in text_lower
        for token in [
            "sole discretion",
            "solely by the licensor",
            "solely by the landlord",
            "entire security deposit",
        ]
    ):
        return "High Risk: Security deposit forfeiture at sole discretion appears unconscionable"
    return None


def check_one_sided_liability_exclusion(clause_text: str) -> Optional[str]:
    text_lower = clause_text.lower()
    keywords = [
        "shall not be liable",
        "not liable for",
        "no liability for",
        "excludes liability",
        "business loss",
        "business interruption",
        "consequential loss",
        "indirect loss",
        "howsoever caused",
    ]
    exclusion_context = [
        "licensor shall not",
        "landlord shall not",
        "licensor is not",
        "owner shall not",
        "company shall not be liable",
        "lender shall not be liable",
    ]
    if _contains_any(text_lower, keywords) and _contains_any(text_lower, exclusion_context):
        return "High Risk: One-sided liability exclusion protects only one party"
    return None


def check_utility_disconnection(clause_text: str) -> Optional[str]:
    text_lower = clause_text.lower()
    keywords = [
        "disconnect",
        "disconnection",
        "cut off",
        "electricity",
        "water charges",
        "utility",
        "internet charges",
    ]
    if not _contains_any(text_lower, keywords):
        return None

    if "without notice" in text_lower or "without prior notice" in text_lower:
        return "High Risk: Utility disconnection without notice may be legally challengeable"
    return None


def check_unrestricted_access(clause_text: str) -> Optional[str]:
    text_lower = clause_text.lower()
    if any(token in text_lower for token in ["enter and inspect", "show the premises", "inspection"]):
        if any(token in text_lower for token in ["at any time", "without prior notice", "without prior appointment"]):
            return "Medium Risk: Unrestricted access/inspection rights without notice are one-sided"
    return None


def check_rent_control_waiver(clause_text: str) -> Optional[str]:
    text_lower = clause_text.lower()
    keywords = [
        "maharashtra rent control act",
        "rent control act",
        "tenancy rights",
        "shall not claim tenancy",
        "no tenancy rights",
        "waives tenancy",
        "not claim any rights under",
        "leave and licence",
    ]
    if _contains_any(text_lower, keywords):
        if any(token in text_lower for token in ["shall not claim", "no tenancy rights", "waives", "not claim any tenancy"]):
            return "High Risk: Waiver of statutory tenancy rights may be unenforceable"
    return None


def check_territorial_rights(clause_text: str) -> Optional[str]:
    text_lower = clause_text.lower()
    keywords = [
        "non-exclusive",
        "no exclusive territorial rights",
        "no territorial rights",
        "no exclusivity",
        "reserves the right to appoint other franchisees",
        "open company-owned outlets",
        "within the same city",
        "within the same locality",
        "within the same mall",
        "without any compensation to the franchisee",
    ]
    if _contains_any(text_lower, keywords):
        return "High Risk: No territorial exclusivity allows direct brand competition in same location"
    return None


def check_renewal_rights(clause_text: str) -> Optional[str]:
    text_lower = clause_text.lower()
    keywords = [
        "no automatic right of renewal",
        "no right of renewal",
        "renewal at franchisor",
        "renewal entirely at",
        "not entitled to",
        "no compensation upon non-renewal",
        "no compensation on expiry",
        "investment made",
        "shall not entitle",
    ]
    if _contains_any(text_lower, keywords) and ("franchise" in text_lower or "franchisee" in text_lower):
        return "High Risk: No renewal right despite significant capital investment appears one-sided"
    return None


def check_fund_accountability(clause_text: str) -> Optional[str]:
    text_lower = clause_text.lower()
    keywords = [
        "marketing fund",
        "advertising fund",
        "national marketing fund",
        "brand fund",
        "promotional fund",
        "marketing contribution",
    ]
    if not _contains_any(text_lower, keywords):
        return None
    if any(token in text_lower for token in ["no obligation to account", "absolute discretion", "no obligation to disclose", "not required to account"]):
        return "Medium Risk: Marketing fund collected without accountability obligation"
    return None


def check_supplier_lockin(clause_text: str) -> Optional[str]:
    text_lower = clause_text.lower()
    keywords = [
        "approved vendor",
        "approved supplier",
        "designated supplier",
        "approved vendor list",
        "mandatory supplier",
        "sole supplier",
        "exclusively from",
        "only from approved",
        "solely from suppliers approved",
        "change the approved vendor list",
    ]
    if _contains_any(text_lower, keywords):
        if any(token in text_lower for token in ["without notice", "at any time", "sole discretion"]):
            return "Medium Risk: Supplier lock-in with unilateral vendor changes may raise competition concerns"
        return "Low Risk: Supplier approval clause exists; verify fair pricing and auditability"
    return None


def check_exit_fee(clause_text: str) -> Optional[str]:
    text_lower = clause_text.lower()
    keywords = [
        "exit fee",
        "early termination fee",
        "early exit fee",
        "termination penalty",
        "termination fee",
        "exit penalty",
        "break fee",
        "exit charge",
    ]
    if not _contains_any(text_lower, keywords):
        return None

    weaker_party_markers = [
        "seller",
        "sellers",
        "franchisee",
        "licensee",
        "employee",
        "borrower",
        "tenant",
        "consultant",
        "service provider",
    ]
    payment_markers = [
        "shall pay",
        "must pay",
        "liable to pay",
        "bear",
        "borne by",
        "deducted from",
        "entitled to claim",
        "claim",
        "recover",
        "from the sellers",
        "from sellers",
    ]
    one_sided_markers = ["only", "solely", "without refund", "non-refundable", "at sole discretion", "entitled to claim"]

    has_weaker_party_context = any(marker in text_lower for marker in weaker_party_markers)
    has_payment_context = any(marker in text_lower for marker in payment_markers)
    has_one_sided_context = any(marker in text_lower for marker in one_sided_markers)

    if has_weaker_party_context and (has_payment_context or has_one_sided_context):
        inr_match = re.search(r"(?:inr|rs\.?|₹)\s*([\d,]+)", text_lower)
        if inr_match:
            amount = int(inr_match.group(1).replace(",", ""))
            if amount >= 100000:
                return f"High Risk: One-sided exit fee of ₹{amount:,} on weaker party may be penal"
        return "High Risk: One-sided exit fee applies only to weaker party"

    # Fallback: fee is present with unilateral language but party is not named in a strict pattern.
    if has_payment_context and has_one_sided_context:
        return "Medium Risk: Exit fee appears one-sided; verify reciprocal termination rights"
    return None


def check_one_sided_ip_ownership(clause_text: str) -> Optional[str]:
    # Kept for backward compatibility; deduped by relying on check_ip_clauses().
    return None


def check_indefinite_non_solicitation(clause_text: str) -> Optional[str]:
    text_lower = clause_text.lower()
    if "non-solicit" in text_lower or "solicit" in text_lower:
        year_match = re.search(r"(\d+)\s*\(?.*?\)?\s*years", text_lower)
        if year_match and int(year_match.group(1)) >= 3:
            return "Medium Risk: Long non-solicitation duration (3+ years) may be unreasonable"
    return None


def check_misc_boilerplate(clause_text: str) -> Optional[str]:
    if "entire agreement" in clause_text.lower() or "severability" in clause_text.lower():
        return "Low Risk: Standard boilerplate clause"
    return None


COMMON_RULES: List[Callable[[str], Optional[str]]] = [
    check_non_compete,
    check_mac_definition,
    check_territorial_rights,
    check_arbitration,
    check_foreign_law,
    check_earnout_discretion,
    check_renewal_rights,
    check_termination_period,
    check_asymmetric_termination,
    check_no_termination_right,
    check_asymmetric_waiver,
    check_setoff_clause,
    check_exit_fee,
    check_high_interest_penalty,
    check_fund_accountability,
    check_supplier_lockin,
    check_confidentiality,
    check_asymmetric_warranties,
    check_indemnity,
    check_indemnity_basket,
    check_force_majeure,
    check_jurisdiction,
    check_ip_clauses,
    check_limit_liability,
    check_unilateral_amendment,
    check_fema_compliance,
    check_data_privacy,
    check_overtime_without_compensation,
    check_final_settlement_withholding,
    check_deposit_forfeiture,
    check_one_sided_liability_exclusion,
    check_utility_disconnection,
    check_unrestricted_access,
    check_rent_control_waiver,
    check_indefinite_non_solicitation,
    check_misc_boilerplate,
]

LOAN_ONLY_RULES: List[Callable[[str], Optional[str]]] = [
    check_unilateral_disbursement_control,
    check_payment_terms,
    check_subjective_default,
    check_sarfaesi_notice,
    check_assignment_clause,
    check_waiver_of_statutory_rights,
]


def apply_indian_rules(clause_text: str, full_text: Optional[str] = None) -> List[str]:
    notes: List[str] = []
    base_text = full_text or clause_text
    rules = list(COMMON_RULES)
    if is_loan_document(base_text):
        rules.extend(LOAN_ONLY_RULES)

    for rule in rules:
        note = rule(clause_text)
        if note:
            notes.append(note)
    # Stable de-duplication to avoid repeated messages from overlapping checks.
    return list(dict.fromkeys(notes))
