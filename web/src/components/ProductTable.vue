<script setup lang="ts">
import type { Product } from '../api';
import {
  formatYield,
  formatTerm,
  formatAmount,
  riskTagType,
  statusTagType,
  reliabilityTagType,
  dataYear,
  isAvailable,
} from '../format';
import { useIsMobile } from '../useIsMobile';

defineProps<{ items: Product[]; loading?: boolean; showScore?: boolean }>();

const { isMobile } = useIsMobile();

// 不可买的行整体置灰
function rowClass({ row }: { row: Product }): string {
  return isAvailable(row.status) ? '' : 'row-unavailable';
}
</script>

<template>
  <!-- 移动端：卡片列表 -->
  <div
    v-if="isMobile"
    v-loading="loading"
    class="card-list"
  >
    <div
      v-for="p in items"
      :key="p.id"
      class="p-card"
      :class="{ 'p-card-unavailable': !isAvailable(p.status) }"
    >
      <div class="p-card-head">
        <div class="p-card-name">
          {{ p.name }}
        </div>
        <el-tag
          :type="statusTagType(p.status)"
          size="small"
        >
          {{ p.status }}
        </el-tag>
      </div>
      <div class="p-card-yield-row">
        <span class="p-card-yield">{{ formatYield(p) }}</span>
        <span class="p-card-yieldtype">{{ p.yieldType }}</span>
        <el-tag
          v-if="showScore"
          type="warning"
          effect="plain"
          size="small"
        >
          推荐分 {{ p.score }}
        </el-tag>
      </div>
      <div class="p-card-tags">
        <el-tag size="small">
          {{ p.bank }}
        </el-tag>
        <el-tag
          type="info"
          size="small"
        >
          {{ p.category }}
        </el-tag>
        <el-tag
          :type="riskTagType(p.riskLevel)"
          size="small"
        >
          {{ p.riskLevel }}
        </el-tag>
      </div>
      <div class="p-card-meta">
        <span>期限 {{ formatTerm(p.termDays) }}</span>
        <span>{{ formatAmount(p.minAmount) }}</span>
      </div>
      <div class="p-card-foot">
        <span>数据年份 {{ dataYear(p.dataDate) }}</span>
        <el-tag
          :type="reliabilityTagType(p.reliability)"
          effect="plain"
          size="small"
        >
          可靠 {{ p.reliability }}
        </el-tag>
        <el-tag
          v-if="p.isSample"
          type="info"
          size="small"
        >
          示例
        </el-tag>
      </div>
    </div>
    <el-empty
      v-if="!items.length && !loading"
      description="暂无数据"
    />
  </div>

  <!-- 桌面端：表格 -->
  <el-table
    v-else
    v-loading="loading"
    :data="items"
    :row-class-name="rowClass"
    stripe
    style="width: 100%"
  >
    <el-table-column
      type="index"
      label="#"
      width="50"
    />
    <el-table-column
      prop="bank"
      label="银行"
      width="80"
    />
    <el-table-column
      prop="category"
      label="类型"
      width="100"
    />
    <el-table-column
      label="状态"
      width="90"
    >
      <template #default="{ row }">
        <el-tag
          :type="statusTagType(row.status)"
          size="small"
        >
          {{ row.status }}
        </el-tag>
      </template>
    </el-table-column>
    <el-table-column
      prop="name"
      label="产品名称"
      min-width="200"
      show-overflow-tooltip
    />
    <el-table-column
      label="收益率"
      width="120"
    >
      <template #default="{ row }">
        <span class="yield">{{ formatYield(row) }}</span>
      </template>
    </el-table-column>
    <el-table-column
      label="收益口径"
      width="120"
      prop="yieldType"
    />
    <el-table-column
      label="风险"
      width="100"
    >
      <template #default="{ row }">
        <el-tag
          :type="riskTagType(row.riskLevel)"
          size="small"
        >
          {{ row.riskLevel }}
        </el-tag>
      </template>
    </el-table-column>
    <el-table-column
      label="期限"
      width="90"
    >
      <template #default="{ row }">
        {{ formatTerm(row.termDays) }}
      </template>
    </el-table-column>
    <el-table-column
      label="起购"
      width="110"
    >
      <template #default="{ row }">
        {{ formatAmount(row.minAmount) }}
      </template>
    </el-table-column>
    <el-table-column
      v-if="showScore"
      label="推荐分"
      width="90"
    >
      <template #default="{ row }">
        <el-tag
          type="warning"
          effect="plain"
          size="small"
        >
          {{ row.score }}
        </el-tag>
      </template>
    </el-table-column>
    <el-table-column
      label="数据年份"
      width="90"
    >
      <template #default="{ row }">
        {{ dataYear(row.dataDate) }}
      </template>
    </el-table-column>
    <el-table-column
      label="可靠等级"
      width="100"
    >
      <template #default="{ row }">
        <el-tag
          :type="reliabilityTagType(row.reliability)"
          effect="plain"
          size="small"
        >
          {{ row.reliability }}
        </el-tag>
      </template>
    </el-table-column>
    <el-table-column
      label="来源"
      width="120"
    >
      <template #default="{ row }">
        <el-tag
          v-if="row.isSample"
          type="info"
          size="small"
        >
          示例
        </el-tag>
        <span
          v-else
          class="source"
        >{{ row.sourceName }}</span>
      </template>
    </el-table-column>
  </el-table>
</template>

<style scoped>
.yield {
  color: #c0392b;
  font-weight: 700;
}
.source {
  font-size: 12px;
  color: #666;
}
:deep(.row-unavailable) {
  color: #c0c4cc;
  background: #fafafa;
}
:deep(.row-unavailable) .yield {
  color: #c0c4cc;
}

/* 移动端卡片 */
.card-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.p-card {
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 10px;
  padding: 12px;
}
.p-card-unavailable {
  background: #fafafa;
  opacity: 0.7;
}
.p-card-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
}
.p-card-name {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  line-height: 1.3;
}
.p-card-yield-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin: 8px 0;
  flex-wrap: wrap;
}
.p-card-yield {
  font-size: 22px;
  font-weight: 800;
  color: #c0392b;
}
.p-card-yieldtype {
  font-size: 12px;
  color: #909399;
}
.p-card-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.p-card-meta {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  color: #606266;
  font-size: 13px;
}
.p-card-foot {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed #ebeef5;
  color: #909399;
  font-size: 12px;
}
</style>
