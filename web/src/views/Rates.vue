<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { fetchRates, type RateMatrix } from '../api';
import { formatTerm } from '../format';

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

function cellText(matrix: RateMatrix | null, bank: string, term: number): string {
  const row = matrix?.rows.find((r) => r.bank === bank);
  const cell = row?.rates[term];
  if (!cell) return '—';
  const min = cell.yieldMin.toFixed(2);
  const max = cell.yieldMax.toFixed(2);
  return min === max ? `${min}%` : `${min}%~${max}%`;
}

// 找出每列中的最高利率，用于高亮
function isBest(matrix: RateMatrix | null, bank: string, term: number): boolean {
  if (!matrix) return false;
  const vals = matrix.rows
    .map((r) => r.rates[term]?.yieldMax)
    .filter((v): v is number => typeof v === 'number');
  if (vals.length === 0) return false;
  const max = Math.max(...vals);
  const cell = matrix.rows.find((r) => r.bank === bank)?.rates[term];
  return !!cell && cell.yieldMax === max;
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
      description="按银行对比 1年 / 2年 / 3年 / 5年 整存整取定期存款，以及大额存单利率；每列最高利率已高亮。"
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
            <span :class="{ best: isBest(deposit, row.bank, term) }">
              {{ cellText(deposit, row.bank, term) }}
            </span>
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
            <span :class="{ best: isBest(cd, row.bank, term) }">
              {{ cellText(cd, row.bank, term) }}
            </span>
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
.hint {
  margin-left: 8px;
  color: #909399;
  font-size: 13px;
}
</style>
