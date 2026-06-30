<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { fetchRates, type RateMatrix, type RateCell } from '../api';
import { formatTerm, reliabilityTagType, dataYear, isAvailable } from '../format';

const deposit = ref<RateMatrix | null>(null);
const cd = ref<RateMatrix | null>(null);
const loading = ref(false);

onMounted(async () => {
  loading.value = true;
  try {
    const res = await fetchRates();
    deposit.value = res.deposit;
    cd.value = res.cd;
  } finally {
    loading.value = false;
  }
});

function getCell(matrix: RateMatrix | null, bank: string, term: number): RateCell | undefined {
  return matrix?.rows.find((r) => r.bank === bank)?.rates[term];
}

function cellText(matrix: RateMatrix | null, bank: string, term: number): string {
  const cell = getCell(matrix, bank, term);
  if (!cell) return '—';
  const min = cell.yieldMin.toFixed(2);
  const max = cell.yieldMax.toFixed(2);
  return min === max ? `${min}%` : `${min}%~${max}%`;
}

// 找出每列中「在售」产品的最高利率用于高亮（不可买的不参与「最优」）
function isBest(matrix: RateMatrix | null, bank: string, term: number): boolean {
  if (!matrix) return false;
  const vals = matrix.rows
    .map((r) => r.rates[term])
    .filter((c): c is RateCell => !!c && isAvailable(c.status))
    .map((c) => c.yieldMax);
  if (vals.length === 0) return false;
  const max = Math.max(...vals);
  const cell = getCell(matrix, bank, term);
  return !!cell && isAvailable(cell.status) && cell.yieldMax === max;
}

function cellUnavailable(matrix: RateMatrix | null, bank: string, term: number): string {
  const cell = getCell(matrix, bank, term);
  return cell && !isAvailable(cell.status) ? cell.status : '';
}

const depositSample = computed(() => deposit.value?.rows.some((r) => r.isSample) ?? false);
</script>

<template>
  <div v-loading="loading">
    <el-alert
      type="warning"
      :closable="false"
      show-icon
      title="存款利率一览（年化）"
      description="按银行对比 1年 / 2年 / 3年 / 5年 整存整取定期存款及大额存单利率；每列「在售」最高利率高亮，不可买（售罄/已下架/待售）划线标记。每行标注数据年份与可靠等级（高=官方源，中=第三方，低=示例）。"
      style="margin-bottom: 16px"
    />

    <el-card
      shadow="never"
      style="margin-bottom: 16px"
    >
      <template #header>
        <b>整存整取定期存款利率</b>
        <el-tag
          v-if="depositSample"
          type="info"
          size="small"
          style="margin-left: 8px"
        >
          示例
        </el-tag>
      </template>
      <el-table
        :data="deposit?.rows || []"
        stripe
        style="width: 100%"
      >
        <el-table-column
          prop="bank"
          label="银行"
          width="120"
          fixed
        />
        <el-table-column
          v-for="term in deposit?.terms || []"
          :key="term"
          :label="formatTerm(term)"
          align="center"
        >
          <template #default="{ row }">
            <span
              :class="{
                best: isBest(deposit, row.bank, term),
                unavailable: !!cellUnavailable(deposit, row.bank, term),
              }"
            >
              {{ cellText(deposit, row.bank, term) }}
            </span>
            <span
              v-if="cellUnavailable(deposit, row.bank, term)"
              class="status-mark"
            >
              {{ cellUnavailable(deposit, row.bank, term) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column
          label="数据年份"
          width="100"
          align="center"
        >
          <template #default="{ row }">
            {{ dataYear(row.dataDate) }}
          </template>
        </el-table-column>
        <el-table-column
          label="可靠等级"
          width="110"
          align="center"
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
      </el-table>
    </el-card>

    <el-card shadow="never">
      <template #header>
        <b>大额存单利率</b>
        <span class="hint">（20 万元起购）</span>
      </template>
      <el-table
        :data="cd?.rows || []"
        stripe
        style="width: 100%"
      >
        <el-table-column
          prop="bank"
          label="银行"
          width="120"
          fixed
        />
        <el-table-column
          v-for="term in cd?.terms || []"
          :key="term"
          :label="formatTerm(term)"
          align="center"
        >
          <template #default="{ row }">
            <span
              :class="{
                best: isBest(cd, row.bank, term),
                unavailable: !!cellUnavailable(cd, row.bank, term),
              }"
            >
              {{ cellText(cd, row.bank, term) }}
            </span>
            <span
              v-if="cellUnavailable(cd, row.bank, term)"
              class="status-mark"
            >
              {{ cellUnavailable(cd, row.bank, term) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column
          label="数据年份"
          width="100"
          align="center"
        >
          <template #default="{ row }">
            {{ dataYear(row.dataDate) }}
          </template>
        </el-table-column>
        <el-table-column
          label="可靠等级"
          width="110"
          align="center"
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
      </el-table>
    </el-card>
  </div>
</template>

<style scoped>
.best {
  color: #c0392b;
  font-weight: 700;
}
.unavailable {
  color: #c0c4cc;
  text-decoration: line-through;
}
.status-mark {
  margin-left: 4px;
  font-size: 11px;
  color: #909399;
}
.hint {
  margin-left: 8px;
  color: #909399;
  font-size: 13px;
}
</style>
