<script setup lang="ts">
import { useRoute } from 'vue-router';
const route = useRoute();
</script>

<template>
  <el-container class="app">
    <el-header class="header">
      <div class="brand">
        稳健理财推荐
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
        <el-menu-item index="/products">
          全部产品
        </el-menu-item>
      </el-menu>
      <div class="subtitle">
        平安 · 招商 · 建行 · 网商 · 微众
      </div>
    </el-header>

    <el-main class="main">
      <router-view />
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
  gap: 24px;
  border-bottom: 1px solid #eee;
  background: #fff;
}
.brand {
  font-size: 20px;
  font-weight: 700;
  color: #c0392b;
}
.nav {
  border-bottom: none;
  flex: 1;
}
.subtitle {
  color: #888;
  font-size: 13px;
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
</style>
