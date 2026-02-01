#!/usr/bin/env python3
"""
Bridge script to run Agent Laboratory for grant research.
This script takes grant data as JSON input and creates a YAML config to run the lab.
"""
import os
import sys
import json
import yaml
import argparse
from pathlib import Path
from ai_lab_repo import LaboratoryWorkflow
from logger import get_logger, stream_error

def create_grant_yaml_config(grant_data, output_path="grant_research_config.yaml"):
    """
    Create a YAML configuration file for Agent Laboratory based on grant data.

    Args:
        grant_data: Dictionary containing grant information
        output_path: Path to save the YAML config
    """
    # Extract grant information
    grant_title = grant_data.get("title", "Unknown Grant")
    grant_description = grant_data.get("description", "")

    # Create research topic from grant data
    research_topic = f"Research proposal for: {grant_title}. {grant_description}"

    # Create YAML configuration
    # Use OpenRouter if available, otherwise fall back to OpenAI or Gemini
    api_key = os.getenv("OPENROUTER_API_KEY") or os.getenv("OPENAI_API_KEY") or os.getenv("GEMINI_API_KEY", "")
    llm_backend = "openrouter" if os.getenv("OPENROUTER_API_KEY") else "openai"

    config = {
        "research-topic": research_topic,
        "api-key": api_key,
        "llm-backend": llm_backend,
        "copilot-mode": False,
        "compile-latex": True,
        "load-previous": False,
        "num-papers-lit-review": 3,  # Reduced for faster execution
        "papersolver-max-steps": 3,  # Reduced for faster execution
        "mlesolver-max-steps": 2,    # Reduced for faster execution
        "num-papers-to-write": 1,
        "parallel-labs": False,
        "num-parallel-labs": 1,
        "except-if-fail": True,  # Continue even if errors occur
        "agentRxiv": False,
        "construct-agentRxiv": False,
        "agentrxiv-papers": 3,
        "lab-index": 0,
        "language": "English",
        "agent-models": {
            "literature review": "claude-opus-4.5",
            "plan formulation": "claude-sonnet-4.5",
            "data preparation": "gemini-3-pro",
            "running experiments": "gpt-5-codex",
            "results interpretation": "claude-opus-4.5",
            "report writing": "claude-sonnet-4.5",
            "report refinement": "gemini-3-pro"
        },
        "task-notes": {
            "literature-review": [
                f"Focus on research relevant to: {grant_title}",
                "Prioritize recent papers from the last 3 years"
            ],
            "plan-formulation": [
                f"Align research plan with grant requirements: {grant_description}"
            ],
            "report-writing": [
                "Structure the report as a grant proposal",
                "Include clear objectives, methodology, and expected outcomes"
            ]
        }
    }

    # Write YAML config
    with open(output_path, 'w') as f:
        yaml.dump(config, f, default_flow_style=False, sort_keys=False)

    return output_path

def stream_phase_update(phase_name, message="", stage_index=0):
    """Stream a phase update using the logger."""
    get_logger().phase_started(phase_name, message, stage_index)

def stream_agent_active(agent_name, stage, action, progress=0):
    """Stream agent activity using the logger."""
    get_logger().agent_active(agent_name, stage, action, progress)

def stream_agent_idle(agent_name, message=""):
    """Stream agent idle event using the logger."""
    get_logger().agent_idle(agent_name, message)

def stream_stage_completed(stage_name, stage_index, duration, summary=""):
    """Stream stage completion using the logger."""
    get_logger().stage_completed(stage_name, stage_index, duration, summary)

def stream_log(message, level="info", agent="System"):
    """Stream a log message using the logger."""
    logger = get_logger(agent)
    if level == "error":
        logger.error(message)
    elif level == "warning":
        logger.warning(message)
    else:
        logger.info(message)

def stream_error(message):
    """Stream an error event using the logger."""
    get_logger().error(message)

def run_agent_laboratory(grant_data):
    """
    Run the Agent Laboratory workflow with grant data.

    Args:
        grant_data: Dictionary containing grant information
    """
    try:
        # Create YAML config
        stream_log("Creating Agent Laboratory configuration...")
        yaml_path = create_grant_yaml_config(grant_data)
        stream_log(f"Configuration created: {yaml_path}")

        # Parse the YAML config (using the same logic as ai_lab_repo.py)
        stream_log("Initializing Agent Laboratory...")
        from ai_lab_repo import parse_yaml

        args = parse_yaml(yaml_path)

        # Extract configuration
        research_topic = args.research_topic
        api_key = (
            os.getenv('OPENROUTER_API_KEY') or
            os.getenv('OPENAI_API_KEY') or
            os.getenv('GEMINI_API_KEY') or
            args.api_key
        )

        if not api_key:
            raise ValueError("API key required: Set OPENROUTER_API_KEY, OPENAI_API_KEY, or GEMINI_API_KEY")

        compile_pdf = args.compile_latex if isinstance(args.compile_latex, bool) else args.compile_latex.lower() == "true"
        num_papers_lit_review = int(args.num_papers_lit_review)
        papersolver_max_steps = int(args.papersolver_max_steps)
        mlesolver_max_steps = int(args.mlesolver_max_steps)

        # Prepare task notes
        task_notes_LLM = []
        task_notes = args.task_notes
        for _task in task_notes:
            for _note in task_notes[_task]:
                task_notes_LLM.append({"phases": [_task.replace("-", " ")], "note": _note})

        # Get agent models
        agent_models = args.agent_models if hasattr(args, 'agent_models') else "gpt-4o-mini"

        # Create research directory with robust error handling
        research_dir = "grant_research_output"
        try:
            os.makedirs(research_dir, exist_ok=True)
        except Exception as e:
            stream_error(f"Failed to create research directory: {str(e)}")
            sys.exit(1)

        # Use proposal_id for isolation (Virtualization)
        proposal_id = grant_data.get("proposal_id", "0")
        lab_dir = os.path.join(research_dir, f"research_dir_{proposal_id}")
        
        try:
            # Create all necessary directories atomically
            os.makedirs(lab_dir, exist_ok=True)
            os.makedirs(os.path.join(lab_dir, "src"), exist_ok=True)
            os.makedirs(os.path.join(lab_dir, "tex"), exist_ok=True)
            
            stream_log(f"Created isolated workspace: {lab_dir}")
        except Exception as e:
            stream_error(f"Failed to create workspace directories: {str(e)}")
            sys.exit(1)

        stream_phase_update("Literature Review", "Beginning literature review phase")

        # Initialize Guardrails
        from guardrails import AgentGuardrails
        guardrails = AgentGuardrails(
            max_steps_per_phase=int(os.getenv('MAX_STEPS_PER_PHASE', '10')),
            max_cost_usd=float(os.getenv('MAX_COST_USD', '15.0')),
            timeout_seconds=int(os.getenv('AGENT_TIMEOUT_SECONDS', '300')),
            circuit_breaker_threshold=int(os.getenv('CIRCUIT_BREAKER_THRESHOLD', '3'))
        )
        stream_log(f"Guardrails initialized: max_steps={guardrails.max_steps_per_phase}, max_cost=${guardrails.max_cost_usd}")

        # Initialize Laboratory Workflow
        lab = LaboratoryWorkflow(
            research_topic=research_topic,
            notes=task_notes_LLM,
            agent_model_backbone=agent_models,
            human_in_loop_flag=None,
            openai_api_key=api_key,
            compile_pdf=compile_pdf,
            num_papers_lit_review=num_papers_lit_review,
            papersolver_max_steps=papersolver_max_steps,
            mlesolver_max_steps=mlesolver_max_steps,
            paper_index=0,
            except_if_fail=False,
            agentRxiv=False,
            lab_index=0,
            lab_dir=f"./{lab_dir}"
        )
        
        # Attach guardrails to lab instance
        lab.guardrails = guardrails

        # Run research workflow with 7-stage tracking
        stream_log("Agent Laboratory initialized successfully")
        stream_log("Starting 7-stage research workflow...")
        
        # Define the 7 research stages
        research_stages = [
            {"name": "Literature Review", "agent": "PhD Student", "index": 0},
            {"name": "Plan Formulation", "agent": "Postdoc", "index": 1},
            {"name": "Data Preparation", "agent": "ML Engineer", "index": 2},
            {"name": "Running Experiments", "agent": "SW Engineer", "index": 3},
            {"name": "Results Interpretation", "agent": "Professor", "index": 4},
            {"name": "Report Writing", "agent": "PhD Student", "index": 5},
            {"name": "Report Refinement", "agent": "Professor", "index": 6},
        ]
        
        import time
        start_time = time.time()
        
        # Stream initial stage
        stream_phase_update(research_stages[0]["name"], 
                          f"Starting {research_stages[0]['name']}", 
                          research_stages[0]["index"])
        stream_agent_active(research_stages[0]["agent"], 
                          research_stages[0]["name"],
                          "Searching for relevant papers", 0)
        
        try:
            # Run the actual research (this is the Agent Laboratory workflow)
            # We'll wrap it to track progress through stages
            lab.perform_research()
            
            # If we get here, research completed successfully
            # Stream final stage completion
            final_stage = research_stages[-1]
            elapsed = int(time.time() - start_time)
            stream_stage_completed(final_stage["name"], final_stage["index"], 
                                 elapsed, "Research workflow completed")
            
        except Exception as research_error:
            stream_error(f"Research workflow error: {str(research_error)}")
            raise

        stream_log("Research workflow completed successfully!")

        # Stream completion status
        completion_event = {
            "type": "status",
            "status": "completed",
            "message": "Agent Laboratory research completed"
        }
        print(json.dumps(completion_event), flush=True)

        # Output results location
        result_event = {
            "type": "result",
            "output_dir": lab_dir,
            "message": f"Research output saved to {lab_dir}"
        }
        print(json.dumps(result_event), flush=True)

    except Exception as e:
        error_event = {
            "type": "error",
            "message": f"Agent Laboratory error: {str(e)}"
        }
        print(json.dumps(error_event), flush=True)
        sys.exit(1)

def main():
    """Main entry point for the bridge script."""
    parser = argparse.ArgumentParser(description="Run Agent Laboratory for grant research")
    parser.add_argument("--grant-data", type=str, required=True, help="JSON string containing grant data")

    args = parser.parse_args()

    try:
        # Parse grant data
        grant_data = json.loads(args.grant_data)

        # Run Agent Laboratory
        run_agent_laboratory(grant_data)

    except json.JSONDecodeError as e:
        error_event = {
            "type": "error",
            "message": f"Invalid JSON in grant-data: {str(e)}"
        }
        print(json.dumps(error_event), flush=True)
        sys.exit(1)
    except Exception as e:
        error_event = {
            "type": "error",
            "message": f"Bridge script error: {str(e)}"
        }
        print(json.dumps(error_event), flush=True)
        sys.exit(1)

if __name__ == "__main__":
    main()
