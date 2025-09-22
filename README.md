# Junior Full-Stack Developer - 2-Day Technical Assessment - Hassan Abouelela

```mermaid
flowchart LR
    U[User Browser] -->|HTTPS| FE[Frontend NextJS]
    FE -->|API calls| ING[Ingress]
    ING -->|/api| SVC[Backend Service]
    SVC --> API[FastAPI Backend]
    ING -->|/| SVCF[Frontend Service]
    SVCF --> Next[Next.js Frontend]
    API -->|Agno| OpenAI[AI Chatbots]
    API --> ORM[SQLAlchemy]
    ORM --> DB[Postgres Database]
    ATLAS[Atlas Migration Tool] --> DB

    subgraph CI_CD [CI CD]
        GIT[Git Repository] --> CI[Build and Test]
        CI --> REG[Container Registry]
        REG --> DEPLOY[Deploy]
    end

    subgraph K8s [Kubernetes Cluster minikube or managed]
        FE
        ING
        SVC
        API
        OpenAI
        SVCF
        Next
        ORM
        DB
        ATLAS
    end

    DEPLOY -->|Apply manifests| K8s
```

# AI Usage

A note on AI usage:

This project made heavy use of AI to generate and modify code, however I reviewed all the code,
and made architectural decisions that the AI could not.
I tested and debugged, and ensured the product meets high standards.
AI was used as a tool to accelerate development, rather than create the entire project.

# TODO

- [ ] ShadCDN not used
- [ ] Dependency scanning

# Future Expansions

- [ ] Flesh out the backend test suite, and add frontend testsing
- [ ] Use terraform to manage the deployment of the production hosts
- [ ] Migrate from minikube to a more mature offering
