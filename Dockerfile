FROM nginx:1.27-alpine

LABEL org.opencontainers.image.title="SpatialViz Brain Atlas"
LABEL org.opencontainers.image.description="Spatial transcriptomics web viewer with Nginx byte-range data service"

WORKDIR /usr/share/nginx/html

RUN rm -rf /usr/share/nginx/html/* \
    && mkdir -p /usr/share/nginx/html /data

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY docker/entrypoint.sh /docker-entrypoint.d/99-spatial-viz-data-links.sh
COPY app/ /usr/share/nginx/html/

RUN chmod +x /docker-entrypoint.d/99-spatial-viz-data-links.sh

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1/healthz >/dev/null || exit 1
