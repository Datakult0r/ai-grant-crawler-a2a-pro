#!/usr/bin/env python3
"""
Agent Guardrails System
Implements step limits, cost tracking, circuit breakers, and timeouts
"""
import time
from typing import Dict, Optional
from datetime import datetime, timedelta
from logger import get_logger


class AgentGuardrails:
    """
    Guardrails for autonomous agent execution.
    Prevents runaway costs, infinite loops, and cascading failures.
    """
    
    def __init__(
        self,
        max_steps_per_phase: int = 10,
        max_cost_usd: float = 15.0,
        timeout_seconds: int = 300,
        circuit_breaker_threshold: int = 3
    ):
        """
        Initialize guardrails.
        
        Args:
            max_steps_per_phase: Maximum steps allowed per phase
            max_cost_usd: Maximum total cost in USD
            timeout_seconds: Maximum time per phase in seconds
            circuit_breaker_threshold: Failures before circuit breaker trips
        """
        self.max_steps_per_phase = max_steps_per_phase
        self.max_cost_usd = max_cost_usd
        self.timeout_seconds = timeout_seconds
        self.circuit_breaker_threshold = circuit_breaker_threshold
        
        # Tracking state
        self.step_counts: Dict[str, int] = {}
        self.total_cost: float = 0.0
        self.failure_counts: Dict[str, int] = {}
        self.phase_start_times: Dict[str, datetime] = {}
        self.circuit_breakers: Dict[str, bool] = {}
        
        self.logger = get_logger("Guardrails")
    
    def start_phase(self, phase_name: str):
        """
        Mark the start of a phase.
        
        Args:
            phase_name: Name of the phase starting
        """
        self.phase_start_times[phase_name] = datetime.now()
        self.step_counts[phase_name] = 0
        self.failure_counts[phase_name] = 0
        self.circuit_breakers[phase_name] = False
        
        self.logger.info(f"Phase started: {phase_name}", phase=phase_name)
    
    def increment_step(self, phase_name: str) -> bool:
        """
        Increment step count for a phase.
        
        Args:
            phase_name: Name of the phase
        
        Returns:
            True if within limits, False if limit exceeded
        """
        if phase_name not in self.step_counts:
            self.step_counts[phase_name] = 0
        
        self.step_counts[phase_name] += 1
        current_steps = self.step_counts[phase_name]
        
        if current_steps > self.max_steps_per_phase:
            self.logger.warning(
                f"Step limit exceeded for {phase_name}",
                phase=phase_name,
                current_steps=current_steps,
                max_steps=self.max_steps_per_phase
            )
            return False
        
        return True
    
    def add_cost(self, cost_usd: float, description: str = ""):
        """
        Add to total cost and check limits.
        
        Args:
            cost_usd: Cost to add in USD
            description: Description of the cost
        
        Returns:
            True if within budget, False if exceeded
        """
        self.total_cost += cost_usd
        
        self.logger.metric("api_cost", cost_usd, "USD")
        
        if self.total_cost > self.max_cost_usd:
            self.logger.error(
                f"Cost limit exceeded: ${self.total_cost:.2f} > ${self.max_cost_usd:.2f}",
                recoverable=False,
                total_cost=self.total_cost,
                max_cost=self.max_cost_usd
            )
            return False
        
        return True
    
    def check_timeout(self, phase_name: str) -> bool:
        """
        Check if phase has timed out.
        
        Args:
            phase_name: Name of the phase
        
        Returns:
            True if within time limit, False if timed out
        """
        if phase_name not in self.phase_start_times:
            return True
        
        elapsed = (datetime.now() - self.phase_start_times[phase_name]).total_seconds()
        
        if elapsed > self.timeout_seconds:
            self.logger.error(
                f"Timeout exceeded for {phase_name}",
                recoverable=False,
                phase=phase_name,
                elapsed_seconds=elapsed,
                timeout_seconds=self.timeout_seconds
            )
            return False
        
        return True
    
    def record_failure(self, phase_name: str, error: str):
        """
        Record a failure and check circuit breaker.
        
        Args:
            phase_name: Name of the phase
            error: Error description
        
        Returns:
            True if can continue, False if circuit breaker tripped
        """
        if phase_name not in self.failure_counts:
            self.failure_counts[phase_name] = 0
        
        self.failure_counts[phase_name] += 1
        failures = self.failure_counts[phase_name]
        
        self.logger.warning(
            f"Failure recorded for {phase_name}",
            phase=phase_name,
            failures=failures,
            threshold=self.circuit_breaker_threshold,
            error=error
        )
        
        if failures >= self.circuit_breaker_threshold:
            self.circuit_breakers[phase_name] = True
            self.logger.error(
                f"Circuit breaker tripped for {phase_name}",
                recoverable=False,
                phase=phase_name,
                failures=failures
            )
            return False
        
        return True
    
    def is_circuit_open(self, phase_name: str) -> bool:
        """
        Check if circuit breaker is open for a phase.
        
        Args:
            phase_name: Name of the phase
        
        Returns:
            True if circuit is open (blocked), False if closed (allowed)
        """
        return self.circuit_breakers.get(phase_name, False)
    
    def get_metrics(self) -> Dict:
        """
        Get current metrics.
        
        Returns:
            Dictionary of metrics
        """
        return {
            "total_cost_usd": self.total_cost,
            "step_counts": self.step_counts.copy(),
            "failure_counts": self.failure_counts.copy(),
            "circuit_breakers": self.circuit_breakers.copy(),
            "max_cost_usd": self.max_cost_usd,
            "max_steps_per_phase": self.max_steps_per_phase
        }
