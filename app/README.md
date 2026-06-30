# SpatialViz - 高性能空间转录组数据可视化工程

本项目提供了一套完整的**千万级细胞空间转录组数据 Web 可视化方案**。采用二进制数据分块加载与 WebGL 渲染技术，实现流畅的 3D/2D 空间视图、UMAP 降维视图、切片浏览及基因表达热力图展示。

## 📁 工程文件结构

```text
spatial-viz/
├── data/                  # [数据目录] 存放运行时所需的二进制数据块与配置文件
│   ├── config.json        #   元数据配置：聚类信息、切片数量、Chunk 文件列表等
│   └── chunk_*.bin        #   空间与表达数据：按 50 万细胞/块分割的二进制流
├── scripts/               # [脚本目录] 数据预处理与格式转换工具
│   ├── h5ad_to_bin.py     #   h5ad -> Bin 转换脚本
│   ├── generate_10m_v2.py #   测试数据生成脚本
│   └── README.md          #   脚本使用说明与数据格式规范
├── index.html             # [核心前端] 基于 Three.js 的可视化交互界面
└── README.md              #   工程说明文档
```

## 🚀 快速开始

1. **数据准备**：将单细胞 `h5ad` 文件转换为项目所需的二进制格式。
   ```bash
   python3 scripts/h5ad_to_bin.py --input your_data.h5ad --output data/
   ```
2. **启动服务**：在工程根目录启动本地 HTTP 服务以支持前端数据加载。
   ```bash
   python3 -m http.server 8080
   ```
3. **访问页面**：打开浏览器访问 `http://localhost:8080`。

## 📦 核心功能

| 功能模块 | 描述 |
|----------|------|
| **Spatial 3D / 2D** | 支持全量 3D 视图与特定 Z 轴切片 2D 视图的无缝切换 |
| **UMAP 2D** | 一键切换至降维聚类空间，查看细胞亚群分布 |
| **Slice Selector** | 左侧悬浮栏支持按切片（芯片层）过滤展示细胞 |
| **Gene Expression** | 实时输入基因名，渲染蓝-红渐变表达热力图 |
| **Cluster Legend** | 交互式图例，支持点击隐藏/高亮特定聚类 |
| **千万级性能** | `Float32Array` 内存池管理 + `Promise.all` 并行预加载 |

## ⚠️ 注意事项

- **浏览器性能**：建议至少 8GB 内存的现代浏览器（Chrome/Edge/Firefox）以流畅渲染千万级点云。
- **数据路径**：`config.json` 中的 `chunks` 路径需与 `data/` 目录下的文件名完全一致。
- **格式对齐**：二进制数据必须严格遵循 `[x, y, z, u1, u2, cidx, gene_exp]` 的 7 浮点数顺序。
