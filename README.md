# Junior Full-Stack Developer - 2-Day Technical Assessment - Hassan Abouelela

```mermaid
flowchart LR
    U[User Browser] -->|HTTPS| FE[Frontend NextJS]
    FE -->|API calls| ING[Ingress or Load Balancer]
    ING --> SVC[Service]
    SVC --> API[Backend API Python]
    API --> DB[Postgres Database]

    subgraph CI_CD [CI CD]
        GIT[Git Repository] --> CI[Build and Test]
        CI --> REG[Container Registry]
        REG --> DEPLOY[Deploy]
    end

    subgraph K8s [Kubernetes Cluster minikube or managed]
        ING
        SVC
        API
        DB
    end

    DEPLOY -->|Apply manifests| ING
```

# TODO

- [ ] ShadCDN not used
- [ ] Dependency scanning

# Future Expansions

- [ ] Flesh out the backend test suite, and add frontend testsing
- [ ] Use terraform to manage the deployment of the production hosts
- [ ] Migrate from minikube to a more mature offering
