"""
AI explanation service - generates human-readable explanations for violations.
Uses OpenAI API (optional) or template-based generation.
"""
from typing import Dict, Optional
import os
from dotenv import load_dotenv

load_dotenv()


class ExplanationService:
    """
    Generates plain-English explanations for architecture violations.
    
    Note: AI is used only for explanation, NOT for detection.
    Violations are deterministically detected by the rules engine.
    """

    def __init__(self, use_ai: bool = False):
        """
        Initialize explanation service.
        
        Args:
            use_ai: Whether to use OpenAI API for explanations
        """
        self.use_ai = use_ai and bool(os.getenv('OPENAI_API_KEY'))
        
        if self.use_ai:
            try:
                import openai
                self.openai = openai
                self.openai.api_key = os.getenv('OPENAI_API_KEY')
            except ImportError:
                self.use_ai = False

    def explain_violation(self, violation: Dict, detail_level: str = "STANDARD") -> Dict[str, str]:
        """
        Generate explanation and suggested fix for a violation.
        
        Args:
            violation: Violation dictionary
            detail_level: "BRIEF" or "STANDARD" - controls explanation depth
            
        Returns:
            Dictionary with 'explanation' and 'suggested_fix'
        """
        if self.use_ai:
            return self._generate_ai_explanation(violation)
        else:
            return self._generate_template_explanation(violation, detail_level=detail_level)

    def _generate_template_explanation(self, violation: Dict, detail_level: str = "STANDARD") -> Dict[str, str]:
        """
        Generate explanation using predefined templates.
        Fast and no API calls required.
        
        Args:
            violation: Violation data
            detail_level: "BRIEF" or "STANDARD"
        """
        violation_type = violation['type']
        is_brief = (detail_level == "BRIEF")
        
        # Template-based explanations
        templates = {
            'layer_violation': self._explain_layer_violation,
            'circular_dependency': self._explain_circular_dependency,
            'legacy_access': self._explain_legacy_access,
            'bypass_gateway': self._explain_gateway_bypass
        }
        
        handler = templates.get(violation_type, self._explain_generic)
        result = handler(violation)
        
        # Shorten for BRIEF mode
        if is_brief:
            result['explanation'] = result['explanation'].split('\n\n')[0]  # First paragraph only
            result['suggested_fix'] = result['suggested_fix'].split('\n\n')[0]  # First paragraph only
        
        return result

    def _explain_layer_violation(self, violation: Dict) -> Dict[str, str]:
        """Explain layer boundary violation."""
        source = violation['source_module']
        target = violation['target_module']
        pattern = violation['pattern_broken']
        
        explanation = f"""
**What happened:**
The module `{source}` is depending on `{target}`, which violates the architectural layer boundary.

**Why this is problematic:**
{pattern}. This creates tight coupling between layers and makes the system harder to maintain, test, and refactor. Layer violations lead to:
- Difficulty understanding the system's structure
- Changes rippling across unrelated parts of the codebase
- Inability to evolve layers independently
- Testing becomes harder due to unwanted dependencies

**Long-term impact:**
If left unchecked, layer violations accumulate and the architecture erodes. Eventually, the system becomes a "big ball of mud" where everything depends on everything else.
        """.strip()
        
        suggested_fix = f"""
**Recommended refactoring approach:**

1. **Introduce an adapter or service layer** between `{source}` and `{target}`
2. **Extract the needed functionality** into the appropriate layer
3. **Use dependency inversion** - depend on abstractions, not concrete implementations
4. **Create a facade** if multiple modules need similar access patterns

**Example pattern:**
Instead of: `{source}` → `{target}` (direct access)
Use: `{source}` → `ServiceLayer` → `{target}` (proper layering)
        """.strip()
        
        return {
            'explanation': explanation,
            'suggested_fix': suggested_fix
        }

    def _explain_circular_dependency(self, violation: Dict) -> Dict[str, str]:
        """Explain circular dependency."""
        path = violation['dependency_path']
        path_str = " → ".join(path)
        
        explanation = f"""
**What happened:**
A circular dependency chain was detected: {path_str}

**Why this is problematic:**
Circular dependencies create tightly coupled modules that cannot exist independently. This leads to:
- Modules that are impossible to test in isolation
- Changes in one module requiring changes in all others in the cycle
- Difficult to understand control flow
- Build and initialization order problems
- Cannot reuse modules separately

**Long-term impact:**
Circular dependencies are a major code smell indicating poor separation of concerns. They make refactoring nearly impossible without breaking changes.
        """.strip()
        
        suggested_fix = f"""
**Recommended refactoring approach:**

1. **Identify the weakest link** in the cycle - which dependency is least essential?
2. **Extract shared logic** into a new module that both can depend on
3. **Use dependency injection** to break the cycle
4. **Introduce events/observers** instead of direct calls
5. **Apply the Dependency Inversion Principle** - both modules depend on an abstraction

**Pattern to break the cycle:**
- Extract common interface/base class
- Use callbacks or event handlers
- Introduce a mediator or coordinator pattern
        """.strip()
        
        return {
            'explanation': explanation,
            'suggested_fix': suggested_fix
        }

    def _explain_legacy_access(self, violation: Dict) -> Dict[str, str]:
        """Explain legacy system access violation."""
        source = violation['source_module']
        target = violation['target_module']
        
        explanation = f"""
**What happened:**
Module `{source}` is directly accessing legacy system `{target}` without an anti-corruption layer.

**Why this is problematic:**
Legacy systems often have:
- Outdated APIs and data models
- Unpredictable behavior and undocumented quirks
- Security vulnerabilities
- Technical debt that spreads to calling code

Direct access means legacy assumptions and constraints leak into modern code, making it harder to eventually migrate away from the legacy system.

**Long-term impact:**
Every direct integration point is a place where legacy concepts infect your new architecture. This makes future migration much more expensive and risky.
        """.strip()
        
        suggested_fix = f"""
**Recommended refactoring approach:**

1. **Create an Anti-Corruption Layer (ACL)** - a dedicated adapter/gateway
2. **Translate legacy data models** to clean domain models in the ACL
3. **Route all legacy access** through this single point
4. **Isolate legacy quirks** - handle them in the ACL, not in business logic

**Pattern:**
```
{source} → LegacyAdapter (ACL) → {target}
```

The ACL acts as a translator, protecting your clean architecture from legacy pollution.
        """.strip()
        
        return {
            'explanation': explanation,
            'suggested_fix': suggested_fix
        }

    def _explain_gateway_bypass(self, violation: Dict) -> Dict[str, str]:
        """Explain gateway bypass violation."""
        source = violation['source_module']
        target = violation['target_module']
        
        explanation = f"""
**What happened:**
Client/presentation module `{source}` is bypassing the API Gateway and directly accessing `{target}`.

**Why this is problematic:**
The API Gateway serves critical functions:
- Authentication and authorization
- Rate limiting and throttling
- Request routing and load balancing
- Logging and monitoring
- API versioning

Bypassing it means these cross-cutting concerns are missing, creating security vulnerabilities and inconsistent behavior.

**Long-term impact:**
Gateway bypasses create unprotected backdoors into your system. Each bypass is a potential security vulnerability and makes it impossible to enforce consistent policies.
        """.strip()
        
        suggested_fix = f"""
**Recommended refactoring approach:**

1. **Route the request through the gateway** - update `{source}` to call gateway endpoints
2. **Ensure proper authentication** - don't allow unauthenticated direct access
3. **Use API contracts** - define clear interfaces through the gateway
4. **Remove direct dependencies** - client should only know about gateway, not internal services

**Pattern:**
```
{source} → API Gateway → {target}
```

All external requests must go through the gateway for security and consistency.
        """.strip()
        
        return {
            'explanation': explanation,
            'suggested_fix': suggested_fix
        }

    def _explain_generic(self, violation: Dict) -> Dict[str, str]:
        """Generic explanation for unknown violation types."""
        return {
            'explanation': f"Architecture violation detected: {violation['description']}",
            'suggested_fix': "Review the dependency and consider refactoring to match intended architecture."
        }

    def _generate_ai_explanation(self, violation: Dict) -> Dict[str, str]:
        """
        Generate explanation using OpenAI API.
        More dynamic but requires API key and makes external calls.
        """
        # For MVP, fall back to template-based
        # In production, you could call OpenAI API here
        return self._generate_template_explanation(violation)
