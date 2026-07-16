"""
GENESIS-4 Universal LLM Provider System
Supports ALL providers on earth — user brings API keys, selects any model

Built-in providers:
- OpenRouter (300+ models, unified API)
- OpenAI (GPT-4o, GPT-4, o1, o3, etc.)
- Anthropic (Claude 3.5/4 Opus/Sonnet/Haiku)
- Google (Gemini 2.0 Flash/Pro, Gemini 2.5)
- NVIDIA NIM (Llama Nemotron, Cosmos Reason)
- Groq (fast open-source inference)
- HuggingFace Inference
- Together AI
- Fireworks AI
- DeepSeek
- Mistral
- Cohere
- Replicate
- xAI (Grok)
- Custom OpenAI-compatible endpoint (any URL)
"""

import os
import json
import httpx
from typing import AsyncIterator

# ── Provider Registry ───────────────────────────────────
PROVIDERS = {
    "openrouter": {
        "name": "OpenRouter",
        "base_url": "https://openrouter.ai/api/v1",
        "models_url": "https://openrouter.ai/api/v1/models",
        "auth_header": "Authorization",
        "auth_prefix": "Bearer ",
        "chat_endpoint": "/chat/completions",
        "models_key": "data",
        "model_id_key": "id",
        "model_name_key": "name",
        "description": "Unified API for 300+ models. One key, all models.",
    },
    "openai": {
        "name": "OpenAI",
        "base_url": "https://api.openai.com/v1",
        "models_url": "https://api.openai.com/v1/models",
        "auth_header": "Authorization",
        "auth_prefix": "Bearer ",
        "chat_endpoint": "/chat/completions",
        "models_key": "data",
        "model_id_key": "id",
        "model_name_key": "id",
        "description": "GPT-4o, GPT-4, o1, o3, and more.",
    },
    "anthropic": {
        "name": "Anthropic",
        "base_url": "https://api.anthropic.com/v1",
        "models_url": "https://api.anthropic.com/v1/models",
        "auth_header": "x-api-key",
        "auth_prefix": "",
        "chat_endpoint": "/messages",
        "models_key": "data",
        "model_id_key": "id",
        "model_name_key": "display_name",
        "description": "Claude 3.5/4 Opus, Sonnet, Haiku.",
        "format": "anthropic",
    },
    "gemini": {
        "name": "Google Gemini",
        "base_url": "https://generativelanguage.googleapis.com/v1beta",
        "models_url": "https://generativelanguage.googleapis.com/v1beta/models",
        "auth_header": "x-goog-api-key",
        "auth_prefix": "",
        "chat_endpoint": "/models/{model}:generateContent",
        "stream_endpoint": "/models/{model}:streamGenerateContent",
        "models_key": "models",
        "model_id_key": "name",
        "model_name_key": "displayName",
        "description": "Gemini 2.0 Flash, 2.5 Pro, 2.5 Flash. Generous free tier.",
        "format": "gemini",
    },
    "nvidia_nim": {
        "name": "NVIDIA NIM",
        "base_url": "https://integrate.api.nvidia.com/v1",
        "models_url": "https://integrate.api.nvidia.com/v1/models",
        "auth_header": "Authorization",
        "auth_prefix": "Bearer ",
        "chat_endpoint": "/chat/completions",
        "models_key": "data",
        "model_id_key": "id",
        "model_name_key": "id",
        "description": "Llama Nemotron, Cosmos Reason, and NVIDIA-optimized models.",
    },
    "groq": {
        "name": "Groq",
        "base_url": "https://api.groq.com/openai/v1",
        "models_url": "https://api.groq.com/openai/v1/models",
        "auth_header": "Authorization",
        "auth_prefix": "Bearer ",
        "chat_endpoint": "/chat/completions",
        "models_key": "data",
        "model_id_key": "id",
        "model_name_key": "id",
        "description": "Fastest inference. Llama, Mixtral, Gemma.",
    },
    "huggingface": {
        "name": "HuggingFace",
        "base_url": "https://api-inference.huggingface.co/models",
        "models_url": "https://huggingface.co/api/models?pipeline_tag=text-generation&sort=downloads&direction=-1&limit=100",
        "auth_header": "Authorization",
        "auth_prefix": "Bearer ",
        "chat_endpoint": "/{model}/v1/chat/completions",
        "models_key": None,
        "model_id_key": "id",
        "model_name_key": "id",
        "description": "Thousands of open-source models. Free inference tier.",
        "format": "openai",
    },
    "together": {
        "name": "Together AI",
        "base_url": "https://api.together.xyz/v1",
        "models_url": "https://api.together.xyz/v1/models",
        "auth_header": "Authorization",
        "auth_prefix": "Bearer ",
        "chat_endpoint": "/chat/completions",
        "models_key": "data",
        "model_id_key": "id",
        "model_name_key": "display_name",
        "description": "Fast open-source model inference.",
    },
    "fireworks": {
        "name": "Fireworks AI",
        "base_url": "https://api.fireworks.ai/inference/v1",
        "models_url": "https://api.fireworks.ai/inference/v1/models",
        "auth_header": "Authorization",
        "auth_prefix": "Bearer ",
        "chat_endpoint": "/chat/completions",
        "models_key": "data",
        "model_id_key": "id",
        "model_name_key": "id",
        "description": "Blazing fast inference for open models.",
    },
    "deepseek": {
        "name": "DeepSeek",
        "base_url": "https://api.deepseek.com/v1",
        "models_url": "https://api.deepseek.com/v1/models",
        "auth_header": "Authorization",
        "auth_prefix": "Bearer ",
        "chat_endpoint": "/chat/completions",
        "models_key": "data",
        "model_id_key": "id",
        "model_name_key": "id",
        "description": "DeepSeek-V3, DeepSeek-R1. Affordable, powerful.",
    },
    "mistral": {
        "name": "Mistral AI",
        "base_url": "https://api.mistral.ai/v1",
        "models_url": "https://api.mistral.ai/v1/models",
        "auth_header": "Authorization",
        "auth_prefix": "Bearer ",
        "chat_endpoint": "/chat/completions",
        "models_key": "data",
        "model_id_key": "id",
        "model_name_key": "id",
        "description": "Mistral Large, Small, Codestral.",
    },
    "cohere": {
        "name": "Cohere",
        "base_url": "https://api.cohere.com/v2",
        "models_url": "https://api.cohere.com/v2/models",
        "auth_header": "Authorization",
        "auth_prefix": "Bearer ",
        "chat_endpoint": "/chat",
        "models_key": "models",
        "model_id_key": "name",
        "model_name_key": "name",
        "description": "Command R+, Command R. Enterprise-grade.",
        "format": "cohere",
    },
    "replicate": {
        "name": "Replicate",
        "base_url": "https://api.replicate.com/v1",
        "models_url": "https://api.replicate.com/v1/models",
        "auth_header": "Authorization",
        "auth_prefix": "Bearer ",
        "chat_endpoint": "/models/{model}/predictions",
        "models_key": "results",
        "model_id_key": "url",
        "model_name_key": "name",
        "description": "Run any model. Pay per prediction.",
        "format": "replicate",
    },
    "xai": {
        "name": "xAI (Grok)",
        "base_url": "https://api.x.ai/v1",
        "models_url": "https://api.x.ai/v1/models",
        "auth_header": "Authorization",
        "auth_prefix": "Bearer ",
        "chat_endpoint": "/chat/completions",
        "models_key": "data",
        "model_id_key": "id",
        "model_name_key": "id",
        "description": "Grok-3, Grok-2. xAI's models.",
    },
    "custom": {
        "name": "Custom Endpoint",
        "base_url": "",
        "models_url": "",
        "auth_header": "Authorization",
        "auth_prefix": "Bearer ",
        "chat_endpoint": "/chat/completions",
        "models_key": "data",
        "model_id_key": "id",
        "model_name_key": "id",
        "description": "Any OpenAI-compatible API. Bring your own URL.",
        "format": "openai",
    },
}


class LLMProvider:
    """Universal LLM provider manager for GENESIS-4"""

    def __init__(self):
        self.active_provider = "g