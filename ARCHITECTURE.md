# LegalLens System Architecture

```mermaid
graph TD
    %% --- Definitions ---
    subgraph Browser["Browser (Chrome)"]
        User(("👤 User"))
        style User fill:#fff,stroke:#333,stroke-width:2px
        
        subgraph Extension["Chrome Extension (Manifest V3)"]
            ContentScript["🔍 Content Script<br/>(Detects Keywords)"]
            PopupUI["⚖️ Popup UI<br/>(Displays Results)"]
        end
    end

    subgraph Backend["Python Backend (Localhost)"]
        FastAPI["🚀 FastAPI Server"]
        
        subgraph Observability["Observability Layer"]
            Middleware["📝 Middleware<br/>(TraceIDs & Metrics)"]
        end
        
        subgraph AgentLogic["AI Agent Brain"]
            PromptEng["🧠 Context Engineering<br/>(Persona & Rubric)"]
            Pydantic["🛡️ Pydantic Schema<br/>(Enforces JSON)"]
        end
    end

    Gemini("🤖 Google Gemini API<br/>(Model: 2.5 Flash)")
    style Gemini fill:#34a853,stroke:#333,stroke-width:1px,color:white

    %% --- Data Flow ---
    User --"1. Visits URL"--> ContentScript
    ContentScript --"2. Detects Contract"--> PopupUI
    User --"3. Clicks Analyze"--> PopupUI
    PopupUI --"4. POST /analyze"--> FastAPI
    
    FastAPI --> Middleware
    Middleware --> PromptEng
    PromptEng --"5. Sends Prompt"--> Gemini
    
    Gemini --"6. Returns JSON"--> Pydantic
    Pydantic --"7. Validated Data"--> FastAPI
    FastAPI --"8. Returns Analysis"--> PopupUI
    PopupUI --"9. Renders Score"--> User

    %% --- Styling ---
    linkStyle 3 stroke:#2563eb,stroke-width:2px;
    linkStyle 9 stroke:#2563eb,stroke-width:2px;
    linkStyle 6 stroke:#34a853,stroke-width:2px;
    linkStyle 7 stroke:#34a853,stroke-width:2px;