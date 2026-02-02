import os
import json
from pathlib import Path
from logger import get_logger

class ReflectionAgent:
    """
    Agent responsible for critiquing and evaluating the quality of the research output.
    """
    def __init__(self, api_key, model="gemini-1.5-flash"):
        self.api_key = api_key
        self.model = model
        self.logger = get_logger("ReflectionAgent")

    def reflect(self, lab_dir, grant_data):
        """
        Analyze the research output and generate a critique.
        
        Args:
            lab_dir (str): Path to the research output directory
            grant_data (dict): Original grant requirements
            
        Returns:
            dict: Reflection result with score and critique
        """
        self.logger.info(f"Starting reflection on output in {lab_dir}")
        
        # 1. Identify Output Content
        # We look for a README.md or a generated report file
        content_to_review = ""
        report_path = os.path.join(lab_dir, "README.md")
        
        if os.path.exists(report_path):
            with open(report_path, "r", encoding="utf-8") as f:
                content_to_review = f.read()
        else:
            # Fallback: Look for any markdown file
            md_files = list(Path(lab_dir).glob("*.md"))
            if md_files:
                with open(md_files[0], "r", encoding="utf-8") as f:
                    content_to_review = f.read()
            else:
                self.logger.warning("No reviewable content found (README.md or *.md missing)")
                return {"score": 0, "critique": "No output content found to review."}

        # 2. Perform LLM Critique
        critique = self._query_llm_critique(content_to_review, grant_data)
        
        # 3. Save Reflection Report
        reflection_path = os.path.join(lab_dir, "reflection_report.json")
        with open(reflection_path, "w", encoding="utf-8") as f:
            json.dump(critique, f, indent=2)
            
        self.logger.info(f"Reflection complete. Score: {critique.get('score', 0)}/100")
        return critique

    def _query_llm_critique(self, content, grant_data):
        """
        Internal method to call LLM for grading. 
        Uses Google Generative AI (Gemini) or potentially OpenAI if configured.
        """
        try:
            import google.generativeai as genai
            
            # Configure Gemini
            if not self.api_key:
                self.logger.warning("No API Key for Reflection Agent. Skipping.")
                return {"score": 0, "critique": "Skipped due to missing API Key"}

            genai.configure(api_key=self.api_key)
            model = genai.GenerativeModel(self.model)

            prompt = f"""
            You are a rigorous Grant Proposal Evaluator.
            
            Original Grant Requirements:
            Title: {grant_data.get('title')}
            Description: {grant_data.get('description')}
            Target Audience/Eligibility: {grant_data.get('eligibility', 'Not specific')}
            
            Generated Research Output (Report/Plan):
            {content[:20000]}  # Truncate to avoid context limits if huge
            
            Task:
            Evaluate the Generated Output against the Grant Requirements.
            Provide a score (0-100) and a structured critique.
            
            Return ONLY valid JSON in this format:
            {{
                "score": 85,
                "strengths": ["...", "..."],
                "weaknesses": ["...", "..."],
                "missing_requirements": ["...", "..."],
                "recommendations": "..."
            }}
            """
            
            response = model.generate_content(prompt)
            text = response.text
            
            # reliable JSON extraction
            import re
            json_match = re.search(r'\{[\s\S]*\}', text)
            if json_match:
                return json.loads(json_match.group(0))
            else:
                return {"score": 0, "critique": "Failed to parse LLM response format", "raw": text}
                
        except Exception as e:
            self.logger.error(f"Reflection LLM Error: {str(e)}")
            return {"score": 0, "error": str(e)}
