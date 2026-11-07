# Taste

## Architecture

- Prefers explicitly modular project structure — one concern per module (config, schemas, routes/, services/) rather than a single monolithic file. Confidence: 0.75
- Wants the backend to own the whole pipeline behind one final endpoint: intermediate results (e.g. a model's predicted class) must not be returned to the frontend to be sent back. One request in, one finished payload out. Confidence: 0.8

## Workflow

- When asking a question ("how would I…", "where does X live"), wants an explanation only — do not edit or create files unless explicitly asked. Confidence: 0.7
