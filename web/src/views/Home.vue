<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { fetchRecommend, fetchMeta, type Product, type Meta } from '../api';
import ProductTable from '../components/ProductTable.vue';

const items = ref<Product[]>([]);
const meta = ref<Meta | null>(null);
const loading = ref(false);

onMounted(async () => {
  loading.value = true;
  try {
    const [rec, m] = await Promise.all([fetchRecommend(10), fetchMeta()]);
    items.value = rec;
    meta.value = m;
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div>
    <el-alert
      type="success"
      :closable="false"
      title="稳健优先的高收益榜单"
      description="默认仅展示「存款 / R1 / R2」低风险产品，按「收益高 + 稳健 + 数据新鲜」综合打分排序。"
      show-icon
      style="margin-bottom: 16px"
    />

    <el-row
      v-if="meta"
      :gutter="16"
      style="margin-bottom: 16px"
    >
      <el-col :span="6">
        <el-card shadow="never">
          <div class="stat">
            <div class="num">
              {{ meta.total }}
            </div><div class="label">
              收录产品
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never">
          <div class="stat">
            <div class="num">
              {{ meta.banks.length }}
            </div><div class="label">
              覆盖银行
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never">
          <div class="stat">
            <div class="num">
              {{ meta.categories.length }}
            </div><div class="label">
              产品类型
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never">
          <div class="stat">
            <div class="num">
              {{ meta.lastUpdated ? meta.lastUpdated.slice(0, 10) : '-' }}
            </div><div class="label">
              最近更新
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="never">
      <template #header>
        <b>Top 10 推荐</b>
      </template>
      <ProductTable
        :items="items"
        :loading="loading"
        :show-score="true"
      />
    </el-card>
  </div>
</template>

<style scoped>
.stat {
  text-align: center;
}
.num {
  font-size: 24px;
  font-weight: 700;
  color: #303133;
}
.label {
  color: #909399;
  font-size: 13px;
}
</style>
