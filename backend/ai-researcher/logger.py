#!/usr/bin/env python3
"""
Structured Logging System for Agent Laboratory
Provides JSON-formatted logging compatible with SSE streaming
"""
import json
import sys
from datetime import datetime
from enum import Enum
from typing import Optional, Dict, Any


class LogLevel(Enum):
    """Log severity levels"""
    DEBUG = "debug"
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"


class AgentLogger:
    """
    Centralized logger for agent activities.
    Outputs JSON events to stdout for SSE consumption.
    """
    
    def __init__(self, agent_name: str = "AgentLab", min_level: LogLevel = LogLevel.INFO):
        self.agent_name = agent_name
        self.min_level = min_level
        self._level_priority = {
            LogLevel.DEBUG: 0,
            LogLevel.INFO: 1,
            LogLevel.WARNING: 2,
            LogLevel.ERROR: 3,
            LogLevel.CRITICAL: 4
        }
    
    def _should_log(self, level: LogLevel) -> bool:
        """Check if message should be logged based on min_level"""
        return self._level_priority[level] >= self._level_priority[self.min_level]
    
    def _emit(self, event: Dict[str, Any]):
        """Emit JSON event to stdout"""
        print(json.dumps(event), flush=True)
    
    def log(self, message: str, level: LogLevel = LogLevel.INFO, 
            context: Optional[Dict[str, Any]] = None):
        """
        Log a message with optional context.
        
        Args:
            message: Log message
            level: Log severity level
            context: Additional context data
        """
        if not self._should_log(level):
            return
        
        event = {
            "type": "log",
            "level": level.value,
            "message": message,
            "agent": self.agent_name,
            "timestamp": datetime.now().isoformat()
        }
        
        if context:
            event["context"] = context
        
        self._emit(event)
    
    def debug(self, message: str, **context):
        """Log debug message"""
        self.log(message, LogLevel.DEBUG, context or None)
    
    def info(self, message: str, **context):
        """Log info message"""
        self.log(message, LogLevel.INFO, context or None)
    
    def warning(self, message: str, **context):
        """Log warning message"""
        self.log(message, LogLevel.WARNING, context or None)
    
    def error(self, message: str, recoverable: bool = False, **context):
        """
        Log error message.
        
        Args:
            message: Error description
            recoverable: Whether error is recoverable
            context: Additional error context
        """
        ctx = context or {}
        ctx["recoverable"] = recoverable
        self.log(message, LogLevel.ERROR, ctx)
    
    def critical(self, message: str, **context):
        """Log critical error message"""
        self.log(message, LogLevel.CRITICAL, context or None)
    
    def phase_started(self, phase_name: str, message: str = "", stage_index: int = 0):
        """
        Log phase transition event.
        
        Args:
            phase_name: Name of the phase starting
            message: Optional description
            stage_index: Index of the stage
        """
        event = {
            "type": "stage_started",
            "stage": phase_name,
            "stageIndex": stage_index,
            "message": message or f"Starting {phase_name}",
            "timestamp": datetime.now().isoformat()
        }
        self._emit(event)
    
    def stage_completed(self, phase_name: str, stage_index: int, duration: float, summary: str = ""):
        """
        Log stage completion.
        """
        event = {
            "type": "stage_completed",
            "stage": phase_name,
            "stageIndex": stage_index,
            "duration": duration,
            "summary": summary,
            "timestamp": datetime.now().isoformat()
        }
        self._emit(event)

    def agent_active(self, agent_name: str, stage: str, action: str, progress: int = 0):
        """Log agent activity."""
        event = {
            "type": "agent_active",
            "agent": agent_name,
            "stage": stage,
            "action": action,
            "progress": progress,
            "timestamp": datetime.now().isoformat()
        }
        self._emit(event)

    def agent_idle(self, agent_name: str, message: str = ""):
        """Log agent idle state."""
        event = {
            "type": "agent_idle",
            "agent": agent_name,
            "message": message or f"{agent_name} waiting",
            "timestamp": datetime.now().isoformat()
        }
        self._emit(event)

    
    def progress(self, percentage: int, message: str = ""):
        """
        Log progress update.
        
        Args:
            percentage: Progress percentage (0-100)
            message: Optional progress description
        """
        event = {
            "type": "progress",
            "percentage": max(0, min(100, percentage)),
            "message": message,
            "timestamp": datetime.now().isoformat()
        }
        self._emit(event)
    
    def metric(self, metric_name: str, value: float, unit: str = ""):
        """
        Log a metric value.
        
        Args:
            metric_name: Name of the metric
            value: Metric value
            unit: Optional unit (e.g., 'seconds', 'USD', 'tokens')
        """
        event = {
            "type": "metric",
            "metric": metric_name,
            "value": value,
            "unit": unit,
            "timestamp": datetime.now().isoformat()
        }
        self._emit(event)
    
    def agent_action(self, action: str, details: Optional[Dict[str, Any]] = None):
        """
        Log an agent action.
        
        Args:
            action: Action being performed
            details: Optional action details
        """
        event = {
            "type": "agent_action",
            "action": action,
            "agent": self.agent_name,
            "timestamp": datetime.now().isoformat()
        }
        
        if details:
            event["details"] = details
        
        self._emit(event)


# Global logger instance
_global_logger: Optional[AgentLogger] = None


def get_logger(agent_name: str = "AgentLab") -> AgentLogger:
    """
    Get or create global logger instance.
    
    Args:
        agent_name: Name of the agent
    
    Returns:
        AgentLogger instance
    """
    global _global_logger
    if _global_logger is None:
        _global_logger = AgentLogger(agent_name)
    return _global_logger


def stream_error(message: str, recoverable: bool = False, **context):
    """
    Stream an error event (backward compatibility function).
    
    Args:
        message: Error message
        recoverable: Whether the error is recoverable
        context: Additional error context
    """
    logger = get_logger()
    logger.error(message, recoverable=recoverable, **context)
