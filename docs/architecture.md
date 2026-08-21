# RecoverAI — Full System Architecture

```
                                    +-----------------------+
                                    | Merchant Dashboard UI |
                                    | (React 19 / Vite 8)   |
                                    +-----------+-----------+
                                                |
                                                v  HTTP / REST API (JWT Authenticated)
                                    +-----------+-----------+
                                    |   Express API Router  |
                                    | (Helmet, CORS, Rate)  |
                                    +-----------+-----------+
                                                |
                                                v
                                  +-------------+-------------+
                                  |   Recovery Orchestrator   |
                                  +-------------+-------------+
                                                |
                  +-----------------------------+-----------------------------+
                  |                             |                             |
                  v                             v                             v
        +------------------+          +-------------------+         +-------------------+
        | Risk Scoring     |          | AI Decision Engine|         | Recovery Policy   |
        | Engine (0-100)   |          | (Gemini 2.5 REST) |         | Engine (Auth)     |
        +------------------+          +---------+---------+         +---------+---------+
                                                |                             |
                                                +--------------+--------------+
                                                               |
                                                               v  Allowed Actions Only
                                                    +----------+----------+
                                                    |  Action Executor    |
                                                    +----------+----------+
                                                               |
                                            +------------------+------------------+
                                            |                                     |
                                            v                                     v
                             +--------------+--------------+       +--------------+--------------+
                             | Razorpay Test Mode SDK      |       | Deterministic Simulation     |
                             | (Orders & Payment Links)    |       | Provider (Batch Benchmark)   |
                             +--------------+--------------+       +--------------+--------------+
                                            |                                     |
                                            +------------------+------------------+
                                                               |
                                                               v
                                                    +----------+----------+
                                                    | Razorpay Webhook    |
                                                    | (HMAC SHA256 Check) |
                                                    +----------+----------+
                                                               |
                                                               v
                                                    +----------+----------+
                                                    | Recovery State      |
                                                    | Machine Update      |
                                                    +----------+----------+
                                                               |
                                                               v
                                                    +----------+----------+
                                                    | Immutable Audit Log |
                                                    | (MongoDB Mongoose)  |
                                                    +---------------------+
```

## Security & Architectural Guarantees
1. **AI Model Boundary:** Gemini AI generates recommendations ONLY. The Policy Engine remains authoritative and can block AI recommendations.
2. **Payment Verification:** Case status becomes `RECOVERED` ONLY upon HMAC-verified Razorpay webhooks or verified simulation.
3. **No Floating Point Money:** All internal money representation uses integer paise.
