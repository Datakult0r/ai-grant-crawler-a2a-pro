import openai
import time, tiktoken
from openai import OpenAI
import os, anthropic, json
import google.generativeai as genai
import logging

# Configure logging for cost tracking
logging.basicConfig(level=logging.INFO)
cost_logger = logging.getLogger('cost_tracker')

TOKENS_IN = dict()
TOKENS_OUT = dict()

encoding = tiktoken.get_encoding("cl100k_base")

# OpenRouter model mappings for maximum quality
OPENROUTER_MODELS = {
    # Optimal models per agent role
    "claude-opus-4.5": "anthropic/claude-opus-4-5-20251101",
    "claude-sonnet-4.5": "anthropic/claude-sonnet-4-5-20250929",
    "gpt-5-codex": "openai/gpt-5-codex",
    "gpt-5": "openai/gpt-5-2025-08-07",
    "gemini-3-pro": "google/gemini-3-pro-preview",
    "deepseek-r1": "deepseek/deepseek-r1",
}

def log_agent_cost(agent_name: str, model: str, tokens_in: int, tokens_out: int):
    """
    Log cost information for an agent inference call.
    Format: [COST] Agent: {agent_name}, Model: {model}, Tokens: {tokens}
    """
    total_tokens = tokens_in + tokens_out
    cost_logger.info(f"[COST] Agent: {agent_name}, Model: {model}, Tokens: {total_tokens} (in: {tokens_in}, out: {tokens_out})")

def curr_cost_est():
    costmap_in = {
        "gpt-4o": 2.50 / 1000000,
        "gpt-4o-mini": 0.150 / 1000000,
        "o1-preview": 15.00 / 1000000,
        "o1-mini": 3.00 / 1000000,
        "claude-3-5-sonnet": 3.00 / 1000000,
        "deepseek-chat": 1.00 / 1000000,
        "o1": 15.00 / 1000000,
        "o3-mini": 1.10 / 1000000,
        # New maximum quality models via OpenRouter
        "claude-opus-4.5": 5.00 / 1000000,
        "claude-sonnet-4.5": 3.00 / 1000000,
        "gpt-5-codex": 1.25 / 1000000,
        "gpt-5": 1.25 / 1000000,
        "gemini-3-pro": 2.00 / 1000000,
    }
    costmap_out = {
        "gpt-4o": 10.00/ 1000000,
        "gpt-4o-mini": 0.6 / 1000000,
        "o1-preview": 60.00 / 1000000,
        "o1-mini": 12.00 / 1000000,
        "claude-3-5-sonnet": 12.00 / 1000000,
        "deepseek-chat": 5.00 / 1000000,
        "o1": 60.00 / 1000000,
        "o3-mini": 4.40 / 1000000,
        # New maximum quality models via OpenRouter
        "claude-opus-4.5": 25.00 / 1000000,
        "claude-sonnet-4.5": 15.00 / 1000000,
        "gpt-5-codex": 10.00 / 1000000,
        "gpt-5": 10.00 / 1000000,
        "gemini-3-pro": 12.00 / 1000000,
    }
    return sum([costmap_in.get(_, 0)*TOKENS_IN[_] for _ in TOKENS_IN]) + sum([costmap_out.get(_, 0)*TOKENS_OUT[_] for _ in TOKENS_OUT])

def query_openrouter(model_str, prompt, system_prompt, temp=None):
    """Query models via OpenRouter API for multi-provider support"""
    openrouter_key = os.getenv('OPENROUTER_API_KEY')
    if not openrouter_key:
        raise Exception("OPENROUTER_API_KEY not set in environment")
    
    client = OpenAI(
        api_key=openrouter_key,
        base_url="https://openrouter.ai/api/v1"
    )
    
    model_id = OPENROUTER_MODELS.get(model_str, model_str)
    
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": prompt}
    ]
    
    kwargs = {"model": model_id, "messages": messages}
    if temp is not None:
        kwargs["temperature"] = temp
    
    completion = client.chat.completions.create(**kwargs)
    return completion.choices[0].message.content

def query_model(model_str, prompt, system_prompt, openai_api_key=None, gemini_api_key=None,  anthropic_api_key=None, tries=5, timeout=5.0, temp=None, print_cost=True, version="1.5", agent_name=None):
    preloaded_api = os.getenv('OPENAI_API_KEY')
    if openai_api_key is None and preloaded_api is not None:
        openai_api_key = preloaded_api
    if openai_api_key is None and anthropic_api_key is None:
        raise Exception("No API key provided in query_model function")
    if openai_api_key is not None:
        openai.api_key = openai_api_key
        os.environ["OPENAI_API_KEY"] = openai_api_key
    if anthropic_api_key is not None:
        os.environ["ANTHROPIC_API_KEY"] = anthropic_api_key
    if gemini_api_key is not None:
        os.environ["GEMINI_API_KEY"] = gemini_api_key
    for _ in range(tries):
        try:
            # Route OpenRouter models first
            if model_str in OPENROUTER_MODELS:
                answer = query_openrouter(model_str, prompt, system_prompt, temp)
            elif model_str == "gpt-4o-mini" or model_str == "gpt4omini" or model_str == "gpt-4omini" or model_str == "gpt4o-mini":
                model_str = "gpt-4o-mini"
                messages = [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt}]
                if version == "0.28":
                    if temp is None:
                        completion = openai.ChatCompletion.create(
                            model=f"{model_str}",  # engine = "deployment_name".
                            messages=messages
                        )
                    else:
                        completion = openai.ChatCompletion.create(
                            model=f"{model_str}",  # engine = "deployment_name".
                            messages=messages, temperature=temp
                        )
                else:
                    client = OpenAI()
                    if temp is None:
                        completion = client.chat.completions.create(
                            model="gpt-4o-mini-2024-07-18", messages=messages, )
                    else:
                        completion = client.chat.completions.create(
                            model="gpt-4o-mini-2024-07-18", messages=messages, temperature=temp)
                answer = completion.choices[0].message.content

            elif model_str == "gemini-2.0-pro":
                genai.configure(api_key=gemini_api_key)
                model = genai.GenerativeModel(model_name="gemini-2.0-pro-exp-02-05", system_instruction=system_prompt)
                answer = model.generate_content(prompt).text
            elif model_str == "gemini-1.5-pro":
                genai.configure(api_key=gemini_api_key)
                model = genai.GenerativeModel(model_name="gemini-1.5-pro", system_instruction=system_prompt)
                answer = model.generate_content(prompt).text
            elif model_str == "o3-mini":
                model_str = "o3-mini"
                messages = [
                    {"role": "user", "content": system_prompt + prompt}]
                if version == "0.28":
                    completion = openai.ChatCompletion.create(
                        model=f"{model_str}",  messages=messages)
                else:
                    client = OpenAI()
                    completion = client.chat.completions.create(
                        model="o3-mini-2025-01-31", messages=messages)
                answer = completion.choices[0].message.content

            elif model_str == "claude-3.5-sonnet":
                client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
                message = client.messages.create(
                    model="claude-3-5-sonnet-latest",
                    system=system_prompt,
                    messages=[{"role": "user", "content": prompt}])
                answer = json.loads(message.to_json())["content"][0]["text"]
            elif model_str == "gpt4o" or model_str == "gpt-4o":
                model_str = "gpt-4o"
                messages = [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt}]
                if version == "0.28":
                    if temp is None:
                        completion = openai.ChatCompletion.create(
                            model=f"{model_str}",  # engine = "deployment_name".
                            messages=messages
                        )
                    else:
                        completion = openai.ChatCompletion.create(
                            model=f"{model_str}",  # engine = "deployment_name".
                            messages=messages, temperature=temp)
                else:
                    client = OpenAI()
                    if temp is None:
                        completion = client.chat.completions.create(
                            model="gpt-4o-2024-08-06", messages=messages, )
                    else:
                        completion = client.chat.completions.create(
                            model="gpt-4o-2024-08-06", messages=messages, temperature=temp)
                answer = completion.choices[0].message.content
            elif model_str == "deepseek-chat":
                model_str = "deepseek-chat"
                messages = [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt}]
                if version == "0.28":
                    raise Exception("Please upgrade your OpenAI version to use DeepSeek client")
                else:
                    deepseek_client = OpenAI(
                        api_key=os.getenv('DEEPSEEK_API_KEY'),
                        base_url="https://api.deepseek.com/v1"
                    )
                    if temp is None:
                        completion = deepseek_client.chat.completions.create(
                            model="deepseek-chat",
                            messages=messages)
                    else:
                        completion = deepseek_client.chat.completions.create(
                            model="deepseek-chat",
                            messages=messages,
                            temperature=temp)
                answer = completion.choices[0].message.content
            elif model_str == "o1-mini":
                model_str = "o1-mini"
                messages = [
                    {"role": "user", "content": system_prompt + prompt}]
                if version == "0.28":
                    completion = openai.ChatCompletion.create(
                        model=f"{model_str}",  # engine = "deployment_name".
                        messages=messages)
                else:
                    client = OpenAI()
                    completion = client.chat.completions.create(
                        model="o1-mini-2024-09-12", messages=messages)
                answer = completion.choices[0].message.content
            elif model_str == "o1":
                model_str = "o1"
                messages = [
                    {"role": "user", "content": system_prompt + prompt}]
                if version == "0.28":
                    completion = openai.ChatCompletion.create(
                        model="o1-2024-12-17",  # engine = "deployment_name".
                        messages=messages)
                else:
                    client = OpenAI()
                    completion = client.chat.completions.create(
                        model="o1-2024-12-17", messages=messages)
                answer = completion.choices[0].message.content
            elif model_str == "o1-preview":
                model_str = "o1-preview"
                messages = [
                    {"role": "user", "content": system_prompt + prompt}]
                if version == "0.28":
                    completion = openai.ChatCompletion.create(
                        model=f"{model_str}",  # engine = "deployment_name".
                        messages=messages)
                else:
                    client = OpenAI()
                    completion = client.chat.completions.create(
                        model="o1-preview", messages=messages)
                answer = completion.choices[0].message.content

            try:
                if model_str in ["o1-preview", "o1-mini", "claude-3.5-sonnet", "o1", "o3-mini"]:
                    encoding = tiktoken.encoding_for_model("gpt-4o")
                elif model_str in ["deepseek-chat"]:
                    encoding = tiktoken.encoding_for_model("cl100k_base")
                else:
                    try:
                        encoding = tiktoken.encoding_for_model(model_str)
                    except KeyError:
                        encoding = tiktoken.get_encoding("cl100k_base")
                if model_str not in TOKENS_IN:
                    TOKENS_IN[model_str] = 0
                    TOKENS_OUT[model_str] = 0
                tokens_in = len(encoding.encode(system_prompt + prompt))
                tokens_out = len(encoding.encode(answer))
                TOKENS_IN[model_str] += tokens_in
                TOKENS_OUT[model_str] += tokens_out
                
                # Log cost for agent if agent_name is provided
                if agent_name:
                    log_agent_cost(agent_name, model_str, tokens_in, tokens_out)
                
                if print_cost:
                    print(f"Current experiment cost = ${curr_cost_est()}, ** Approximate values, may not reflect true cost")
            except Exception as e:
                if print_cost: print(f"Cost approximation has an error? {e}")
            return answer
        except Exception as e:
            print("Inference Exception:", e)
            time.sleep(timeout)
            continue
    raise Exception("Max retries: timeout")


#print(query_model(model_str="o1-mini", prompt="hi", system_prompt="hey"))
