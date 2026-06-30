<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { fetchCoverage, type CoverageReport, type CoverageCell } from '../api';

const coverage = ref<CoverageReport | null>(null);
const expanded = ref(false);
const loading = ref(false);
const error = ref<string | null>(null);

async function load() {
  loading.value = true;
  error.value = null;
  try {
    coverage.value = await fetchCoverage();
    // 有缺失时默认展开
    if (coverage.value && coverage.value.totalMissing > 0) expanded.value = true;
  } catch (e) {
    error.value = (e as Error).message;
  } finally {
    loading.value = false;
  }
}

onMounted(load);

function cellClass(c: CoverageCell): string {
  if (c.missing) return 'cell-missing';
  if (c.reliability === '低') return 'cell-stale';
  return 'cell-ok';
}

function row(b: string): CoverageCell[] {
  if (!coverage.value) return [];
  return coverage.value.matrix.filter((c) => c.bank === b);
}

function cellHint(c: CoverageCell): string {
  if (c.missing) return c.suggestion;
  const parts: string[] = [`${c.count} 条真实`];
  if (c.sources.length) parts.push(`来源:${c.sources.join(' / ')}`);
  if (c.lastDataDate) parts.push(`日期 ${c.lastDataDate}`);
  if (c.reliability !== '高') parts.push(`可靠:${c.reliability}`);
  return parts.join(' · ');
}

function refresh() {
  load();
}
</script>

<template>
  <section v-if="coverage" class="cov">
    <header class="cov-head" @click="expanded = !expanded">
      <div class="cov-title">
        <el-tag v-if="coverage.totalMissing > 0" type="danger" size="small" effect="dark">
          缺 {{ coverage.totalMissing }}/{{ coverage.totalCells }} 格
        </el-tag>
        <el-tag v-else type="success" size="small" effect="dark">数据齐全</el-tag>
        <span class="hint">
          数据源真爬取 · 5 家银行 × 4 类产品（活期/定期理财、定期存款、大额存单）
        </span>
      </div>
      <div class="right">
        <span v-if="coverage.lastUpdated" class="ts">
          最后更新: {{ new Date(coverage.lastUpdated).toLocaleString('zh-CN') }}
        </span>
        <el-button text size="small" @click.stop="refresh" :loading="loading">
          刷新
        </el-button>
        <el-button text size="small">{{ expanded ? '收起' : '展开' }}</el-button>
      </div>
    </header>

    <el-alert
      v-if="coverage.totalMissing > 0"
      type="warning"
      :closable="false"
      show-icon
      class="alert"
    >
      <div class="alert-text">
        下列 ⚠️ 缺失格没有自动抓到的真实数据，请到对应银行官网/App 截图当前挂牌信息，
        再到 <code>/server/src/crawler/adapters/</code> 编辑适配器并重跑 <code>npm run crawl</code>。
        其它格按列出的来源/日期判断可信度。
      </div>
    </el-alert>

    <div v-show="expanded" class="matrix">
      <table>
        <thead>
          <tr>
            <th>银行 \ 类型</th>
            <th v-for="cat in coverage.categories" :key="cat">{{ cat }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="bank in coverage.banks" :key="bank">
            <td class="bank-col">{{ bank }}银行</td>
            <td v-for="c in row(bank)" :key="c.category" :class="cellClass(c)">
              <div class="cell-line">
                <span class="badge">
                  <template v-if="c.missing">⚠️ 缺</template>
                  <template v-else>{{ c.count }} 条</template>
                </span>
                <span v-if="c.reliability !== '未知'" class="rel" :data-rel="c.reliability">{{ c.reliability }}</span>
              </div>
              <div class="cell-hint">{{ cellHint(c) }}</div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
  <section v-else-if="error" class="cov err">
    数据覆盖报告加载失败: {{ error }}
  </section>
</template>

<style scoped>
.cov {
  margin: 0 0 16px 0;
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.04);
  overflow: hidden;
}
.cov.err { padding: 12px 16px; color: #c0392b; }
.cov-head {
  padding: 10px 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  background: #fafafa;
  border-bottom: 1px solid #f0f0f0;
}
.cov-title { display: flex; align-items: center; gap: 10px; }
.cov-title .hint { color: #888; font-size: 13px; }
.right { display: flex; align-items: center; gap: 8px; }
.ts { color: #999; font-size: 12px; }
.alert { margin: 12px 14px 0; }
.alert code { background: #f5f5f5; padding: 1px 5px; border-radius: 3px; font-size: 12px; }
.matrix { padding: 12px 14px 14px; overflow-x: auto; }
table { width: 100%; border-collapse: collapse; min-width: 720px; }
th, td {
  padding: 8px 10px;
  border: 1px solid #ebeef5;
  text-align: left;
  font-size: 13px;
  vertical-align: top;
}
thead th {
  background: #fafafa;
  font-weight: 600;
  color: #606266;
}
.bank-col { font-weight: 600; }
.cell-line { display: flex; gap: 6px; align-items: center; }
.badge {
  font-weight: 600;
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 3px;
  background: #f0f9eb;
  color: #67c23a;
}
.rel {
  font-size: 11px;
  padding: 1px 5px;
  border-radius: 3px;
  background: #f4f4f5;
  color: #909399;
}
.rel[data-rel="高"] { background: #f0f9eb; color: #67c23a; }
.rel[data-rel="中"] { background: #fdf6ec; color: #e6a23c; }
.rel[data-rel="低"] { background: #fef0f0; color: #f56c6c; }
.cell-hint {
  margin-top: 4px;
  color: #909399;
  font-size: 11px;
  line-height: 1.4;
}
.cell-missing {
  background: #fef0f0;
}
.cell-missing .badge {
  background: #fef0f0;
  color: #f56c6c;
}
.cell-missing .cell-hint {
  color: #e6807d;
}
.cell-stale {
  background: #fdf6ec;
}

@media (max-width: 768px) {
  .cov-head { flex-direction: column; align-items: stretch; gap: 6px; }
  .right { justify-content: space-between; }
  .ts { display: none; }
  .matrix { padding: 8px; }
  th, td { padding: 6px 8px; font-size: 12px; }
}
</style>