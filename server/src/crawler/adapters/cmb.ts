import axios from 'axios';
import type { SourceAdapter } from '../adapter.js';
import type { RawProduct } from '../../types.js';

// 招商银行实时金融信息站点的储蓄存款挂牌利率接口（公开、返回 JSON）
const API = 'https://fin.paas.cmbchina.com/fininfo/api/firm-rate/cn';
const REFERER = 'https://fin.paas.cmbchina.com/fininfo/firmrate';
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

// 接口 term 字段 → 期限（天）。仅取整存整取 1/2/3/5 年。
const TERM_DAYS: Record<string, number> = {
  一年: 365,
  二年: 730,
  三年: 1095,
  五年: 1825,
};

interface FirmRateVO {
  termKey?: string;
  term?: string;
  currency_10_fbzj?: string | null; // 人民币（非保证金）挂牌利率
}

interface FirmRateResp {
  returnCode?: string;
  body?: {
    ratedate_rmb_fbzj?: string;
    firmRateVOS?: FirmRateVO[];
  };
}

/**
 * 招商银行 储蓄存款挂牌利率（整存整取 1/2/3/5 年）。
 * 数据来自招商银行官方实时金融信息站点的 JSON 接口，可靠等级标为「高」。
 */
export const cmbAdapter: SourceAdapter = {
  name: '招商银行官网',
  async fetch(): Promise<RawProduct[]> {
    const products: RawProduct[] = [];
    try {
      const { data } = await axios.get<FirmRateResp>(API, {
        timeout: 15000,
        headers: { 'User-Agent': UA, Referer: REFERER, Accept: 'application/json' },
      });

      if (data?.returnCode !== 'SUC0000' || !data.body?.firmRateVOS) {
        console.warn(`[crawler] 招商银行 接口返回异常：${data?.returnCode ?? '无返回码'}`);
        return products;
      }

      const dataDate = data.body.ratedate_rmb_fbzj ?? null;

      for (const vo of data.body.firmRateVOS) {
        // 只取「整存整取」且在目标期限内的条目
        if (!vo.termKey?.includes('整存整取')) continue;
        const termDays = vo.term ? TERM_DAYS[vo.term] : undefined;
        if (!termDays) continue;
        const rate = vo.currency_10_fbzj != null ? Number(vo.currency_10_fbzj) : NaN;
        if (!Number.isFinite(rate)) continue;

        products.push({
          bank: '招商',
          category: '定期存款',
          name: `招商银行 整存整取 ${vo.term}`,
          code: `CMB-DEP-${termDays}`, // 与示例数据同 code，保证去重合并
          riskLevel: '存款保险',
          yieldType: '存款利率',
          yieldMin: rate,
          yieldMax: rate,
          termDays,
          minAmount: 50,
          startDate: dataDate,
          principalSecured: 1,
          status: '在售',
          reliability: '高',
          dataDate,
          sourceName: '招商银行官网',
          sourceUrl: REFERER,
          isSample: 0,
        });
      }

      console.log(`[crawler] 招商银行 解析到 ${products.length} 条真实挂牌利率（日期 ${dataDate}）`);
    } catch (err) {
      console.warn(`[crawler] 招商银行 抓取失败：${(err as Error).message}`);
    }
    return products;
  },
};
