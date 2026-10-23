import re
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Set, Tuple
from sqlalchemy.orm import Session

from app.models.entities import (
    IncidentCategoryEnum, PriorityLevelEnum, CommunityPost, Comment, ModerationStatusEnum
)

CATEGORY_KEYWORDS = {
    IncidentCategoryEnum.PHYSICAL_THREAT.value: {
        "hit": 2.0, "attack": 2.5, "grabbed": 2.5, "punch": 2.5, "weapon": 3.0,
        "knife": 3.0, "hurt me": 2.5, "pushed": 2.0, "assault": 3.0
    },
    IncidentCategoryEnum.EMERGENCY.value: {
        "help me": 2.5, "emergency": 3.0, "urgent": 2.0, "in danger": 3.0,
        "right now": 1.5, "trapped": 2.5
    },
    IncidentCategoryEnum.STALKING.value: {
        "following me": 3.0, "followed": 2.5, "watching me": 2.5, "shows up wherever": 2.0,
        "keeps appearing": 2.0, "stalking": 3.0, "outside my hostel": 2.0
    },
    IncidentCategoryEnum.HARASSMENT.value: {
        "harass": 2.5, "won't leave me alone": 2.0, "unwanted": 1.5,
        "inappropriate comments": 2.0, "touched": 2.0, "uncomfortable": 1.0
    },
    IncidentCategoryEnum.VERBAL_ABUSE.value: {
        "shouted at": 1.5, "verbally abused": 2.5, "insulted": 2.0,
        "yelled": 1.5, "threatening words": 2.0, "abusive language": 2.5
    },
    IncidentCategoryEnum.UNSAFE_AREA.value: {
        "dark": 1.0, "no lighting": 1.5, "poorly lit": 1.5, "isolated": 1.5,
        "unsafe area": 2.5, "no cctv": 1.5, "deserted": 1.5
    }
}

BASELINE_PRIORITY = {
    IncidentCategoryEnum.EMERGENCY.value: PriorityLevelEnum.CRITICAL.value,
    IncidentCategoryEnum.PHYSICAL_THREAT.value: PriorityLevelEnum.HIGH.value,
    IncidentCategoryEnum.STALKING.value: PriorityLevelEnum.HIGH.value,
    IncidentCategoryEnum.HARASSMENT.value: PriorityLevelEnum.MEDIUM.value,
    IncidentCategoryEnum.VERBAL_ABUSE.value: PriorityLevelEnum.MEDIUM.value,
    IncidentCategoryEnum.UNSAFE_AREA.value: PriorityLevelEnum.LOW.value,
    IncidentCategoryEnum.OTHER.value: PriorityLevelEnum.LOW.value,
}

PRIORITY_ORDER = [
    PriorityLevelEnum.LOW.value,
    PriorityLevelEnum.MEDIUM.value,
    PriorityLevelEnum.HIGH.value,
    PriorityLevelEnum.CRITICAL.value
]

ESCALATION_KEYWORDS = {
    "weapon": 2, "knife": 2, "can't breathe": 2, "bleeding": 2,
    "right now": 1, "still here": 1, "won't stop": 1, "every day": 1
}

SEVERE_KEYWORDS = [
    "kill", "rape", "suicide", "murder", "attack her", "stalk her home"
]
TOXIC_KEYWORDS = [
    "idiot", "stupid bitch", "whore", "slut", "shut up you"
]
SPAM_SIGNALS = [
    "http://", "https://", "www.", "buy now", "click here", "subscribe to", "limited offer", "earn money"
]
INAPPROPRIATE_KEYWORDS = [
    "nude", "sex tape", "explicit photo"
]

def score_keywords(text: str, weighted_keywords: Dict[str, float]) -> Tuple[float, List[str]]:
    if not text or not text.strip():
        return 0.0, []
    lower = text.lower()
    matched = [kw for kw in weighted_keywords if kw in lower]
    score = sum(weighted_keywords[kw] for kw in matched)
    return score, matched

class AiTextAnalysisService:
    @staticmethod
    def classify_incident(text: str) -> Dict:
        best_category = IncidentCategoryEnum.OTHER.value
        best_score = 0.0
        best_reasoning = "No strong category signals found in the description"

        for category, kw_map in CATEGORY_KEYWORDS.items():
            score, matched = score_keywords(text, kw_map)
            if score > best_score:
                best_score = score
                best_category = category
                best_reasoning = f"Matched keywords: {', '.join(matched)}" if matched else best_reasoning

        confidence = 0.2 if best_score == 0.0 else min(0.95, round(best_score / 4.0, 3))
        return {
            "category": best_category,
            "confidence": confidence,
            "reasoning": best_reasoning
        }

    @staticmethod
    def assess_priority(text: str, category: str) -> Dict:
        baseline = BASELINE_PRIORITY.get(category, PriorityLevelEnum.LOW.value)
        escalation_score, matched = score_keywords(text, {k: float(v) for k, v in ESCALATION_KEYWORDS.items()})

        steps = min(2, int(round(escalation_score)))
        cur_idx = PRIORITY_ORDER.index(baseline)
        new_idx = min(len(PRIORITY_ORDER) - 1, cur_idx + steps)
        final_priority = PRIORITY_ORDER[new_idx]

        if steps > 0 and matched:
            reasoning = f"Base priority for {category} is {baseline}, escalated due to: {', '.join(matched)}"
        else:
            reasoning = f"Base priority for category {category}"

        return {
            "priority": final_priority,
            "reasoning": reasoning
        }

    @staticmethod
    def summarize_incident(text: Optional[str]) -> Optional[str]:
        if not text or len(text) < 400:
            return None

        # Split sentences
        sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+", text) if s.strip()]
        if len(sentences) <= 3:
            return text

        first = sentences[0]
        remaining = sorted(sentences[1:], key=len, reverse=True)[:2]
        return f"{first} {' '.join(remaining)}"

    @staticmethod
    def analyze_incident(text: str) -> Dict:
        classification = AiTextAnalysisService.classify_incident(text)
        priority = AiTextAnalysisService.assess_priority(text, classification["category"])
        summary = AiTextAnalysisService.summarize_incident(text)
        return {
            "classification": classification,
            "priority": priority,
            "summary": summary
        }

    @staticmethod
    def is_near_duplicate(new_text: str, previous_texts: List[str], threshold: float = 0.75) -> bool:
        def word_set(s: str) -> Set[str]:
            return set(re.findall(r"\w+", s.lower())) if s else set()

        new_words = word_set(new_text)
        if not new_words:
            return False

        for prev in previous_texts:
            prev_words = word_set(prev)
            if not prev_words:
                continue
            intersection = new_words.intersection(prev_words)
            union = new_words.union(prev_words)
            similarity = len(intersection) / len(union) if union else 0.0
            if similarity >= threshold:
                return True
        return False

    @staticmethod
    def analyze_moderation(text: str, author_user_id: Optional[int], db: Session) -> Dict:
        lower = (text or "").lower()

        severe = any(kw in lower for kw in SEVERE_KEYWORDS)
        toxic = severe or any(kw in lower for kw in TOXIC_KEYWORDS)
        spam = any(kw in lower for kw in SPAM_SIGNALS)
        inappropriate = any(kw in lower for kw in INAPPROPRIATE_KEYWORDS)

        # Check duplicate content from same author within 3 days
        repeated = False
        if author_user_id:
            cutoff = datetime.now() - timedelta(days=3)
            recent_posts = db.query(CommunityPost).filter(
                CommunityPost.author_user_id == author_user_id,
                CommunityPost.created_at >= cutoff
            ).limit(10).all()
            recent_comments = db.query(Comment).filter(
                Comment.author_user_id == author_user_id,
                Comment.created_at >= cutoff
            ).limit(10).all()

            prev_texts = [f"{p.title} {p.body}" for p in recent_posts] + [c.body for c in recent_comments]
            repeated = AiTextAnalysisService.is_near_duplicate(text, prev_texts)

        reasons = []
        if severe:
            reasons.append("Contains potentially severe/violent language.")
        if toxic and not severe:
            reasons.append("Contains toxic/abusive language.")
        if spam:
            reasons.append("Contains spam-like signals (links/promotional phrasing).")
        if inappropriate:
            reasons.append("Contains sexually explicit references.")
        if repeated:
            reasons.append("Near-duplicate of this author's recent content.")

        should_queue = severe or toxic or spam or inappropriate or repeated
        reasoning = " ".join(reasons) if reasons else "No moderation signals detected."

        return {
            "should_queue": should_queue,
            "spam": spam,
            "toxic": toxic,
            "inappropriate": inappropriate,
            "repeated": repeated,
            "reasoning": reasoning
        }
