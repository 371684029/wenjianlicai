<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { postManualImport, type ManualRow, type ImportResult } from '../api';

const router = useRouter();
const text = ref<string>(`# 一行一条,字段用 | 或逗号分隔,顺序:
# 银行 | 类别 | 产品名 | 利率 | 期限 | 起购金额 | 数据日期
#
# 类别: 活期理财 / 定期理财 / 定期存款 / 大额存单
# 银行: 平安 / 招商 / 建设 / 网商 / 微众
# 利率: 单值如 2.5 或区间 2.0-3.0
# 期限: 1年 / 6个月 / 180天 / 活期 / 0 (活期理财)
# 起购金额与日期可省略 (省略时各类别有合理默认值)
# 以 # 开头的行被忽略
#
# 示例:
# 招商 | 定期理财 | 招银理财招睿增瑞180天持有期8号 | 2.6-3.0 | 180天 | 10000 | 2026-06-30
# 微众 | 定期存款 | 微众银行整存整取3年 | 1.60 | 3年 | 50 | 2026-06-16
# 平安 | 活期理财 | 平安理财天天成长现金管理 | 1.6-1.8 | 活期 | 1 | 2026-06-30
`);
const preview = ref<ManualRow[]>([]);
const errors = ref<{ line: number; text: string; reason: string }[]>([]);
const result = ref<ImportResult | null>(null);
const submitting = ref(false);

const BANKS = ['平安', '招商', '建设', '网商', '微众'];
const CATEGORIES = ['活期理财', '定期理财', '定期存款', '大额存单'];

function parseYield(s: string): { yieldMin: number; yieldMax: number } | null {
  const m = s.match(/(\d+\.?\d*)\s*(?:[-~到]\s*(\d+\.?\d*))?/);
  if (!m) return null;
  const lo = parseFloat(m[1]);
  const hi = m[2] ? parseFloat(m[2]) : lo;
  if (!Number.isFinite(lo) || lo <= 0) return null;
  return { yieldMin: lo, yieldMax: hi };
}

function parseTerm(s: string): number | null {
  const t = s.trim();
  if (!t || t === '活期' || t === '0' || t === '-') return 0;
  const m = t.match(/(\d+)\s*(年|个月|周|天)/);
  if (m) {
    const v = parseInt(m[1], 10);
    switch (m[2]) {
      case '年': return v * 365;
      case '个月': return v * 30;
      case '周': return v * 7;
      case '天': return v;
    }
  }
  if (/^\d+$/.test(t)) return parseInt(t, 10);
  return null;
}

function parseLine(line: string): ManualRow | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return null;
  const fields = trimmed.split(/[|,\t]+/).map((f) => f.trim());
  if (fields.length < 4) throw new Error(`字段数不足:需要≥4 (银行|类别|产品名|利率),实际 ${fields.length}`);
  const [bank, category, name, ratioRaw, termRaw, minRaw, dateRaw] = [...fields, '', '', '', '', '', ''].slice(0, 7) as string[];
  if (!BANKS.includes(bank)) throw new Error(`非法银行"${bank}"`);
  if (!CATEGORIES.includes(category)) throw new Error(`非法类别"${category}"`);
  if (!name) throw new Error(`产品名不能为空`);
  const y = parseYield(ratioRaw);
  if (!y) throw new Error(`非法利率"${ratioRaw}"`);
  let termDays = 0;
  if (termRaw && termRaw !== '活期' && termRaw !== '0' && termRaw !== '-') {
    const term = parseTerm(termRaw);
    if (term === null) throw new Error(`无法解析期限"${termRaw}"`);
    termDays = term;
  }
  let minAmount = 0;
  if (minRaw && /^\d+(\.\d+)?$/.test(minRaw)) minAmount = parseFloat(minRaw);
  else if (category === '定期存款') minAmount = 50;
  else if (category === '大额存单') minAmount = 200000;
  else minAmount = 1;
  let dataDate: string | null = null;
  if (dateRaw && /^\d{4}-\d{1,2}-\d{1,2}$/.test(dateRaw)) dataDate = dateRaw;
  return {
    bank, category, name,
    code: null,
    riskLevel: null,
    yieldType: null,
    yieldMin: y.yieldMin, yieldMax: y.yieldMax,
    termDays,
    minAmount,
    dataDate,
    sourceUrl: null,
    status: null,
  };
}

function doParse() {
  preview.value = [];
  errors.value = [];
  const lines = text.value.split(/\r?\n/);
  lines.forEach((line, idx) => {
    try {
      const row = parseLine(line);
      if (row) preview.value.push(row);
    } catch (e) {
      errors.value.push({ line: idx + 1, text: line, reason: (e as Error).message });
    }
  });
}

async function submit() {
  doParse();
  if (preview.value.length === 0) {
    result.value = { ok: 0, failed: [], };
    return;
  }
  submitting.value = true;
  try {
    result.value = await postManualImport(preview.value);
  } catch (e) {
    result.value = { ok: 0, failed: [], };
    alert(`提交失败: ${(e as Error).message}`);
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="manual-import">
    <div class="head">
      <h3>手工补录数据</h3>
      <p class="lead">在页面下方粘贴文本一行一条产品,核对预览后提交。数据进入 <code>products</code> 表,
      <code>isSample=0</code>,<code>sourceName=手工补录</code>。把首页 <span class="ink" @click="router.push('/')">CoverageBanner</span>
      提示缺失的格一条条补上即可。</p>
    </div>

    <el-input
      v-model="text"
      type="textarea"
      :rows="14"
      placeholder="一行一条产品 ..."
      class="textarea"
    />

    <div class="actions">
      <el-button @click="doParse" :disabled="submitting">解析预览</el-button>
      <el-button type="primary" @click="submit" :loading="submitting">提交入库</el-button>
      <el-button text @click="router.push('/')">回到首页查看覆盖率</el-button>
    </div>

    <el-alert v-if="errors.length > 0" type="error" :closable="false" class="alert">
      <div class="err-head">{{ errors.length }} 行解析失败:</div>
      <ul class="err-list">
        <li v-for="e in errors" :key="e.line">
          <strong>第 {{ e.line }} 行</strong>: {{ e.reason }}
          <code class="err-text">{{ e.text }}</code>
        </li>
      </ul>
    </el-alert>

    <el-alert v-if="result" :type="result.ok > 0 ? 'success' : 'error'" :closable="false" class="alert">
      <div>已成功入库 {{ result.ok }} 条。</div>
      <div v-if="result.failed.length">
        失败 {{ result.failed.length }} 条:
        <ul>
          <li v-for="f in result.failed" :key="f.row">
            第 {{ f.row }} 条 {{ f.input.bank }}・{{ f.input.category }}(原因: {{ f.reason }})
          </li>
        </ul>
      </div>
      <div v-if="result.ok > 0" class="after-success">
        <el-button @click="router.push('/')">回首页查看更新后的覆盖率</el-button>
      </div>
    </el-alert>

    <section v-if="preview.length > 0" class="preview">
      <h4>预览 ({{ preview.length }} 条)</h4>
      <table>
        <thead>
          <tr><th>银行</th><th>类别</th><th>产品名</th><th>利率</th><th>期限(天)</th><th>起购</th><th>日期</th></tr>
        </thead>
        <tbody>
          <tr v-for="(r, idx) in preview" :key="idx">
            <td>{{ r.bank }}</td><td>{{ r.category }}</td><td>{{ r.name }}</td>
            <td>{{ r.yieldMin }}~{{ r.yieldMax }}</td>
            <td>{{ r.termDays }}</td><td>{{ r.minAmount }}</td>
            <td>{{ r.dataDate ?? '—' }}</td>
          </tr>
        </tbody>
      </table>
    </section>
  </div>
</template>

<style scoped>
.manual-import { padding: 4px; }
.head { margin-bottom: 12px; }
.head h3 { margin: 0 0 6px 0; }
.lead { color: #666; font-size: 13px; line-height: 1.6; }
.lead code { background: #f5f5f5; padding: 1px 4px; border-radius: 3px; }
.ink { color: #409eff; cursor: pointer; text-decoration: underline; }
.textarea { font-family: Consolas, "Courier New", monospace; font-size: 13px; }
.actions { margin: 12px 0; display: flex; gap: 8px; }
.alert { margin: 10px 0; }
.err-head { font-weight: 600; margin-bottom: 4px; }
.err-list { margin: 0; padding-left: 20px; }
.err-text { background: #f9f9f9; color: #999; padding: 1px 4px; margin-left: 6px; }
.after-success { margin-top: 8px; }
.preview { margin-top: 18px; }
.preview h4 { margin: 0 0 8px 0; font-size: 14px; }
table { width: 100%; border-collapse: collapse; font-size: 13px; }
th, td { border: 1px solid #ebeef5; padding: 6px 8px; text-align: left; }
thead th { background: #fafafa; }

@media (max-width: 768px) {
  table { font-size: 11px; }
  th, td { padding: 4px 6px; }
  .lead { font-size: 11px; }
}
</style>