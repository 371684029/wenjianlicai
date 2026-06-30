<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { fetchProducts, fetchMeta, type Product, type Meta, type ProductQuery } from '../api';
import ProductTable from '../components/ProductTable.vue';
import { useIsMobile } from '../useIsMobile';

const { isMobile } = useIsMobile();

const items = ref<Product[]>([]);
const meta = ref<Meta | null>(null);
const loading = ref(false);

const filters = reactive<ProductQuery>({
  bank: undefined,
  category: undefined,
  riskLevel: undefined,
  stableOnly: true,
  availableOnly: false,
  sort: 'score',
});

async function load() {
  loading.value = true;
  try {
    items.value = await fetchProducts({ ...filters });
  } finally {
    loading.value = false;
  }
}

function reset() {
  filters.bank = undefined;
  filters.category = undefined;
  filters.riskLevel = undefined;
  filters.stableOnly = true;
  filters.availableOnly = false;
  filters.sort = 'score';
  load();
}

onMounted(async () => {
  meta.value = await fetchMeta();
  await load();
});
</script>

<template>
  <div>
    <el-card
      shadow="never"
      style="margin-bottom: 16px"
    >
      <el-form
        :inline="!isMobile"
        class="filter-form"
      >
        <el-form-item label="银行">
          <el-select
            v-model="filters.bank"
            placeholder="全部"
            clearable
            style="width: 120px"
          >
            <el-option
              v-for="b in meta?.banks || []"
              :key="b"
              :label="b"
              :value="b"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="类型">
          <el-select
            v-model="filters.category"
            placeholder="全部"
            clearable
            style="width: 140px"
          >
            <el-option
              v-for="c in meta?.categories || []"
              :key="c"
              :label="c"
              :value="c"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="风险">
          <el-select
            v-model="filters.riskLevel"
            placeholder="全部"
            clearable
            style="width: 120px"
          >
            <el-option
              v-for="r in meta?.riskLevels || []"
              :key="r"
              :label="r"
              :value="r"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="排序">
          <el-select
            v-model="filters.sort"
            style="width: 140px"
          >
            <el-option
              label="综合推荐"
              value="score"
            />
            <el-option
              label="收益最高"
              value="yield"
            />
            <el-option
              label="期限最短"
              value="term"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="仅稳健">
          <el-switch v-model="filters.stableOnly" />
        </el-form-item>
        <el-form-item label="仅在售">
          <el-switch v-model="filters.availableOnly" />
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            @click="load"
          >
            查询
          </el-button>
          <el-button @click="reset">
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never">
      <template #header>
        <b>产品列表</b><span class="count">共 {{ items.length }} 条</span>
      </template>
      <ProductTable
        :items="items"
        :loading="loading"
        :show-score="filters.sort === 'score'"
      />
    </el-card>
  </div>
</template>

<style scoped>
.count {
  margin-left: 8px;
  color: #909399;
  font-size: 13px;
}

/* 移动端：筛选项纵向铺满 */
@media (max-width: 768px) {
  .filter-form :deep(.el-form-item) {
    display: flex;
    margin-bottom: 12px;
  }
  .filter-form :deep(.el-form-item__content) {
    flex: 1;
  }
  .filter-form :deep(.el-select) {
    width: 100% !important;
  }
}
</style>
