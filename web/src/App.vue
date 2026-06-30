<script setup lang="ts">
import { useRoute } from 'vue-router';
import CoverageBanner from './components/CoverageBanner.vue';
const route = useRoute();
</script>

<template>
  <el-container class="app">
    <el-header class="header">
      <div class="header-top">
        <div class="brand">
          稳健理财推荐
        </div>
        <div class="subtitle">
          平安 · 招商 · 建行 · 网商 · 微众
        </div>
      </div>
      <el-menu
        :default-active="route.path"
        mode="horizontal"
        router
        class="nav"
      >
        <el-menu-item index="/">
          推荐榜单
        </el-menu-item>
        <el-menu-item index="/rates">
          存款利率
        </el-menu-item>
        <el-menu-item index="/products">
          全部产品
        </el-menu-item>
      </el-menu>
    </el-header>

    <el-main class="main">
      <div class="page-container">
        <CoverageBanner />
        <router-view />
      </div>
    </el-main>

    <el-footer class="footer">
      <p>
        数据来自公开渠道，仅供参考，以各银行官方为准；理财非存款、不保本，过往业绩不代表未来收益；
        存款类受《存款保险条例》保障（50 万元以内本息全额偿付）。本平台不提供投资建议。
      </p>
    </el-footer>
  </el-container>
</template>

<style scoped>
.app {
  min-height: 100vh;
}
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  height: auto;
  padding: 0 20px;
  border-bottom: 1px solid #eee;
  background: #fff;
}
.header-top {
  display: flex;
  align-items: baseline;
  gap: 12px;
}
.brand {
  font-size: 20px;
  font-weight: 700;
  color: #c0392b;
  white-space: nowrap;
}
.nav {
  border-bottom: none;
}
.subtitle {
  color: #888;
  font-size: 13px;
  white-space: nowrap;
}
.main {
  background: #f5f7fa;
  padding: 20px;
}
.footer {
  height: auto;
  padding: 14px 20px;
  background: #fafafa;
  border-top: 1px solid #eee;
  color: #999;
  font-size: 12px;
  line-height: 1.6;
}

/* 移动端：头部纵向堆叠，菜单铺满 */
@media (max-width: 768px) {
  .header {
    flex-direction: column;
    align-items: stretch;
    gap: 0;
    padding: 8px 12px 0;
  }
  .header-top {
    justify-content: space-between;
    padding-bottom: 6px;
  }
  .brand {
    font-size: 17px;
  }
  .subtitle {
    font-size: 11px;
    color: #aaa;
  }
  .nav {
    width: 100%;
    display: flex;
    justify-content: space-around;
  }
  .nav :deep(.el-menu-item) {
    padding: 0 10px;
    flex: 1;
    text-align: center;
    justify-content: center;
  }
  .footer {
    padding: 12px;
    font-size: 11px;
  }
}
</style>
