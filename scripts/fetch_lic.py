import json, sys, urllib.request, ssl, os
out=sys.argv[1]
os.makedirs(os.path.dirname(out) or ".", exist_ok=True)
base="https://data.moa.gov.tw/Service/OpenData/FromM/PesticideData.aspx?IsTransData=1&UnitId=034&$top=1000&$skip="
allr=[]; skip=0
while True:
    with urllib.request.urlopen(base+str(skip), timeout=120) as r:
        d=json.load(r)
    allr+=d
    print(skip,len(d),flush=True)
    if len(d)<1000: break
    skip+=1000
json.dump(allr,open(out,'w'),ensure_ascii=False)
print('total',len(allr))
