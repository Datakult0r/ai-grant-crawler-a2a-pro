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

def stream_phase_update(phase_name, message=""):
    """Stream a phase update as JSON to stdout for SSE consumption."""
    event = {
        "type": "stage_started",
        "stage": phase_name,
        "message": message or f"Starting {phase_name}"
    }
    print(json.dumps(event), flush=True)

def stream_log(message, level="info"):
    """Stream a log message as JSON to stdout."""
    event = {
        "type": "log",
        "level": level,
        "message": message
    }
    print(json.dumps(event), flush=True)

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

        # Create research directory
        research_dir = "grant_research_output"
        if not os.path.exists(research_dir):
            os.mkdir(research_dir)

        # Use proposal_id for isolation (Virtualization)
        proposal_id = grant_data.get("proposal_id", "0")
        lab_dir = os.path.join(research_dir, f"research_dir_{proposal_id}")
        
        if not os.path.exists(lab_dir):
            os.mkdir(lab_dir)
            if not os.path.exists(os.path.join(lab_dir, "src")):
                os.mkdir(os.path.join(lab_dir, "src"))
            if not os.path.exists(os.path.join(lab_dir, "tex")):
                os.mkdir(os.path.join(lab_dir, "tex"))

        stream_phase_update("Literature Review", "Beginning literature review phase")

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

        # Run research workflow
        stream_log("Agent Laboratory initialized successfully")
        stream_log("Starting research workflow...")

        # Monkey-patch the lab instance to stream progress
        original_verbose = lab.verbose

        # Run the research
        lab.perform_research()

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
