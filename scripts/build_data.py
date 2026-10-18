"""Build compact data.json for the pesticide lookup app.

usage: python3 -I build_data.py lic_all.json use_dir out.json
"""
import json, sys, os, hashlib, datetime

lic = json.load(open(sys.argv[1]))
use_dir = sys.argv[2]
out = sys.argv[3]


def fname(url):
    return os.path.join(use_dir, url.split('?')[1].replace('&', '_').replace('=', '') + '.json')


def roc(s):
    s = (s or '').strip()
    if len(s) == 7 and s.isdigit():
        return f"{s[:3]}/{s[3:5]}/{s[5:]}"
    return s.replace(' ', '') if s.replace('/', '').strip() else ''


def clean(s):
    s = (s or '').strip()
    return '' if s in ('-', '－', '--') else s


uses = []          # unique usage tables
use_index = {}     # hash -> idx
group_rep = {}     # formulation key -> use idx (from a license actually fetched)

valid = [x for x in lic if not x['撤銷類別'] and x['許可證字'] in ('農藥製', '農藥進')]
revoked = [x for x in lic if x['撤銷類別'] and x['許可證字'] in ('農藥製', '農藥進')]


def load_use(x):
    fn = fname(x['農藥使用範圍連結'])
    if not os.path.exists(fn):
        return None
    rows = json.load(open(fn))
    table = []
    for r in rows:
        note = '；'.join(t for t in (clean(r.get('備註')), clean(r.get('注意事項'))) if t)
        table.append([
            clean(r.get('作物名稱')), clean(r.get('病蟲害名稱')), clean(r.get('稀釋倍數')),
            clean(r.get('每公頃使用用藥量')), clean(r.get('使用時期')), clean(r.get('施藥間隔')),
            clean(r.get('安全採收期')), clean(r.get('施用次數')), clean(r.get('施藥方法')), note,
        ])
    table.sort(key=lambda t: (t[0], t[1]))
    h = hashlib.md5(json.dumps(table, ensure_ascii=False).encode()).hexdigest()
    if h not in use_index:
        use_index[h] = len(uses)
        uses.append(table)
    return use_index[h]


products = []
missing = 0
inferred = 0
pending = []
for x in valid:
    k = (x['農藥代號'], x['劑型'], x['含量'])
    u = load_use(x)
    if u is not None:
        group_rep.setdefault(k, u)
    pending.append((x, k, u))

for x, k, u in pending:
    flag = 0
    if u is None:
        u = group_rep.get(k, -1)
        if u == -1:
            missing += 1
        else:
            inferred += 1
            flag = 1
    products.append([
        x['許可證字'].replace('農藥', '') + x['許可證號'],   # 0 license e.g. 製05657
        clean(x['廠牌名稱']),                               # 1 brand
        clean(x['中文名稱']),                               # 2 common name
        clean(x['英文名稱']),                               # 3 english
        clean(x['劑型']),                                   # 4 formulation
        clean(x['含量']).replace(' ', ''),                  # 5 content
        roc(x['有效期限']),                                 # 6 expiry
        clean(x['廠商名稱']),                               # 7 company
        clean(x['國外原製造廠商']),                         # 8 foreign maker
        clean(x['農藥分類中文意義']),                       # 9 class (殺蟲劑...)
        clean(x['農藥類別中文意義']),                       # 10 chemical group
        clean(x['IRAC殺蟲劑抗藥性']) or '',                 # 11
        clean(x['FRAC殺菌劑抗藥性']) or '',                 # 12
        clean(x['HRAC除草劑抗藥性']) or '',                 # 13
        u,                                                  # 14 usage idx (-1 none)
        flag,                                               # 15 1 = usage borrowed from same formulation
        clean(x['農藥代號']),                               # 16 code
    ])

rev = []
for x in revoked:
    rev.append([
        x['許可證字'].replace('農藥', '') + x['許可證號'], clean(x['廠牌名稱']), clean(x['中文名稱']),
        clean(x['劑型']), clean(x['含量']).replace(' ', ''), clean(x['廠商名稱']),
        clean(x['撤銷類別']), roc(x['撤銷日期']),
    ])

data = {
    'updated': datetime.date.today().isoformat(),
    'products': products,
    'uses': uses,
    'revoked': rev,
}
json.dump(data, open(out, 'w'), ensure_ascii=False, separators=(',', ':'))
print('products', len(products), 'uses', len(uses), 'rows', sum(len(u) for u in uses),
      'inferred', inferred, 'missing', missing, 'revoked', len(rev),
      'bytes', os.path.getsize(out))
