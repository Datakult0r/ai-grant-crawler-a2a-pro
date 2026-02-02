import unittest
from unittest.mock import MagicMock, patch, mock_open
import sys
import os

# Add parent directory to path to import reflection_agent
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from reflection_agent import ReflectionAgent

class TestReflectionAgent(unittest.TestCase):
    
    @patch("reflection_agent.get_logger")
    @patch("google.generativeai.GenerativeModel")
    @patch("google.generativeai.configure")
    def test_reflect_success(self, mock_configure, mock_model_cls, mock_logger):
        # Setup specific mock for the model instance
        mock_model_instance = MagicMock()
        mock_model_cls.return_value = mock_model_instance
        
        # Setup mock response
        mock_response = MagicMock()
        mock_response.text = '{"score": 85, "strengths": ["Good plan"], "weaknesses": ["None"]}'
        mock_model_instance.generate_content.return_value = mock_response

        agent = ReflectionAgent(api_key="test_key")
        
        # Mock file reading/writing
        with patch("builtins.open", mock_open(read_data="# Research Report\nContent...")) as mock_file:
            # Mock os.path.exists to return True for README.md
            with patch("os.path.exists", return_value=True):
                result = agent.reflect("dummy_dir", {"title": "Grant A", "description": "Test"})
        
        self.assertEqual(result["score"], 85)
        self.assertEqual(result["strengths"][0], "Good plan")
        mock_configure.assert_called_with(api_key="test_key")

    @patch("reflection_agent.get_logger")
    def test_reflect_no_files(self, mock_logger):
        agent = ReflectionAgent(api_key="test_key")
        
        # Mock os.path.exists to return False and glob to return empty
        with patch("os.path.exists", return_value=False):
            with patch("pathlib.Path.glob", return_value=[]):
                result = agent.reflect("empty_dir", {})
                
        self.assertEqual(result["score"], 0)
        self.assertIn("No output content found", result["critique"])

if __name__ == "__main__":
    unittest.main()
