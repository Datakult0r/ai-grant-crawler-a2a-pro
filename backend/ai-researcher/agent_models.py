# Agent Model Configuration for Maximum Quality
# 
# This configuration maps each agent role to its optimal model based on
# benchmark performance data from December 2024-2025:
#
# | Agent           | Model                          | Why                                    | Cost (in/out per 1M) |
# |-----------------|--------------------------------|----------------------------------------|----------------------|
# | PhD Student     | Claude Opus 4.5 (Reasoning)    | Best reasoning (69.77), excellent writing | $5/$25 |
# | Postdoc         | Gemini 3 Pro (high)            | Top reasoning (72.85), 95.67% math    | FREE (via Gemini API) |
# | Professor       | Claude 4.5 Sonnet (Reasoning)  | Great writing + reasoning balance     | $3/$15 |
# | ML Engineer     | GPT-5 Codex (high)             | 98.67% math, 84% LiveCodeBench        | $1.25/$10 |
# | SW Engineer     | Claude Opus 4.5 (Reasoning)    | 87.1% LiveCodeBench, best agentic     | $5/$25 |
# | Reviewers       | Gemini 3 Pro (high)            | Top GPQA (90.8%), rigorous reasoning  | FREE (via Gemini API) |

import os

# Model mappings - these are the optimal models per agent role
# Use "openrouter:" prefix for OpenRouter models, "gemini:" for Gemini API, otherwise default to OpenAI API
AGENT_MODEL_CONFIG = {
    # Research & Strategy roles - need deep reasoning
    "phd_student": {
        "model": "claude-opus-4.5",         # Best for complex reasoning + writing
        "provider": "openrouter",
        "fallback": "gemini-3-pro"           # Free fallback
    },
    "postdoc": {
        "model": "gemini-3-pro",             # Top reasoning, FREE
        "provider": "gemini",
        "fallback": "gemini-2.0-pro"
    },
    
    # Writing roles - need excellent prose
    "professor": {
        "model": "claude-sonnet-4.5",        # Great writing + reasoning
        "provider": "openrouter",
        "fallback": "gemini-3-pro"
    },
    
    # Coding roles - need top coding performance
    "ml_engineer": {
        "model": "gpt-5-codex",              # Best coding (98.67% math)
        "provider": "openrouter",
        "fallback": "gemini-3-pro"
    },
    "sw_engineer": {
        "model": "claude-opus-4.5",          # 87.1% LiveCodeBench, best agentic
        "provider": "openrouter",
        "fallback": "gpt-5-codex"
    },
    
    # Review roles - need critical reasoning
    "reviewers": {
        "model": "gemini-3-pro",             # Top GPQA (90.8%), FREE
        "provider": "gemini",
        "fallback": "claude-opus-4.5"
    }
}

# Provider configurations
PROVIDER_CONFIG = {
    "openrouter": {
        "api_key_env": "OPENROUTER_API_KEY",
        "base_url": "https://openrouter.ai/api/v1"
    },
    "gemini": {
        "api_key_env": "GEMINI_API_KEY",
        "model_map": {
            "gemini-3-pro": "gemini-3-pro-preview",  # or latest experimental model
            "gemini-2.0-pro": "gemini-2.0-pro-exp-02-05"
        }
    },
    "openai": {
        "api_key_env": "OPENAI_API_KEY",
        "base_url": None
    }
}

def get_agent_model(agent_type: str) -> str:
    """
    Get the optimal model for a given agent type.
    Falls back to alternative if primary model/API is unavailable.
    
    Args:
        agent_type: One of phd_student, postdoc, professor, ml_engineer, sw_engineer, reviewers
    
    Returns:
        Model string to use with query_model()
    """
    config = AGENT_MODEL_CONFIG.get(agent_type, {"model": "gemini-3-pro", "provider": "gemini"})
    
    # Check if primary provider API key is available
    provider = config.get("provider", "openrouter")
    provider_config = PROVIDER_CONFIG.get(provider, {})
    api_key_env = provider_config.get("api_key_env", "")
    
    if api_key_env and os.getenv(api_key_env):
        return config["model"]
    elif config.get("fallback"):
        return config["fallback"]
    else:
        return "gemini-3-pro"  # Ultimate fallback


def get_all_agent_models() -> dict:
    """
    Get all agent model configurations.
    Returns a dict with all agent types and their resolved models.
    """
    return {agent: get_agent_model(agent) for agent in AGENT_MODEL_CONFIG}


# Cost estimation per agent run (rough estimates in USD)
ESTIMATED_COSTS = {
    "phd_student": 2.50,      # Heavy reasoning, ~100k-500k tokens
    "postdoc": 0.00,          # Free (Gemini)
    "professor": 1.50,        # Writing-heavy, moderate tokens
    "ml_engineer": 1.00,      # Code generation, efficient
    "sw_engineer": 2.00,      # Agentic coding, iterative
    "reviewers": 0.00         # Free (Gemini)
}

def estimate_run_cost() -> float:
    """Estimate total cost for running all agents once."""
    return sum(ESTIMATED_COSTS.values())


if __name__ == "__main__":
    print("🔬 Agent Laboratory - Maximum Quality Model Configuration")
    print("=" * 60)
    for agent, config in AGENT_MODEL_CONFIG.items():
        model = get_agent_model(agent)
        cost = ESTIMATED_COSTS.get(agent, 0)
        print(f"  {agent.upper():15} → {model:25} (${cost:.2f}/run)")
    print("=" * 60)
    print(f"  Estimated total cost per research run: ${estimate_run_cost():.2f}")
