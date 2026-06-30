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

defineProps<{ items: Product[]; loading?: boolean; showScore?: boolean }>();

// 不可买的行整体置灰
function rowClass({ row }: { row: Product }): string {
  return isAvailable(row.status) ? '' : 'row-unavailable';
}
</script>

<template>
  <el-table
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
</style>
