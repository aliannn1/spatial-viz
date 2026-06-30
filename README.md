# SpatialViz

SpatialViz is a static web application for browsing large spatial transcriptomics datasets.

This repository includes:

- the web frontend source
- the local preview server
- Docker deployment files for `/spatial-viz/`

It does not include the large runtime dataset folders.

## Structure

```text
.
├── app/
├── docker/
├── data/
├── Dockerfile
├── docker-compose.yml
├── README.md
└── DEPLOYMENT.md
```

## Local Preview

The included preview server is in `app/serve.py`.

## Docker

Start with:

```bash
docker compose up -d --build
```

Then open:

```text
http://localhost:8123/spatial-viz/
```
