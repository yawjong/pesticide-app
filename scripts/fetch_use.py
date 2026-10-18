import json, sys, urllib.request, time, os
from concurrent.futures import ThreadPoolExecutor

lic = json.load(open(sys.argv[1]))
outdir = sys.argv[2]
nthreads = int(sys.argv[3])
os.makedirs(outdir, exist_ok=True)

v = [x for x in lic if not x['撤銷類別'] and x['許可證字'] in ('農藥製', '農藥進')]
seen = set(); first = []; rest = []
for x in v:
    k = (x['農藥代號'], x['劑型'], x['含量'])
    (rest if k in seen else first).append(x['農藥使用範圍連結'])
    seen.add(k)
todo = first + rest
done = [0]; t0 = time.time()


def fname(url):
    return os.path.join(outdir, url.split('?')[1].replace('&', '_').replace('=', '') + '.json')


def get(url):
    fn = fname(url)
    if os.path.exists(fn):
        return 0
    for i in range(4):
        try:
            with urllib.request.urlopen(url, timeout=60) as r:
                b = r.read()
            json.loads(b)
            open(fn, 'wb').write(b)
            done[0] += 1
            if done[0] % 100 == 0:
                print(done[0], round(time.time() - t0), flush=True)
            return 0
        except Exception:
            time.sleep(2 * (i + 1))
    return 1


print('first', len(first), 'total', len(todo), flush=True)
with ThreadPoolExecutor(nthreads) as ex:
    fails = sum(ex.map(get, todo))
print('DONE fails', fails, flush=True)
