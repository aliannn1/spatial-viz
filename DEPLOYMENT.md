# SpatialViz Deployment

This repository contains the SpatialViz web application and Docker deployment files.

Default local deployment URL:

```text
http://localhost:8123/spatial-viz/
```

## Contents

```text
.
├── Dockerfile
├── docker-compose.yml
├── .dockerignore
├── .gitignore
├── DEPLOYMENT.md
├── README.md
├── app/
│   ├── index.html
│   ├── viewer.html
│   ├── app.js
│   ├── style.css
│   ├── datasets.config.json
│   ├── README.md
│   └── serve.py
├── docker/
│   ├── nginx.conf
│   └── entrypoint.sh
└── data/
    └── README.md
```

## Run

```bash
docker compose up -d --build
```

## Notes

- This repository does not include the large runtime dataset directories.
- Runtime datasets should be mounted into `./data` or another directory pointed to by `SPATIALVIZ_DATA_DIR`.
- The application is served under the `/spatial-viz/` path prefix.
