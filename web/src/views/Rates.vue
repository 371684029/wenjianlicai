<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { fetchRates, type RateMatrix, type RateCell } from '../api';
import { formatTerm, reliabilityTagType, dataYear, isAvailable } from '../format';
import { useIsMobile } from '../useIsMobile';

const { isMobile } = useIsMobile();

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

// 移动端：两类利率统一渲染
const matrices = computed(() => [
  { title: '整存整取定期存款利率', hint: '', m: deposit.value },
  { title: '大额存单利率', hint: '（20 万元起购）', m: cd.value },
]);
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

    <!-- 移动端：按银行卡片 -->
    <template v-if="isMobile">
      <el-card
        v-for="grp in matrices"
        :key="grp.title"
        shadow="never"
        style="margin-bottom: 12px"
      >
        <template #header>
          <b>{{ grp.title }}</b>
          <span
            v-if="grp.hint"
            class="hint"
          >{{ grp.hint }}</span>
        </template>
        <div
          v-for="row in grp.m?.rows || []"
          :key="row.bank"
          class="rate-card"
        >
          <div class="rate-card-head">
            <b>{{ row.bank }}</b>
            <span class="rate-card-meta">
              {{ dataYear(row.dataDate) }}
              <el-tag
                :type="reliabilityTagType(row.reliability)"
                effect="plain"
                size="small"
              >
                可靠 {{ row.reliability }}
              </el-tag>
            </span>
          </div>
          <div class="rate-chips">
            <div
              v-for="term in grp.m?.terms || []"
              :key="term"
              class="chip"
            >
              <div class="chip-term">
                {{ formatTerm(term) }}
              </div>
              <div
                class="chip-val"
                :class="{
                  best: isBest(grp.m, row.bank, term),
                  unavailable: !!cellUnavailable(grp.m, row.bank, term),
                }"
              >
                {{ cellText(grp.m, row.bank, term) }}
              </div>
              <div
                v-if="cellUnavailable(grp.m, row.bank, term)"
                class="chip-status"
              >
                {{ cellUnavailable(grp.m, row.bank, term) }}
              </div>
            </div>
          </div>
        </div>
      </el-card>
    </template>

    <!-- 桌面端：对比表 -->
    <el-card
      v-if="!isMobile"
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

    <el-card
      v-if="!isMobile"
      shadow="never"
    >
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

/* 移动端利率卡片 */
.rate-card {
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
}
.rate-card:last-child {
  border-bottom: none;
}
.rate-card-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.rate-card-meta {
  font-size: 12px;
  color: #909399;
  display: flex;
  align-items: center;
  gap: 6px;
}
.rate-chips {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}
.chip {
  background: #f7f8fa;
  border-radius: 8px;
  padding: 6px 4px;
  text-align: center;
}
.chip-term {
  font-size: 11px;
  color: #909399;
}
.chip-val {
  font-size: 15px;
  font-weight: 700;
  color: #303133;
}
.chip-val.best {
  color: #c0392b;
}
.chip-val.unavailable {
  color: #c0c4cc;
  text-decoration: line-through;
  font-weight: 400;
}
.chip-status {
  font-size: 10px;
  color: #c0392b;
}
</style>
