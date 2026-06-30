# Runtime Data Directory

Put runtime datasets here when deploying on a new server.

Expected layout:

```text
data/
├── datasets.config.json
├── marmoset_cortex_no_NA_allgenes_uint8/
│   ├── config.json
│   ├── stats.json
│   ├── chunk_000.bin
│   └── expression/
│       ├── genes.json
│       ├── chunk_000.expr.bin
│       └── chunk_000.expr.index.json
└── other_dataset_id/
```

At container startup, every dataset folder in this directory is symlinked into
the Nginx web root. If `data/datasets.config.json` exists, it replaces the
packaged default config.
